import fs from 'fs'
import { MCMCChain, MCMCRun } from '../../src/MCMCMonitorDataManager/MCMCMonitorTypes'
import ChainFile from './ChainFile'

class OutputManager {
    #chainFiles: {[key: string]: ChainFile} = {} // by runId/chainId
    constructor(private dir: string) {

    }
    async getRuns(): Promise<MCMCRun[]> {
        const runs: MCMCRun[] = []
        let x: string[]
        try {
            x = await fs.promises.readdir(this.dir)
        }
        catch(err) {
            console.warn(`Error reading directory: ${this.dir}`)
            return []
        }
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
        let fnames: string[]
        try {
            fnames = await fs.promises.readdir(path)
        }
        catch(err) {
            console.warn(`Error reading directory: ${path}`)
            return []
        }
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
                    variablePrefixesExcluded: cf.variablePrefixesExcluded,
                    excludedInitialIterationCount: cf.excludedInitialIterationCount,
                    lastChangeTimestamp: cf.timestampLastChange
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
    async clearOldData() {
        const keys = Object.keys(this.#chainFiles)
        for (const k of keys) {
            const cf = this.#chainFiles[k]
            if (!fs.existsSync(cf.path)) {
                console.warn(`File does no longer exists. Clearing data for ${cf.path}`)
                delete this.#chainFiles[k]
            }
        }
    }
    async _getPathForChainId(runId: string, chainId: string) {
        const p = `${this.dir}/${runId}/${chainId}.csv`
        if (fs.existsSync(p)) return p
        let x: string[]
        try {
            x = await fs.promises.readdir(`${this.dir}/${runId}`)
        }
        catch(err) {
            console.warn(`Error reading directory: ${this.dir}/${runId}`)
            return undefined
        }
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

export default OutputManager