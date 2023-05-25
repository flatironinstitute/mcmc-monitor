import { GetSequencesRequest, isGetSequencesResponse, MCMCSequenceUpdate } from "../../service/src/types";
import postApiRequest from "../networking/postApiRequest";
import getSpaSequenceUpdates from "../spaInterface/getSpaSequenceUpdates";
import { MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorDataTypes";

export default async function updateSequences(data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void) {
    const X = data.sequences.filter(s => (s.updateRequested))
    if (X.length > 0) {
        const runId = X[0].runId
        if (runId.startsWith('spa|')) {
            // handle the special case of a stan playground run
            const sequenceUpdates: MCMCSequenceUpdate[] | undefined = await getSpaSequenceUpdates(runId, X)
            if (sequenceUpdates) {
                dispatch({
                    type: "updateSequenceData",
                    sequences: sequenceUpdates
                })
            }
        }
        else {
            // handle the usual case
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
            dispatch({
                type: "updateSequenceData",
                sequences: resp.sequences
            })
        }
    }
}