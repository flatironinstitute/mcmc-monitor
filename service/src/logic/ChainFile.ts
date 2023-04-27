import fs from 'fs'
import YAML from 'js-yaml'
import path from 'path'

type Filesegment = 'header' | 'body' | 'footer'

const MIN_ELAPSED_TIME_BETWEEN_UPDATES_MS = 5000
const ACTIVE_UPDATE_SLEEP_INTERVAL_MS = 50

class ChainFile {
    #columnNames: string[] | undefined = undefined
    #columnIndicesToInclude: number[] | undefined = undefined
    #variablePrefixesExcluded: string[] | undefined = undefined
    #rows: {values: string[]}[]
    #rawHeaderLines: string[]
    #rawFooterLines: string[]
    #currentSegment: Filesegment = 'header'
    #excludedInitialIterationCount: number | undefined = undefined
    #filePosition: number
    #updating: boolean
    #timestampLastUpdate: number
    #timestampLastChange: number
    #fileStats: fs.Stats
    #runConfig: {includeVariables?: string[]}
    #runConfigFileStats: fs.Stats | undefined
    constructor(public path: string, public chainId: string) {
        this._reset()
    }
    _reset(stillUpdating = false) {
        this.#columnNames = undefined
        this.#columnIndicesToInclude = undefined
        this.#variablePrefixesExcluded = undefined
        this.#rows = []
        this.#rawHeaderLines = []
        this.#rawFooterLines = []
        this.#currentSegment = 'header'
        this.#excludedInitialIterationCount = undefined
        this.#filePosition = 0
        this.#updating = stillUpdating
        this.#timestampLastUpdate = 0
        this.#timestampLastChange = 0
        this.#fileStats = fs.statSync(this.path)

        const runConfigYamlPath = `${path.dirname(this.path)}/mcmc-run.yaml`
        if (fs.existsSync(runConfigYamlPath)) {
            const yaml = fs.readFileSync(runConfigYamlPath, 'utf8')
            this.#runConfig = YAML.load(yaml) || {}
            this.#runConfigFileStats = fs.statSync(runConfigYamlPath)
        }
        else {
            this.#runConfig = {}
            this.#runConfigFileStats = undefined
        }
    }
    public get variableNames() {
        return [...(this.#columnNames || [])]
    }
    public get rawHeader() {
        return this.#rawHeaderLines.join('\n')
    }
    public get rawFooter() {
        return this.#rawFooterLines.join('\n')
    }
    public get variablePrefixesExcluded() {
        return this.#variablePrefixesExcluded
    }
    public get excludedInitialIterationCount() {
        return this.#excludedInitialIterationCount
    }
    public get timestampLastChange() {
        return this.#timestampLastChange
    }
    sequenceData(variableName: string, startPosition: number): number[] {
        if (!this.#columnNames) return []
        const i = this.#columnNames.indexOf(variableName)
        if (i < 0) return []
        return this.#rows.slice(startPosition).map(r => (
            r.values[i] !== undefined ? parseFloat(r.values[i]) : 0
        ))
    }
    checkConfiguration(): void {
        const stats = fs.statSync(this.path)
        if (stats.birthtimeMs !== this.#fileStats.birthtimeMs) {
            console.warn(`File creation date changed, resetting: ${this.path}`)
            this._reset(true)
        }

        const runConfigYamlPath = `${path.dirname(this.path)}/mcmc-run.yaml`
        if (fs.existsSync(runConfigYamlPath)) {
            if (!this.#runConfigFileStats) {
                console.warn(`New run config file. Resetting: ${this.path}`)
                this._reset(true)
            }
            else {
                const newStats = fs.statSync(runConfigYamlPath)
                if (newStats.mtimeMs !== this.#runConfigFileStats.mtimeMs) {
                    console.warn(`Run config file has been modified. Resetting: ${this.path}`)
                    this._reset(true)
                }
            }
        }
        else {
            if (this.#runConfigFileStats) {
                console.warn(`Run config file has been deleted. Resetting: ${this.path}`)
                this._reset(true)
            }
        }
    }
    async update(): Promise<void> {
        if (this.#updating) {
            while (this.#updating) {
                await sleepMsec(ACTIVE_UPDATE_SLEEP_INTERVAL_MS)
            }
            return
        }
        if (!fs.existsSync(this.path)) {
            // maybe the directory has disappeared -- we'll handle this case elsewhere
            return
        }
        this.checkConfiguration()

        const elapsed = Date.now() - this.#timestampLastUpdate
        if (elapsed < MIN_ELAPSED_TIME_BETWEEN_UPDATES_MS) {
            return
        }
        this.#updating = true
        try {
            // read the file starting from where we left off
            const txt = await readNewData(this.#filePosition, this.path)
            if (txt.length > 0) {
                this.#filePosition += txt.length
                this.parseData(txt)
                this.#timestampLastChange = Date.now()
            }
        }
        catch(err) {
            console.warn(`Problem updating ${this.path}: ${err.message}`)
        }
        this.#updating = false
        this.#timestampLastUpdate = Date.now()
    }
    parseData(txt: string): void {
        const lines = txt.split('\n')
        for (const line of lines) {
            if (line.length === 0)
                continue
            if (isComment(line)) {
                this.handleComment(line)
                continue
            }
            // only non-empty non-comments after this point
            switch (this.#currentSegment) {
                case 'footer':
                    console.warn(`Unexpected non-comment in footer: ${line}`)
                    break
                case 'header':
                    this.handleEndOfHeader(line)
                    break
                default:
                    this.handleBodyRow(line)
            }
        }
    }
    handleComment(comment: string): void {
        switch(this.#currentSegment) {
            case 'header':
                this.#rawHeaderLines.push(comment)
                break;
            case 'footer':
                this.#rawFooterLines.push(comment)
                break;
            case 'body':
                // we currently hard-code the rule that the footer starts at the
                // first comment that has no non-whitespace text.
                if (isEmptyComment(comment)) {
                    this.#currentSegment = 'footer'
                }
                // and we hard-code the string '# Adaptation terminated' to indicate end of adaptation.
                if (comment.trim() === '# Adaptation terminated') {
                    this.#excludedInitialIterationCount = this.#rows.length
                }
                break;
            default:
                break;
        }
    }
    handleEndOfHeader(line: string): void {
        // header segment ends at the first non-empty non-comment, which should be the column names
        this.#currentSegment = 'body'
        if (this.#columnNames) {
            console.warn(`Column names set while in header segment: first non-comment line\n${line}`)
        }
        const fieldNames = line.trim().split(',')
        const {inds, excludedPrefixes} = determineColumnIndicesToInclude(fieldNames, this.#runConfig.includeVariables || [])
        this.#columnIndicesToInclude = inds
        this.#variablePrefixesExcluded = excludedPrefixes
        this.#columnNames = this.#columnIndicesToInclude.map(i => (fieldNames[i]))
        if (this.#columnNames.length === 0) {
            console.warn(`Parsing column headers:\n${line}\ndetected no fields to report.`)
        }
    }
    handleBodyRow(line: string): void {
        if (!this.#columnNames) {
            console.warn('Reached file body without setting column names.')
        }
        const fields = line.trim().split(',')
        const desiredFields = this.#columnIndicesToInclude.map(i => (fields[i]))
        this.#rows.push({values: desiredFields})
    }
}


function determineColumnIndicesToInclude(vars: string[], includeVariables: string[]): {inds: number[], excludedPrefixes: string[]} {
    const prefixCounts: {[prefix: string]: number} = {}
    for (const v of vars) {
        const prefix = v.split('.')[0] || ''
        prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1
    }
    const excludedPrefixes = Object.keys(prefixCounts).filter(prefix => (prefixCounts[prefix] > 100)).sort()
    const actuallyExcludedPrefixes = new Set<string>() // some variables may have been manually included in their entirety
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inds = vars.map((v, i) => ({v, i})).filter(({v, i}) => {
        if (includeVariables.includes(v)) return true
        const prefix = v.split('.')[0] || ''
        if (excludedPrefixes.includes(prefix)) {
            actuallyExcludedPrefixes.add(prefix)
            return false
        }
        else return true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }).map(({v, i}) => (i))
    return {inds, excludedPrefixes: [...actuallyExcludedPrefixes].sort()}
}


function sleepMsec(msec: number) {
    return new Promise(resolve => {
        setTimeout(resolve, msec)
    })
}


const readNewData = async (lastReadByte: number, path: string): Promise<string> => {
    const chunks: Buffer[] = []
    const filehandle = await fs.promises.open(path)
    let bytesRead = 0
    while (true) {
        const chunk = await filehandle.read({position: lastReadByte + bytesRead})
        if (chunk.bytesRead) {
            chunks.push(chunk.buffer)
            bytesRead += chunk.bytesRead
        } else {
            break
        }
    }
    await filehandle.close()
    const data = Buffer.concat(chunks)
    let txt = data.toString('utf8') // todo: support other encodings?
    if (txt.length !== data.byteLength) {
        console.warn(`WARNING: Text length does not match data byte length when reading ${path}`)
    }
    // drop any partially-read lines
    const lastNewlineLoc = txt.lastIndexOf('\n')
    txt = lastNewlineLoc >= 0 ? txt.slice(0, lastNewlineLoc + 1) : ''
    return txt
}


const isComment = (line: string): boolean => {
    if (line.startsWith('#')) return true
    return false
}


const isEmptyComment = (line: string): boolean => {
    // TODO: Modify this as needed to accommodate different comment styles
    const trimmed = line.slice(1).trim()
    return trimmed.length === 0
}

export { isComment as TEST_isComment, isEmptyComment as TEST_isEmptyComment }

export default ChainFile
