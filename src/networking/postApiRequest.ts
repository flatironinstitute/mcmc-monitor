import { MCMCMonitorRequest, MCMCMonitorResponse, isMCMCMonitorResponse } from "../../service/src/types"
import { serviceBaseUrl, useWebrtc, webrtcConnectionToService } from "../config"

const postApiRequest = async (request: MCMCMonitorRequest): Promise<MCMCMonitorResponse> => {
    if (!serviceBaseUrl) throw Error('serviceBaseUrl not set') // for example, if we are in spa mode
    // Note: we always use http for probe requests and webrtc signaling requests
    if ((useWebrtc) && (request.type !== 'probeRequest') && (request.type !== 'webrtcSignalingRequest')) {
        if (webrtcConnectionToService && webrtcConnectionToService.status === 'connected') {
            // if we have a webrtc connection, post the request via webrtc
            return webrtcConnectionToService.postApiRequest(request)
        }
        // if no webrtc connection, fall through to fetch via http below
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
    if (!isMCMCMonitorResponse(response)) {
        console.warn(response)
        throw TypeError('Unexpected api response')
    }
    return response
}

export default postApiRequest