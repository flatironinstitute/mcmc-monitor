import { serviceBaseUrl } from "../config";
import { GetSequencesRequest, isGetSequencesResponse } from "../MCMCMonitorRequest";
import { MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorData";

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
    const timer = Date.now()
    if (X.length > 0) {
        const req: GetSequencesRequest = {
            type: 'getSequencesRequest',
            sequences: X.map(s => ({
                runId: s.runId, chainId: s.chainId, variableName: s.variableName, position: s.data.length
            }))
        }
        const rr = await fetch(
            `${serviceBaseUrl}/api`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req)
            }
        )
        const resp = await rr.json()
        if (!isGetSequencesResponse(resp)) {
            console.warn(resp)
            throw Error('Unexpected getSequences response')
        }
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
        const elapsed = Date.now() - timer
        if (elapsed > 200) {
            // wait for next iteration
            return
        }
    }
}