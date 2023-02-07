import validateObject, { isArrayOf, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

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
}

export const isProbeResponse = (x: any): x is ProbeResponse => (
    validateObject(x, {
        type: isEqualTo('probeResponse'),
        protocolVersion: isString
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
    runs: {
        runId: string
    }[]
}

export const isGetRunsResponse = (x: any): x is GetRunsResponse => (
    validateObject(x, {
        type: isEqualTo('getRunsResponse'),
        runs: isArrayOf(y => (validateObject(y, {
            runId: isString
        })))
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
    chains: {
        runId: string
        chainId: string
        variableNames: string[]
        rawHeader?: string
        rawFooter?: string
    }[]
}

export const isGetChainsForRunResponse = (x: any): x is GetChainsForRunResponse => (
    validateObject(x, {
        type: isEqualTo('getChainsForRunResponse'),
        chains: isArrayOf(y => (validateObject(y, {
            runId: isString,
            chainId: isString,
            variableNames: isArrayOf(isString),
            rawHeader: optional(isString),
            rawFooter: optional(isString)
        })))
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

export type MCMCMonitorRequest =
    ProbeRequest |
    GetRunsRequest |
    GetChainsForRunRequest |
    GetSequencesRequest

export const isMCMCMonitorRequest = (x: any): x is MCMCMonitorRequest => (
    isOneOf([
        isProbeRequest,
        isGetRunsRequest,
        isGetChainsForRunRequest,
        isGetSequencesRequest
    ])(x)
)

export type MCMCMonitorResponse =
    ProbeResponse |
    GetRunsResponse |
    GetChainsForRunResponse |
    GetSequencesResponse

export const isMCMCMonitorResponse = (x: any): x is MCMCMonitorResponse => (
    isOneOf([
        isProbeResponse,
        isGetRunsResponse,
        isGetChainsForRunResponse,
        isGetSequencesResponse
    ])(x)
)