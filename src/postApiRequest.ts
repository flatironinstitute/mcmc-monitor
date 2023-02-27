import { MCMCMonitorRequest, MCMCMonitorResponse, isMCMCMonitorResponse } from "../service/src/types/MCMCMonitorRequest"
import { serviceBaseUrl, useWebrtc, webrtcConnectionToService } from "./config"

const postApiRequest = async (request: MCMCMonitorRequest): Promise<MCMCMonitorResponse> => {
    if ((useWebrtc) && (request.type !== 'probeRequest') && (request.type !== 'webrtcSignalingRequest')) {
        if (!webrtcConnectionToService) {
            throw Error('No webrtc connection to service')
        }
        return webrtcConnectionToService.postApiRequest(request)
    }
    const rr = await fetch(
        `${serviceBaseUrl}/api`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        }
    )
    const response = await rr.json()
    if (!isMCMCMonitorResponse) {
        console.warn(response)
        throw Error('Unexpected api response')
    }
    return response
}

export default postApiRequest