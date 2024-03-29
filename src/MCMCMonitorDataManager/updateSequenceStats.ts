import { MCMCMonitorAction, MCMCMonitorData, SequenceStats } from "./MCMCMonitorDataTypes";
import { ess } from "./stats/ess";

const CALCULATION_BUDGET_MS = 200

export default async function updateSequenceStats(data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void) {
    const runId = data.selectedRunId
    if (!runId) return
    const timer = Date.now()
    for (const chainId of data.selectedChainIds) {
        for (const variableName of data.selectedVariableNames) {
            const k = `${runId}/${chainId}/${variableName}`
            const s = data.sequenceStats[k] || {}
            if (!s.isUpToDate) {
                const seq = data.sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
                if (seq) {
                    const seqData = seq.data.slice(data.effectiveInitialDrawsToExclude)
                    const newStats = computeStatsForSequence(seqData)
                    dispatch({
                        type: 'setSequenceStats',
                        runId,
                        chainId,
                        variableName,
                        stats: newStats
                    })
                }
            }
            const elapsed = Date.now() - timer
            // We'd rather return some result than hang forever, so if we aren't done
            // computing all the stats before the budget runs out, return early
            if (elapsed > CALCULATION_BUDGET_MS) {
                return
            }
        }
    }
}

function computeStatsForSequence(seqData: number[]): SequenceStats {
    const mean = computeMean(seqData)
    const stdev = computeStdev(seqData)
    const {ess: ess0, acor} = ess(seqData)
    return {
        mean,
        stdev,
        ess: ess0,
        acor,
        count: seqData.length,
        isUpToDate: seqData.length > 0
    }
}

export function computeMean(d: number[]) {
	if (d.length === 0) return undefined
	return d.reduce((a, b) => (a + b), 0) / d.length
}

export function computeStdev(d: number[]) {
	if (d.length <= 1) return undefined
	const sumsqr = d.reduce((a, b) => (a + b * b), 0)
	const m0 = computeMean(d)
	if (m0 === undefined) return undefined
	return Math.sqrt(sumsqr / d.length - m0 * m0)
}