import { GetSequencesRequest, isGetSequencesResponse } from "../../service/src/types/MCMCMonitorRequest";
import postApiRequest from "../networking/postApiRequest";
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
    if (X.length > 0) {
        const req: GetSequencesRequest = {
            type: 'getSequencesRequest',
            sequences: X.map(s => ({
                runId: s.runId, chainId: s.chainId, variableName: s.variableName, position: s.data.length
            }))
        }
        const resp = await postApiRequest(req)
        if (!isGetSequencesResponse(resp)) {
            console.warn(resp)
            throw Error('Unexpected getSequences response')
        }
        for (const s of resp.sequences) {
            if (s.data.length > 0) {
                dispatch({
                    type: 'appendSequenceData',
                    runId: s.runId,
                    chainId: s.chainId,
                    variableName: s.variableName,
                    position: s.position,
                    data: s.data
                })
            }
            // important to do this separately from 'appendSequenceData' action because this one should not be conditional on whether we received data
            dispatch({
                type: 'markSequenceAsUpdated',
                runId: s.runId,
                chainId: s.chainId,
                variableName: s.variableName
            })
        }
    }
}