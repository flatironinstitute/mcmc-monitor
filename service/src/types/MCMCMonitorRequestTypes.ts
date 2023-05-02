import { MCMCChain, MCMCRun } from "./MCMCMonitorTypes"

export type ProbeRequest = {
    type: 'probeRequest'
}

export type ProbeResponse = {
    type: 'probeResponse'
    protocolVersion: string
    proxy?: boolean
}

export type GetRunsRequest = {
    type: 'getRunsRequest'
}

export type GetRunsResponse = {
    type: 'getRunsResponse'
    runs: MCMCRun[]
}

export type GetChainsForRunRequest = {
    type: 'getChainsForRunRequest'
    runId: string
}


export type GetChainsForRunResponse = {
    type: 'getChainsForRunResponse'
    chains: MCMCChain[]
}


export type GetSequencesRequest = {
    type: 'getSequencesRequest'
    sequences: {
        runId: string
        chainId: string
        variableName: string
        position: number
    }[]
}


export type GetSequencesResponse = {
    type: 'getSequencesResponse'
    sequences: MCMCSequenceUpdate[]
}


export type MCMCSequenceUpdate = {
    runId: string
    chainId: string
    variableName: string
    position: number
    data: number[]
}


export type WebrtcSignalingRequest = {
    type: 'webrtcSignalingRequest'
    clientId: string
    signal?: string
}

export type WebrtcSignalingResponse = {
    type: 'webrtcSignalingResponse'
    signals: string[]
}

export type MCMCMonitorRequest =
    ProbeRequest |
    GetRunsRequest |
    GetChainsForRunRequest |
    GetSequencesRequest |
    WebrtcSignalingRequest

export type MCMCMonitorResponse =
    ProbeResponse |
    GetRunsResponse |
    GetChainsForRunResponse |
    GetSequencesResponse |
    WebrtcSignalingResponse
