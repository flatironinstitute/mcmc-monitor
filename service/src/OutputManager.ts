import fs from 'fs'

type MCMCRun = {
    runId: string
}

type MCMCChain = {
    runId: string
    chainId: string
    variableNames: string[]
    rawHeader?: string
    rawFooter?: string
    variablePrefixesExcluded?: string[]
}

class OutputManager {
    #chainFiles: {[key: string]: ChainFile} = {} // by runId/chainId
    constructor(private dir: string) {

    }
    async getRuns(): Promise<MCMCRun[]> {
        const runs: MCMCRun[] = []
        const x = await fs.promises.readdir(this.dir)
        for (const fname of x) {
            const p = `${this.dir}/${fname}`
            const s = await fs.promises.stat(p)
            if (s.isDirectory()) {
                runs.push({runId: fname})
            }
        }
        return runs
    }
    async getChainsForRun(runId: string): Promise<MCMCChain[]> {
        const chains: MCMCChain[] = []
        const path = `${this.dir}/${runId}`
        const fnames = await fs.promises.readdir(path)
        for (const fname of fnames) {
            if (fname.endsWith('.csv')) {
                const chainId = chainIdFromCsvFileName(fname)
                const p = `${path}/${fname}`
                const kk = `${runId}/${chainId}`
                if (!this.#chainFiles[kk]) {
                    this.#chainFiles[kk] = new ChainFile(p, chainId)
                }
                const cf = this.#chainFiles[kk]
                await cf.update()
                chains.push({
                    runId,
                    chainId,
                    variableNames: cf.variableNames,
                    rawHeader: cf.rawHeader,
                    rawFooter: cf.rawFooter,
                    variablePrefixesExcluded: cf.variablePrefixesExcluded
                })
            }
        }
        return chains
    }
    async getSequenceData(runId: string, chainId: string, variableName: string, startPosition: number): Promise<{data: number[]}> {
        const kk = `${runId}/${chainId}`
        const p = await this._getPathForChainId(runId, chainId)
        if (!p) return {data: []}
        
        if (!this.#chainFiles[kk]) {
            this.#chainFiles[kk] = new ChainFile(p, chainId)
        }
        const cf = this.#chainFiles[kk]
        await cf.update()
        const data = cf.sequenceData(variableName, startPosition)
        return {
            data
        }
    }
    async _getPathForChainId(runId: string, chainId: string) {
        const p = `${this.dir}/${runId}/${chainId}.csv`
        if (fs.existsSync(p)) return p
        const x = await fs.promises.readdir(`${this.dir}/${runId}`)
        for (const fname of x) {
            if (fname.endsWith('.csv')) {
                const chainId2 = chainIdFromCsvFileName(fname)
                if (chainId2 === chainId) {
                    return `${this.dir}/${runId}/${fname}`
                }
            }
        }
        return undefined
    }
}

class ChainFile {
    #columnNames: string[] | undefined = undefined
    #columnIndicesToInclude: number[] | undefined = undefined
    #variablePrefixesExcluded: string[] | undefined = undefined
    #rows: {values: string[]}[] = []
    #rawHeaderLines: string[] = []
    #rawFooterLines: string[] = []
    #inHeader = true
    #inFooter = false
    #filePosition = 0
    #updating = false
    #timestampLastUpdate = 0
    constructor(private path: string, public chainId: string) {
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
                            const {inds, excludedPrefixes} = determineColumnIndicesToInclude(vals)
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

function determineColumnIndicesToInclude(vars: string[]): {inds: number[], excludedPrefixes: string[]} {
    const prefixCounts: {[prefix: string]: number} = {}
    for (const v of vars) {
        const prefix = v.split('.')[0] || ''
        prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1
    }
    const excludedPrefixes = Object.keys(prefixCounts).filter(prefix => (prefixCounts[prefix] > 100)).sort()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inds = vars.map((v, i) => ({v, i})).filter(({v, i}) => {
        const prefix = v.split('.')[0] || ''
        return !excludedPrefixes.includes(prefix)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }).map(({v, i}) => (i))
    return {inds, excludedPrefixes}
}

function chainIdFromCsvFileName(path: string) {
    const a = path.slice(0, path.length - '.csv'.length)
    const ii = a.lastIndexOf('_')
    if (ii >= 0) {
        if (isIntString(a.slice(ii + 1))) {
            return `chain_${a.slice(ii + 1)}`
        }
    }
    return a
}

function isIntString(x: string) {
    return (parseInt(x) + '') === x
}

function sleepMsec(msec: number) {
    return new Promise(resolve => {
        setTimeout(resolve, msec)
    })
}

export default OutputManager