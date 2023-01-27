import { MCMCChain, MCMCRun, MCMCSequence } from "./MCMCMonitorTypes"
import fs from 'fs'

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
                    rawHeader: cf.rawHeader
                })
            }
        }
        return chains
    }
    async getSequence(runId: string, chainId: string, variableName): Promise<MCMCSequence> {
        const p = `${this.dir}/${runId}/${chainId}.csv`
        const kk = `${runId}/${chainId}`
        if (!this.#chainFiles[kk]) {
            this.#chainFiles[kk] = new ChainFile(p)
        }
        const cf = this.#chainFiles[kk]
        await cf.update()
        const data = cf.sequenceData(variableName)
        return {
            runId,
            chainId,
            variableName,
            data
        }
    }
}

class ChainFile {
    #columnNames: string[] | undefined = undefined
    #rows: {values: string[]}[] = []
    #rawHeader = ''
    constructor(private path: string) {
    }
    public get variableNames() {
        return [...(this.#columnNames || [])]
    }
    public get rawHeader() {
        return this.#rawHeader
    }
    sequenceData(variableName: string): number[] {
        const i = this.#columnNames.indexOf(variableName)
        if (i < 0) return []
        return this.#rows.map(r => (
            r.values[i] !== undefined ? parseFloat(r.values[i]) : 0
        ))
    }
    async update() {
        this.#columnNames = undefined
        this.#rows = []
        const rawHeaderLines: string[] = []
        const txt = await fs.promises.readFile(this.path, 'utf8')
        const lines = txt.split('\n')
        for (const line of lines) {
            if (line.startsWith('#')) {
                rawHeaderLines.push(line)
            }
            else if (line.length <= 5) {
                break
            }
            else {
                const vals = line.trim().split(',')
                if (!this.#columnNames) {
                    this.#columnNames = vals
                }
                else {
                    this.#rows.push({values: vals})
                }
            }
        }
        this.#rawHeader = rawHeaderLines.join('\n')
    }
}

function chainIdFromCsvFileName(path: string) {
    return path.slice(0, path.length - '.csv'.length)
}

export default OutputManager