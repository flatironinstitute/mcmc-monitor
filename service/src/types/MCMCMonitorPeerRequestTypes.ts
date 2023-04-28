import { MCMCMonitorRequest, MCMCMonitorResponse } from "./MCMCMonitorRequestTypes"

export type MCMCMonitorPeerRequest = {
    type: 'mcmcMonitorPeerRequest'
    request: MCMCMonitorRequest
    requestId: string
}

export type MCMCMonitorPeerResponse = {
    type: 'mcmcMonitorPeerResponse'
    response: MCMCMonitorResponse
    requestId: string
}
