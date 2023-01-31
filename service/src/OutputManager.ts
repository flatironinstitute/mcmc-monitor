import fs from 'fs'
import { MCMCChain, MCMCRun } from "./MCMCMonitorTypes"

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
                    this.#chainFiles[kk] = new ChainFile(p)
                }
                const cf = this.#chainFiles[kk]
                await cf.update()
                chains.push({
                    runId,
                    chainId,
                    variableNames: cf.variableNames,
                    rawHeader: cf.rawHeader,
                    rawFooter: cf.rawFooter
                })
            }
        }
        return chains
    }
    async getSequenceData(runId: string, chainId: string, variableName: string, startPosition: number): Promise<{data: number[]}> {
        const p = `${this.dir}/${runId}/${chainId}.csv`
        const kk = `${runId}/${chainId}`
        if (!this.#chainFiles[kk]) {
            this.#chainFiles[kk] = new ChainFile(p)
        }
        const cf = this.#chainFiles[kk]
        await cf.update()
        const data = cf.sequenceData(variableName, startPosition)
        return {
            data
        }
    }
}

class ChainFile {
    #columnNames: string[] | undefined = undefined
    #rows: {values: string[]}[] = []
    #rawHeaderLines: string[] = []
    #rawFooterLines: string[] = []
    #inHeader = true
    #inFooter = false
    #filePosition = 0
    #updating = false
    #timestampLastUpdate = 0
    constructor(private path: string) {
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
    sequenceData(variableName: string, startPosition: number): number[] {
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
                            this.#columnNames = vals
                        }
                        else {
                            this.#rows.push({values: vals})
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

function chainIdFromCsvFileName(path: string) {
    return path.slice(0, path.length - '.csv'.length)
}

function sleepMsec(msec: number) {
    return new Promise(resolve => {
        setTimeout(resolve, msec)
    })
}

export default OutputManager