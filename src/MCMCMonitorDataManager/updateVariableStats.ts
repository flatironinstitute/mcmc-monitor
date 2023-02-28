import { MCMCMonitorAction, MCMCMonitorData, SequenceStats, VariableStats } from "./MCMCMonitorData";
import { computeMean, computeStdev } from "./updateSequenceStats";

export default async function updateVariableStats(data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void) {
    const runId = data.selectedRunId
    if (!runId) return
    const timer = Date.now()
    for (const variableName of data.selectedVariableNames) {
        const k = `${runId}/${variableName}`
        const s = data.variableStats[k] || {}
        if (!s.isUpToDate) {
            const chainStats: SequenceStats[] = data.selectedChainIds.map(chainId => {
                const k2 = `${runId}/${chainId}/${variableName}`
                return data.sequenceStats[k2] || {}
            })
            const mean = meanFromMeans(chainStats.map(cs => (cs.mean)), chainStats.map(cs => (cs.count)))
            const stdev = stdevFromStdevs(chainStats.map(cs => (cs.stdev)), chainStats.map(cs => (cs.count)))
            const ess = essFromEsses(chainStats.map(cs => (cs.ess)))
            const count = countFromCounts(chainStats.map(cs => (cs.count)))
            const rhat = rhatFromData(chainStats.map(cs => (cs.count)), chainStats.map(cs => (cs.mean)), chainStats.map(cs => (cs.stdev)))
            if (mean !== undefined) {
                const newStats: VariableStats = {
                    mean,
                    stdev,
                    ess,
                    count,
                    rhat,
                    isUpToDate: true
                }
                dispatch({
                    type: 'setVariableStats',
                    runId,
                    variableName,
                    stats: newStats
                })
            }
        }
        const elapsed = Date.now() - timer
        if (elapsed > 200) {
            // wait for next iteration
            return
        }
    }
}

function meanFromMeans(means: (number | undefined)[], counts: (number | undefined)[]) {
    if (means.indexOf(undefined) >= 0) return undefined
    if (counts.indexOf(undefined) >= 0) return undefined
    const totalCount = (counts as number[]).reduce((a, b) => (a + b), 0)
    const totalSum = (means as number[]).map((m, i) => (m * (counts as number[])[i])).reduce((a, b) => (a + b), 0)
    if (totalCount === 0) return undefined
    return totalSum / totalCount
}

function countFromCounts(counts: (number | undefined)[]) {
    if (counts.indexOf(undefined) >= 0) return undefined
    const totalCount = (counts as number[]).reduce((a, b) => (a + b), 0)
    return totalCount
}

function stdevFromStdevs(stdevs: (number | undefined)[], counts: (number | undefined)[]) {
    if (stdevs.indexOf(undefined) >= 0) return undefined
    if (counts.indexOf(undefined) >= 0) return undefined
    const totalCount = (counts as number[]).reduce((a, b) => (a + b), 0)
    const totalSumsqrs = (stdevs as number[]).map((s, i) => (s * s * (counts as number[])[i])).reduce((a, b) => (a + b), 0)
    if (totalCount === 0) return undefined
    const var0 = totalSumsqrs / totalCount
    return Math.sqrt(var0)
}

function essFromEsses(esses: (number | undefined)[]) {
    if (esses.indexOf(undefined) >= 0) return undefined
    const totalEss = (esses as number[]).reduce((a, b) => (a + b), 0)
    return totalEss
}

function rhatFromData(counts: (number | undefined)[], means: (number | undefined)[], stdevs: (number | undefined)[]) {
    // chain_lengths = [len(chain) for chain in chains]
    // mean_chain_length = np.mean(chain_lengths)
    // means = [np.mean(chain) for chain in chains]
    // vars = [np.var(chain, ddof=1) for chain in chains]
    // r_hat: np.float64 = np.sqrt(
    //     (mean_chain_length - 1) / mean_chain_length + np.var(means, ddof=1) / np.mean(vars)
    // )
    if (counts.indexOf(undefined) >= 0) return undefined
    if (means.indexOf(undefined) >= 0) return undefined
    if (stdevs.indexOf(undefined) >= 0) return undefined
    const cc = counts as number[]
    const mm = means as number[]
    const ss = stdevs as number[]
    if (cc.length <= 1) return undefined
    for (const count of cc) {
        if (count <= 1) return undefined
    }
    const mean_chain_length = computeMean(cc)
    if (mean_chain_length === undefined) return undefined
    const vars = ss.map((s, i) => (s * s * cc[i] / (cc[i] - 1)))
    const stdevMeans = computeStdev(mm)
    if (stdevMeans === undefined) return undefined
    const varMeans = stdevMeans * stdevMeans * cc.length / (cc.length - 1)
    const meanVars = computeMean(vars)
    if (meanVars === undefined) return undefined
    const r_hat = Math.sqrt((mean_chain_length - 1) / mean_chain_length + varMeans / meanVars)
    return r_hat
}