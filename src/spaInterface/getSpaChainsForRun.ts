import { MCMCChain } from "../../service/src/types";
import { spaOutputsForRunIds, updateSpaOutputForRun } from "./spaOutputsForRunIds";

const getSpaChainsForRun = async (runId: string): Promise<MCMCChain[]> => {
    await updateSpaOutputForRun(runId)
    const cachedEntry = spaOutputsForRunIds[runId]
    if (!cachedEntry) {
        console.warn('Unable to load data for run', runId)
        return []
    }
    const spaOutput = cachedEntry.spaOutput
    const ret: MCMCChain[] = []
    for (const ch of spaOutput.chains) {
        ret.push({
            runId,
            chainId: ch.chainId,
            variableNames: Object.keys(ch.sequences),
            rawHeader: ch.rawHeader,
            rawFooter: ch.rawFooter,
            lastChangeTimestamp: Date.now(),
            excludedInitialIterationCount: ch.numWarmupDraws ?? 0,
        })
    }
    return ret
}

export default getSpaChainsForRun