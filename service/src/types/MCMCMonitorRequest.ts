import { MCMCChain, MCMCRun, isMCMCChain, isMCMCRun } from "./MCMCMonitorTypes"
import validateObject, { isArrayOf, isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

export const protocolVersion = '0.1.3'

export type ProbeRequest = {
    type: 'probeRequest'
}

export const isProbeRequest = (x: any): x is ProbeRequest => (
    validateObject(x, {
        type: isEqualTo('probeRequest')
    })
)

export type ProbeResponse = {
    type: 'probeResponse'
    protocolVersion: string
    proxy?: boolean
}

export const isProbeResponse = (x: any): x is ProbeResponse => (
    validateObject(x, {
        type: isEqualTo('probeResponse'),
        protocolVersion: isString,
        proxy: optional(isBoolean)
    })
)

export type GetRunsRequest = {
    type: 'getRunsRequest'
}

export const isGetRunsRequest = (x: any): x is GetRunsRequest => (
    validateObject(x, {
        type: isEqualTo('getRunsRequest')
    })
)

export type GetRunsResponse = {
    type: 'getRunsResponse'
    runs: MCMCRun[]
}

export const isGetRunsResponse = (x: any): x is GetRunsResponse => (
    validateObject(x, {
        type: isEqualTo('getRunsResponse'),
        runs: isArrayOf(y => isMCMCRun(y))
    })
)

export type GetChainsForRunRequest = {
    type: 'getChainsForRunRequest'
    runId: string
}

export const isGetChainsForRunRequest = (x: any): x is GetChainsForRunRequest => (
    validateObject(x, {
        type: isEqualTo('getChainsForRunRequest'),
        runId: isString
    })
)

export type GetChainsForRunResponse = {
    type: 'getChainsForRunResponse'
    chains: MCMCChain[]
}

export const isGetChainsForRunResponse = (x: any): x is GetChainsForRunResponse => (
    validateObject(x, {
        type: isEqualTo('getChainsForRunResponse'),
        chains: isArrayOf(y => isMCMCChain(y))
    })
)

export type GetSequencesRequest = {
    type: 'getSequencesRequest'
    sequences: {
        runId: string
        chainId: string
        variableName: string
        position: number
    }[]
}

export const isGetSequencesRequest = (x: any): x is GetSequencesRequest => (
    validateObject(x, {
        type: isEqualTo('getSequencesRequest'),
        sequences: isArrayOf(y => (validateObject(y, {
            runId: isString,
            chainId: isString,
            variableName: isString,
            position: isNumber
        })))
    })
)

export type GetSequencesResponse = {
    type: 'getSequencesResponse'
    sequences: {
        runId: string
        chainId: string
        variableName: string
        position: number
        data: number[]
    }[]
}

export const isGetSequencesResponse = (x: any): x is GetSequencesResponse => (
    validateObject(x, {
        type: isEqualTo('getSequencesResponse'),
        sequences: isArrayOf(y => (validateObject(y, {
            runId: isString,
            chainId: isString,
            variableName: isString,
            position: isNumber,
            data: () => (true)
        })))
    })
)

export type WebrtcSignalingRequest = {
    type: 'webrtcSignalingRequest'
    clientId: string
    signal?: string
}

export const isWebrtcSignalingRequest = (x: any): x is WebrtcSignalingRequest => (
    validateObject(x, {
        type: isEqualTo('webrtcSignalingRequest'),
        clientId: isString,
        signal: optional(isString)
    })
)

export type WebrtcSignalingResponse = {
    type: 'webrtcSignalingResponse'
    signals: string[]
}

export const isWebrtcSignalingResponse = (x: any): x is WebrtcSignalingResponse => (
    validateObject(x, {
        type: isEqualTo('webrtcSignalingResponse'),
        signals: isArrayOf(isString)
    })
)

export type MCMCMonitorRequest =
    ProbeRequest |
    GetRunsRequest |
    GetChainsForRunRequest |
    GetSequencesRequest |
    WebrtcSignalingRequest

export const isMCMCMonitorRequest = (x: any): x is MCMCMonitorRequest => (
    isOneOf([
        isProbeRequest,
        isGetRunsRequest,
        isGetChainsForRunRequest,
        isGetSequencesRequest,
        isWebrtcSignalingRequest
    ])(x)
)

export type MCMCMonitorResponse =
    ProbeResponse |
    GetRunsResponse |
    GetChainsForRunResponse |
    GetSequencesResponse |
    WebrtcSignalingResponse

export const isMCMCMonitorResponse = (x: any): x is MCMCMonitorResponse => (
    isOneOf([
        isProbeResponse,
        isGetRunsResponse,
        isGetChainsForRunResponse,
        isGetSequencesResponse,
        isWebrtcSignalingResponse
    ])(x)
)