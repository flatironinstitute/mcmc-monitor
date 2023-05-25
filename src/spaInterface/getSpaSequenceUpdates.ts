import { MCMCSequence, MCMCSequenceUpdate } from "../../service/src/types";
import { spaOutputsForRunIds, updateSpaOutputForRun } from "./spaOutputsForRunIds";

const getSpaSequenceUpdates = async (runId: string, sequences: MCMCSequence[]): Promise<MCMCSequenceUpdate[] | undefined> => {
    await updateSpaOutputForRun(runId)
    const cachedEntry = spaOutputsForRunIds[runId]
    if (!cachedEntry) {
        console.warn('Unable to load data for run', runId)
        return []
    }
    const spaOutput = cachedEntry.spaOutput
    
    const ret: MCMCSequenceUpdate[] = []
    for (const seq of sequences) {
        const data = spaOutput.chains.find(c => c.chainId === seq.chainId)?.sequences[seq.variableName] ?? []
        ret.push({
            runId,
            chainId: seq.chainId,
            variableName: seq.variableName,
            position: seq.data.length,
            data: data.slice(seq.data.length)
        })
    }
    return ret
}

export default getSpaSequenceUpdates