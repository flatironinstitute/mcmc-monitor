import { GetSequencesRequest, isGetSequencesResponse, MCMCSequenceUpdate } from "../../service/src/types";
import postApiRequest from "../networking/postApiRequest";
import getSpaSequenceUpdates from "../spaInterface/getSpaSequenceUpdates";
import { isSpaRunId } from "../spaInterface/util";
import { MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorDataTypes";

export default async function updateSequences(data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void) {
    const X = data.sequences.filter(s => (s.updateRequested))
    if (X.length > 0) {
        const numSpaRuns = X.filter(s => isSpaRunId(s.runId)).length
        if ((numSpaRuns > 0) && (numSpaRuns < X.length)) {
            throw Error('Cannot mix SPA and non-SPA runs in a single updateSequences call')
        }
        let sequenceUpdates: MCMCSequenceUpdate[] | undefined
        if (numSpaRuns === X.length) {
            const runId = X[0].runId
            // handle the special case of a stan playground run
            sequenceUpdates = await getSpaSequenceUpdates(runId, X)
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
            sequenceUpdates = resp.sequences
        }
        if (sequenceUpdates && sequenceUpdates.length > 0) {
            dispatch({
                type: "updateSequenceData",
                sequences: sequenceUpdates
            })
        }
    }
}