import React from 'react'
import { MCMCChain, MCMCRun, MCMCSequence } from '../../service/src/types/MCMCMonitorTypes'

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
    ess?: number
    count?: number
    rhat?: number
    isUpToDate?: boolean
}

type SequenceStatsDict = { [key: string]: SequenceStats }
type VariableStatsDict = { [key: string]: VariableStats }

export type MCMCMonitorData = {
    connectedToService: boolean | undefined
    serviceProtocolVersion: string | undefined
    webrtcConnectionStatus: 'unused' | 'pending' | 'connected' | 'error'
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

export const initialMCMCMonitorData: MCMCMonitorData = {
    connectedToService: undefined,
    serviceProtocolVersion: undefined,
    webrtcConnectionStatus: 'pending',
    usingProxy: undefined,
    runs: [],
    chains: [],
    sequences: [],
    sequenceStats: {},
    variableStats: {},
    selectedVariableNames: [],
    selectedChainIds: [],
    effectiveInitialDrawsToExclude: 20,
    generalOpts: {dataRefreshMode: 'manual', dataRefreshIntervalSec: 5, requestedInitialDrawsToExclude: -1}
}

export const MCMCMonitorContext = React.createContext<{ data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void, checkConnectionStatus: () => void }>({
    data: initialMCMCMonitorData,
    dispatch: () => { },
    checkConnectionStatus: () => {}
})

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
    type: 'appendSequenceData'
    runId: string
    chainId: string
    variableName: string
    position: number
    data: number[]
} | {
    type: 'markSequenceAsUpdated'
    runId: string
    chainId: string
    variableName: string
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
    type: 'updateSequence'
    runId: string
    chainId: string
    variableName: string
} | {
    type: 'updateExistingSequences'
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

export const mcmcMonitorReducer = (s: MCMCMonitorData, a: MCMCMonitorAction): MCMCMonitorData => {
    if (a.type === 'setRuns') {
        const runIds = a.runs.map(r => (r.runId))
        return {
            ...s,
            runs: a.runs,
            chains: s.chains.filter(c => (runIds.includes(c.runId)))
        }
    }
    else if (a.type === 'setChainsForRun') {
        return doChainUpdate(s, a.runId, a.chains)
    }
    else if (a.type === 'updateChainsForRun') {
        const hadUpdates = chainsWereUpdated(a.chains, s.chains)
        if (!hadUpdates) return s // preserve reference equality if nothing changed
        return doChainUpdate(s, a.runId, a.chains)
    }
    else if (a.type === 'setSelectedVariableNames') {
        return {
            ...s,
            selectedVariableNames: [...a.variableNames].sort()
        }
    }
    else if (a.type === 'setSelectedChainIds') {
        return {
            ...s,
            selectedChainIds: [...a.chainIds].sort()
        }
    }
    else if (a.type === 'setSelectedRunId') {
        return {
            ...s,
            selectedRunId: a.runId
        }
    }
    else if (a.type === 'setConnectedToService') {
        return {
            ...s,
            connectedToService: a.connected
        }
    }
    else if (a.type === 'setServiceProtocolVersion') {
        return {
            ...s,
            serviceProtocolVersion: a.version
        }
    }
    else if (a.type === 'setWebrtcConnectionStatus') {
        return {
            ...s,
            webrtcConnectionStatus: a.status
        }
    }
    else if (a.type === 'setUsingProxy') {
        return {
            ...s,
            usingProxy: a.usingProxy
        }
    }
    else if (a.type === 'appendSequenceData') {
        const sequenceStatsKey = `${a.runId}/${a.chainId}/${a.variableName}`
        const variableStatsKey = `${a.runId}/${a.variableName}`
        return {
            ...s,
            sequenceStats: invalidateStats(s.sequenceStats, sequenceStatsKey),
            variableStats: invalidateStats(s.variableStats, variableStatsKey),
            sequences: s.sequences.map(x => (
                (x.runId !== a.runId || x.chainId !== a.chainId || x.variableName !== a.variableName) ?
                    x : {...x, data: appendData(x.data, a.position, a.data)}
            ))
        }
    }
    else if (a.type === 'markSequenceAsUpdated') {
        return {
            ...s,
            sequences: s.sequences.map(x => (
                (x.runId !== a.runId || x.chainId !== a.chainId || x.variableName !== a.variableName) ?
                    x : {...x, updateRequested: false}
            ))
        }
    }
    else if (a.type === 'updateSequence') {
        if (!s.sequences.find(x => (x.runId === a.runId && x.chainId === a.chainId && x.variableName === a.variableName))) {
            return {
                ...s,
                sequences: [...s.sequences, {
                    runId: a.runId,
                    chainId: a.chainId,
                    variableName: a.variableName,
                    data: [],
                    updateRequested: true
                }]
            }
        }
        else {
            return {
                ...s,
                sequences: s.sequences.map(x => (
                    (x.runId !== a.runId || x.chainId !== a.chainId || x.variableName !== a.variableName) ?
                        x : {...x, updateRequested: true}
                ))
            }
        }
    }
    else if (a.type === 'updateExistingSequences') {
        return {
            ...s,
            sequences: s.sequences.map(x => (
                (x.runId !== a.runId) ?
                    x : {...x, updateRequested: true}
            ))
        }
    }
    else if (a.type === 'setGeneralOpts') {
        const effectiveWarmupIterations = computeEffectiveWarmupIterations(s, a.opts.requestedInitialDrawsToExclude)
        const recalc = effectiveWarmupIterations !== s.effectiveInitialDrawsToExclude
        return {
            ...s,
            sequenceStats: recalc ? invalidateStats(s.sequenceStats) : s.sequenceStats,
            variableStats: recalc ? invalidateStats(s.variableStats) : s.variableStats,
            effectiveInitialDrawsToExclude: effectiveWarmupIterations,
            generalOpts: a.opts
        }
    }
    else if (a.type === 'setSequenceStats') {
        const k = `${a.runId}/${a.chainId}/${a.variableName}`
        return {
            ...s,
            sequenceStats: {
                ...s.sequenceStats,
                [k]: a.stats
            }
        }
    }
    else if (a.type === 'setVariableStats') {
        const k = `${a.runId}/${a.variableName}`
        return {
            ...s,
            variableStats: {
                ...s.variableStats,
                [k]: a.stats
            }
        }
    }
    else return s
}

function appendData(x: number[], position: number, y: number[]) {
    if (position > x.length) return x
    if (position + y.length <= x.length) return x
    return [...x, ...y.slice(x.length - position)]
}


const doChainUpdate = (s: MCMCMonitorData, runId: string, newChains: MCMCChain[]): MCMCMonitorData => {
    const chains = [...s.chains.filter(c => (c.runId !== runId)), ...newChains]
    const newState = { ...s, chains }
    const effectiveWarmupIterations = computeEffectiveWarmupIterations(newState, newState.generalOpts.requestedInitialDrawsToExclude)
    if (effectiveWarmupIterations !== newState.effectiveInitialDrawsToExclude) {
        newState.effectiveInitialDrawsToExclude = effectiveWarmupIterations
    }
    return newState
}


const chainsWereUpdated = (newChains: MCMCChain[], oldChains: MCMCChain[]): boolean => {
    const known: Map<string, number> = new Map()
    oldChains.forEach(c => known.set(c.chainId, c.lastChangeTimestamp))
    // There is an update if there are any new chains for which either a) the chain ID was
    // not yet encountered ( hence "|| -1" ) or b) the new chain update stamp is greater than the old one
    return (newChains.some(newChain => newChain.lastChangeTimestamp > (known.get(newChain.chainId) || -1)))
}


export const detectedWarmupIterationCount = (data: MCMCMonitorData): number | undefined => {
    const observedCount = data.chains.filter(c => c.excludedInitialIterationCount !== undefined)[0]?.excludedInitialIterationCount
    return observedCount
}


const computeEffectiveWarmupIterations = (data: MCMCMonitorData, requested: number): number => {
    // Given a data set, compute how many warm-up iterations to actually skip.
    // This needs to be done because the user can request that the number of warm-up iterations
    // be read from the file, in which case it will not match the number in the dropdown menu.
    // A request for a data-determined number of warm-up iterations is identified by the signal
    // value of -1 for the requested iteration count. If this is passed, we need to look at the
    // data and set the real warm-up count to either 0 (if the actual number is not yet known)
    // or to the observed value (by inspecting the chains).
    // At present, we assume that the value will be the same for any chain, so we can look at
    // any arbitrary chain.
    // Note that as data comes in, we will need to re-evaluate this (even though the requested
    // value has not changed) because we start out not knowing the number.
    // On the other hand, if any value other than -1 is requested, we just use that number directly.
    if (requested === -1) {
        const observedCount = detectedWarmupIterationCount(data)
        return observedCount ?? 0
    } else {
        return requested
    }
}


const invalidateStats = <T extends SequenceStatsDict | VariableStatsDict>(statsDict: T, key?: string): T => {
    if (key === undefined) {
        Object.keys(statsDict).forEach(s => statsDict[s].isUpToDate = false)
    }
    else if (key in Object.keys(statsDict)) {
        statsDict[key].isUpToDate = false
    } else {
        console.warn(`Attempt to invalidate stats with key ${key}, which is not in the dictionary.`)
    }

    return statsDict
}
