import { isMCMCMonitorRequest, isMCMCMonitorResponse, MCMCMonitorRequest, MCMCMonitorResponse } from "./MCMCMonitorRequest"
import validateObject, { isEqualTo, isString } from "./validateObject"

export type MCMCMonitorPeerRequest = {
    type: 'mcmcMonitorPeerRequest'
    request: MCMCMonitorRequest
    requestId: string
}

export const isMCMCMonitorPeerRequest = (x: any): x is MCMCMonitorPeerRequest => (
    validateObject(x, {
        type: isEqualTo('mcmcMonitorPeerRequest'),
        request: isMCMCMonitorRequest,
        requestId: isString
    })
)

export type MCMCMonitorPeerResponse = {
    type: 'mcmcMonitorPeerResponse'
    response: MCMCMonitorResponse
    requestId: string
}

export const isMCMCMonitorPeerResponse = (x: any): x is MCMCMonitorPeerResponse => (
    validateObject(x, {
        type: isEqualTo('mcmcMonitorPeerResponse'),
        response: isMCMCMonitorResponse,
        requestId: isString
    })
)