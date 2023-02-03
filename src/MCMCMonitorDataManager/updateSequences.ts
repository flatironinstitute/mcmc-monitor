import { serviceBaseUrl } from "../config";
import { MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorData";
import { GetSequencesRequest, GetSequencesResponse } from "./MCMCMonitorTypes";

export default async function updateSequences(data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void) {
    // request updates for the non-existent sequences that are selected
    const runId = data.selectedRunId
    if (runId) {
        for (const chainId of data.selectedChainIds) {
            for (const variableName of data.selectedVariableNames) {
                const a = data.sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
                if (!a) {
                    dispatch({
                        type: 'updateSequence',
                        runId,
                        chainId,
                        variableName
                    })
                }
            }
        }
    }

    const X = data.sequences.filter(s => (s.updateRequested))
    if (X.length > 0) {
        const req: GetSequencesRequest = {
            sequences: X.map(s => ({
                runId: s.runId, chainId: s.chainId, variableName: s.variableName, position: s.data.length
            }))
        }
        const rr = await fetch(
            `${serviceBaseUrl}/getSequences`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req)
            }
        )
        const resp: GetSequencesResponse = await rr.json()
        for (const s of resp.sequences) {
            dispatch({
                type: 'appendSequenceData',
                runId: s.runId,
                chainId: s.chainId,
                variableName: s.variableName,
                position: s.position,
                data: s.data
            })
        }
    }
}