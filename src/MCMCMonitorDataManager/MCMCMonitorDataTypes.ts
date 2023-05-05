import { MCMCChain, MCMCRun, MCMCSequence, MCMCSequenceUpdate } from '../../service/src/types'

export type GeneralOpts = {
    dataRefreshMode: 'auto' | 'manual'
    dataRefreshIntervalSec: number
    requestedInitialDrawsToExclude: number
}

export type SequenceStats = {
    mean?: number
    stdev?: number
    count?: number
    ess?: number
    acor?: number[]
    isUpToDate?: boolean
}

export type VariableStats = {
    mean?: number
    stdev?: number
    count?: number
    ess?: number
    rhat?: number
    isUpToDate?: boolean
}

export type SequenceStatsDict = { [key: string]: SequenceStats }
export type VariableStatsDict = { [key: string]: VariableStats }

export type WebrtcConnectionStatus = 'unused' | 'pending' | 'connected' | 'error'

export type MCMCMonitorData = {
    connectedToService: boolean | undefined
    serviceProtocolVersion: string | undefined
    webrtcConnectionStatus: WebrtcConnectionStatus
    usingProxy: boolean | undefined
    runs: MCMCRun[]
    chains: MCMCChain[]
    sequences: MCMCSequence[]
    sequenceStats: SequenceStatsDict
    variableStats: VariableStatsDict
    selectedRunId?: string
    selectedVariableNames: string[]
    selectedChainIds: string[]
    effectiveInitialDrawsToExclude: number
    generalOpts: GeneralOpts
}

export type MCMCMonitorAction = {
    type: 'setRuns'
    runs: MCMCRun[]
} | {
    type: 'setChainsForRun'
    runId: string
    chains: MCMCChain[]
} | {
    type: 'updateChainsForRun'
    runId: string
    chains: MCMCChain[]
} | {
    type: 'updateSequenceData'
    sequences: MCMCSequenceUpdate[]
} | {
    type: 'setSelectedVariableNames'
    variableNames: string[]
} | {
    type: 'setSelectedRunId'
    runId: string | undefined
} | {
    type: 'setSelectedChainIds'
    chainIds: string[]
} | {
    type: 'setConnectedToService'
    connected: boolean | undefined
} | {
    type: 'setServiceProtocolVersion'
    version: string | undefined
} | {
    type: 'setWebrtcConnectionStatus'
    status: 'unused' | 'pending' | 'connected' | 'error'
} | {
    type: 'setUsingProxy'
    usingProxy: boolean | undefined
} | {
    type: 'requestSequenceUpdate'
    runId: string
} | {
    type: 'setGeneralOpts'
    opts: GeneralOpts
} | {
    type: 'setSequenceStats'
    runId: string
    chainId: string
    variableName: string
    stats: SequenceStats
} | {
    type: 'setVariableStats'
    runId: string
    variableName: string
    stats: VariableStats
}
