import { isMCMCChain, isMCMCRun, isMCMCSequence } from '../../service/src/types'
import validateObject, { isArrayOf, isBoolean, isNumber, isString, optional } from "../../service/src/types/validateObject"
import { GeneralOpts, MCMCMonitorData, SequenceStats, SequenceStatsDict, VariableStats, VariableStatsDict, WebrtcConnectionStatus } from "./MCMCMonitorDataTypes"

export const isWebrtcConnectionStatus = (x: any): x is WebrtcConnectionStatus => {
    const validStatuses = ['unused', 'pending', 'connected', 'error']
    return validStatuses.includes(x)
}

export const isMCMCSequenceStats = (x: any): x is SequenceStats => {
    return validateObject(x, {
        mean: optional(isNumber),
        stdev: optional(isNumber),
        count: optional(isNumber),
        ess: optional(isNumber),
        rhat: optional(isNumber),
        isUpToDate: optional(isBoolean),
    })
}

export const isMCMCVariableStats = (x: any): x is VariableStats => {
    return validateObject(x, {
        mean: optional(isNumber),
        stdev: optional(isNumber),
        count: optional(isNumber),
        ess: optional(isNumber),
        acor: optional(isArrayOf(isNumber)),
        isUpToDate: optional(isBoolean),
    })
}

export const isSequenceStatsDict = (x: any): x is SequenceStatsDict => {
    return Object.values(x).every(v => isMCMCSequenceStats(v))
}

export const isVariableStatsDict = (x: any): x is VariableStatsDict => {
    return Object.values(x).every(v => isMCMCVariableStats(v))
}

export const isGeneralOpts = (x: any): x is GeneralOpts => {
    return validateObject(x, {
        dataRefreshMode: (x) => ['auto', 'manual'].includes(x),
        dataRefreshIntervalSec: isNumber,
        requestedInitialDrawsToExclude: isNumber
    })
}

export const isMCMCMonitorData = (x: any): x is MCMCMonitorData => {
    return validateObject(x, {
        connectedToService: optional(isBoolean),
        serviceProtocolVersion: optional(isString),
        webrtcConnectionStatus: isWebrtcConnectionStatus,
        usingProxy: optional(isBoolean),
        runs: isArrayOf(isMCMCRun),
        chains: isArrayOf(isMCMCChain),
        sequences: isArrayOf(isMCMCSequence),
        sequenceStats: isSequenceStatsDict,
        variableStats: isVariableStatsDict,
        selectedRunId: optional(isString),
        selectedVariableNames: isArrayOf(isString),
        selectedChainIds: isArrayOf(isString),
        effectiveInitialDrawsToExclude: isNumber,
        generalOpts: isGeneralOpts
    })
}


