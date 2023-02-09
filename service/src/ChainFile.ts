import fs from 'fs'
import path from 'path'
import YAML from 'js-yaml'

class ChainFile {
    #columnNames: string[] | undefined = undefined
    #columnIndicesToInclude: number[] | undefined = undefined
    #variablePrefixesExcluded: string[] | undefined = undefined
    #rows: {values: string[]}[]
    #rawHeaderLines: string[]
    #rawFooterLines: string[]
    #inHeader: boolean
    #inFooter: boolean
    #filePosition: number
    #updating: boolean
    #timestampLastUpdate: number
    #fileStats: fs.Stats
    #runConfig: {includeVariables?: string[]}
    #runConfigFileStats: fs.Stats | undefined
    constructor(public path: string, public chainId: string) {
        this._reset()
    }
    _reset() {
        this.#columnNames = undefined
        this.#columnIndicesToInclude = undefined
        this.#variablePrefixesExcluded = undefined
        this.#rows = []
        this.#rawHeaderLines = []
        this.#rawFooterLines = []
        this.#inHeader = true
        this.#inFooter = false
        this.#filePosition = 0
        this.#updating = false
        this.#timestampLastUpdate = 0
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
    sequenceData(variableName: string, startPosition: number): number[] {
        if (!this.#columnNames) return []
        const i = this.#columnNames.indexOf(variableName)
        if (i < 0) return []
        return this.#rows.slice(startPosition).map(r => (
            r.values[i] !== undefined ? parseFloat(r.values[i]) : 0
        ))
    }
    async update() {
        if (this.#updating) {
            while (this.#updating) {
                await sleepMsec(50)
            }
            return
        }
        if (!fs.existsSync(this.path)) {
            // maybe the directory has disappeared -- we'll handle this case elsewhere
            return
        }

        const doReset = () => {
            this._reset()
            this.#updating = true // updating gets reset to false in this._reset()
        }

        const stats = fs.statSync(this.path)
        if (stats.birthtimeMs !== this.#fileStats.birthtimeMs) {
            console.warn(`File creation date changed, resetting: ${this.path}`)
            doReset()
        }

        const runConfigYamlPath = `${path.dirname(this.path)}/mcmc-run.yaml`
        if (fs.existsSync(runConfigYamlPath)) {
            if (!this.#runConfigFileStats) {
                console.warn(`New run config file. Resetting: ${this.path}`)
                doReset()
            }
            else {
                const newStats = fs.statSync(runConfigYamlPath)
                if (newStats.mtimeMs !== this.#runConfigFileStats.mtimeMs) {
                    console.warn(`Run config file has been modified. Resetting: ${this.path}`)
                    doReset()
                }
            }
        }
        else {
            if (this.#runConfigFileStats) {
                console.warn(`Run config file has been deleted. Resetting: ${this.path}`)
                doReset()
            }
        }

        const elapsed = Date.now() - this.#timestampLastUpdate
        if (elapsed < 5000) {
            // don't update too frequently, we might be getting a large number of requests in a short time
            return
        }
        this.#updating = true
        try {
            // read the file starting from where we left off
            let fp = this.#filePosition
            const ff = await fs.promises.open(this.path)
            const chunks: Buffer[] = []
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const chunk = await ff.read({position: fp})
                if (chunk.bytesRead) {
                    chunks.push(chunk.buffer)
                    fp += chunk.bytesRead
                }
                else {
                    break
                }
            }
            await ff.close()
            const data = Buffer.concat(chunks)
            let txt = data.toString('utf8')
            if (txt.length !== data.byteLength) {
                console.warn(`WARNING: Text length does not match data byte length when reading ${this.path}.`)
            }
            // this is the tricky part, we don't want to read a partial line
            const ii = txt.lastIndexOf('\n')
            if (ii >= 0) {
                txt = txt.slice(0, ii)
                this.#filePosition += txt.length + 1
            }
            else {
                txt = ''
            }

            const lines = txt.split('\n')
            for (const line of lines) {
                if (line.startsWith('#')) {
                    if (this.#inHeader) {
                        this.#rawHeaderLines.push(line)
                    }
                    else {
                        if (this.#inFooter) {
                            this.#rawFooterLines.push(line)
                        }
                        else {
                            if (!line.slice(1).trim()) {
                                this.#inFooter = true
                            }
                        }
                    }
                }
                else if (line.length > 0) {
                    if (this.#inFooter) {
                        console.warn(`Unexpected non-comment in footer: ${line}`)
                    }
                    else {
                        this.#inHeader = false
                        const vals = line.trim().split(',')
                        if (!this.#columnNames) {
                            const {inds, excludedPrefixes} = determineColumnIndicesToInclude(vals, this.#runConfig.includeVariables || [])
                            this.#columnIndicesToInclude = inds
                            this.#variablePrefixesExcluded = excludedPrefixes
                            this.#columnNames = this.#columnIndicesToInclude.map(i => (vals[i]))
                        }
                        else {
                            const vals2 = this.#columnIndicesToInclude.map(i => (vals[i]))
                            this.#rows.push({values: vals2})
                        }
                    }
                }
            }
        }
        catch(err) {
            console.warn(`Problem updating ${this.path}: ${err.message}`)
        }
        this.#updating = false
        this.#timestampLastUpdate = Date.now()
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

export default ChainFile