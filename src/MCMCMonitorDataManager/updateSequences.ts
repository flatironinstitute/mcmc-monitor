import { GetSequencesRequest, isGetSequencesResponse } from "../../service/src/types";
import postApiRequest from "../networking/postApiRequest";
import { MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorDataTypes";


export default async function updateSequences(data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void) {
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
        dispatch({
            type: "updateSequenceData",
            sequences: resp.sequences
        })
    }
}