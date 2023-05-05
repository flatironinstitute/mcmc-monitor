import { AcknowledgeMessageToService, InitializeMessageFromService, PingMessageFromService, RequestFromClient, ResponseToClient } from "./ConnectorHttpProxyTypes"
import { MCMCMonitorPeerRequest, MCMCMonitorPeerResponse } from "./MCMCMonitorPeerRequestTypes"
import { GetChainsForRunRequest, GetChainsForRunResponse, GetRunsRequest, GetRunsResponse, GetSequencesRequest, GetSequencesResponse, MCMCMonitorRequest, MCMCMonitorResponse, MCMCSequenceUpdate, ProbeRequest, ProbeResponse, WebrtcSignalingRequest, WebrtcSignalingResponse } from "./MCMCMonitorRequestTypes"
import { MCMCChain, MCMCRun, MCMCSequence } from "./MCMCMonitorTypes"
import { WebsocketMessage } from "./WebsocketMessageTypes"
import validateObject, { isArrayOf, isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

// ConnectorHttpProxyTypes types

export const isRequestFromClient = (x: any): x is RequestFromClient => {
    return validateObject(x, {
        type: isEqualTo('requestFromClient'),
        request: () => (true),
        requestId: isString
    })
}

export const isResponseToClient = (x: any): x is ResponseToClient => {
    return validateObject(x, {
        type: isEqualTo('responseToClient'),
        response: () => (true),
        requestId: optional(isString),
        error: optional(isString)
    })
}

export const isInitializeMessageFromService = (x: any): x is InitializeMessageFromService => {
    return validateObject(x, {
        type: isEqualTo('initialize'),
        serviceId: isString,
        servicePrivateId: isString,
        proxySecret: isString
    })
}

export const isAcknowledgeMessageToService = (x: any): x is AcknowledgeMessageToService => {
    return validateObject(x, {
        type: isEqualTo('acknowledge')
    })
}

export const isPingMessageFromService = (x: any): x is PingMessageFromService => {
    return validateObject(x, {
        type: isEqualTo('ping')
    })
}

// MCMCMonitorPeerRequest types

export const isMCMCMonitorPeerRequest = (x: any): x is MCMCMonitorPeerRequest => (
    validateObject(x, {
        type: isEqualTo('mcmcMonitorPeerRequest'),
        request: isMCMCMonitorRequest,
        requestId: isString
    })
)

export const isMCMCMonitorPeerResponse = (x: any): x is MCMCMonitorPeerResponse => (
    validateObject(x, {
        type: isEqualTo('mcmcMonitorPeerResponse'),
        response: isMCMCMonitorResponse,
        requestId: isString
    })
)

// MCMCMonitorRequest types

export const isProbeRequest = (x: any): x is ProbeRequest => (
    validateObject(x, {
        type: isEqualTo('probeRequest')
    })
)

export const isProbeResponse = (x: any): x is ProbeResponse => (
    validateObject(x, {
        type: isEqualTo('probeResponse'),
        protocolVersion: isString,
        proxy: optional(isBoolean)
    })
)

export const isGetRunsRequest = (x: any): x is GetRunsRequest => (
    validateObject(x, {
        type: isEqualTo('getRunsRequest')
    })
)

export const isGetRunsResponse = (x: any): x is GetRunsResponse => (
    validateObject(x, {
        type: isEqualTo('getRunsResponse'),
        runs: isArrayOf(y => isMCMCRun(y))
    })
)

export const isGetChainsForRunRequest = (x: any): x is GetChainsForRunRequest => (
    validateObject(x, {
        type: isEqualTo('getChainsForRunRequest'),
        runId: isString
    })
)

export const isGetChainsForRunResponse = (x: any): x is GetChainsForRunResponse => (
    validateObject(x, {
        type: isEqualTo('getChainsForRunResponse'),
        chains: isArrayOf(y => isMCMCChain(y))
    })
)

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

export const isGetSequencesResponse = (x: any): x is GetSequencesResponse => (
    validateObject(x, {
        type: isEqualTo('getSequencesResponse'),
        sequences: isArrayOf(isMCMCSequenceUpdate)
    })
)

export const isMCMCSequenceUpdate = (x: any): x is MCMCSequenceUpdate => (
    validateObject(x, {
        runId: isString,
        chainId: isString,
        variableName: isString,
        position: isNumber,
        data: () => (true)
    })
)

export const isWebrtcSignalingRequest = (x: any): x is WebrtcSignalingRequest => (
    validateObject(x, {
        type: isEqualTo('webrtcSignalingRequest'),
        clientId: isString,
        signal: optional(isString)
    })
)

export const isWebrtcSignalingResponse = (x: any): x is WebrtcSignalingResponse => (
    validateObject(x, {
        type: isEqualTo('webrtcSignalingResponse'),
        signals: isArrayOf(isString)
    })
)

export const isMCMCMonitorRequest = (x: any): x is MCMCMonitorRequest => (
    isOneOf([
        isProbeRequest,
        isGetRunsRequest,
        isGetChainsForRunRequest,
        isGetSequencesRequest,
        isWebrtcSignalingRequest
    ])(x)
)

export const isMCMCMonitorResponse = (x: any): x is MCMCMonitorResponse => (
    isOneOf([
        isProbeResponse,
        isGetRunsResponse,
        isGetChainsForRunResponse,
        isGetSequencesResponse,
        isWebrtcSignalingResponse
    ])(x)
)

// MCMCMonitorTypes types

export const isMCMCRun = (x: any): x is MCMCRun => (
    validateObject(x, { runId: isString })
)

export const isMCMCChain = (x: any): x is MCMCChain => (
    validateObject(x, {
        runId: isString,
        chainId: isString,
        variableNames: isArrayOf(isString),
        rawHeader: optional(isString),
        rawFooter: optional(isString),
        variablePrefixesExcluded: optional(isArrayOf(isString)),
        excludedInitialIterationCount: optional(isNumber),
        lastChangeTimestamp: isNumber
    })
)

export const isMCMCSequence = (x: any): x is MCMCSequence => (
    validateObject(x, {
        runId: isString,
        chainId: isString,
        variableName: isString,
        data: isArrayOf(isNumber),
        updateRequested: optional(isBoolean)
    })
)

// WebsocketMessage types

export const isWebsocketMessage = (x: any): x is WebsocketMessage => (
    validateObject(x, {
        type: isEqualTo('signal'),
        signal: isString
    })
)

// Type utilities

export const getSequenceIdentifier = (sequenceIdentifiers: {runId: string, chainId: string, variableName: string}): string => {
    const delimiter = "%%%"
    const keys: string[] = [sequenceIdentifiers.runId, sequenceIdentifiers.chainId, sequenceIdentifiers.variableName]
    return keys.join(delimiter)
}
