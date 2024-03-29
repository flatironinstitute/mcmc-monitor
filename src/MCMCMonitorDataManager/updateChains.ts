import { GetChainsForRunRequest, isGetChainsForRunResponse } from "../../service/src/types"
import postApiRequest from "../networking/postApiRequest"
import { MCMCMonitorAction } from "./MCMCMonitorDataTypes"



const updateChains = async (runId: string | undefined, dispatch: (a: MCMCMonitorAction) => void) => {
    if (runId === undefined) return

    const req: GetChainsForRunRequest = {
        type: 'getChainsForRunRequest',
        runId: runId
    }
    const resp = await postApiRequest(req)
    if (!isGetChainsForRunResponse(resp)) {
        console.warn(JSON.stringify(resp))
        throw Error('Chain update request returned invalid response.')
    }
    dispatch({
        type: 'updateChainsForRun',
        runId: runId,
        chains: resp.chains
    })
}

export default updateChains