import React from 'react'
import { MCMCChain, MCMCRun, MCMCSequence } from './MCMCMonitorTypes'

export type GeneralOpts = {
    updateMode: 'auto' | 'manual'
    excludeInitialDraws: number
}

export type SequenceStats = {
    mean?: number
    stdev?: number
    count?: number
    ess?: number
    acor?: number[]
}

export type VariableStats = {
    mean?: number
    stdev?: number
    ess?: number
    count?: number
    rhat?: number
}

export type MCMCMonitorData = {
    connectedToService: boolean | undefined
    webrtcConnectionStatus: 'unused' | 'pending' | 'connected' | 'error'
    usingProxy: boolean | undefined
    runs: MCMCRun[]
    chains: MCMCChain[]
    sequences: MCMCSequence[]
    sequenceStats: {[key: string]: SequenceStats}
    variableStats: {[key: string]: VariableStats}
    selectedRunId?: string
    selectedVariableNames: string[]
    selectedChainIds: string[]
    generalOpts: GeneralOpts
}

export const initialMCMCMonitorData: MCMCMonitorData = {
    connectedToService: undefined,
    webrtcConnectionStatus: 'pending',
    usingProxy: undefined,
    runs: [],
    chains: [],
    sequences: [],
    sequenceStats: {},
    variableStats: {},
    selectedVariableNames: [],
    selectedChainIds: [],
    generalOpts: {updateMode: 'manual', excludeInitialDraws: 20}
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
    type: 'appendSequenceData'
    runId: string
    chainId: string
    variableName: string
    position: number
    data: number[]
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
        return {
            ...s,
            chains: [...s.chains.filter(c => (c.runId !== a.runId)), ...a.chains]
        }
    }
    else if (a.type === 'setSelectedVariableNames') {
        return {
            ...s,
            selectedVariableNames: a.variableNames
        }
    }
    else if (a.type === 'setSelectedChainIds') {
        return {
            ...s,
            selectedChainIds: a.chainIds
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
        const k = `${a.runId}/${a.chainId}/${a.variableName}`
        const k2 = `${a.runId}/${a.variableName}`
        return {
            ...s,
            sequenceStats: {
                ...s.sequenceStats,
                [k]: {} // invalidate the sequence stats
            },
            variableStats: {
                ...s.variableStats,
                [k2]: {} //invalidate the variable stats
            },
            sequences: s.sequences.map(x => (
                (x.runId !== a.runId || x.chainId !== a.chainId || x.variableName !== a.variableName) ?
                    x : {...x, updateRequested: false, data: appendData(x.data, a.position, a.data)}
            ))
        }
    }
    else if (a.type === 'updateSequence') {
        const k = `${a.runId}/${a.chainId}/${a.variableName}`
        const k2 = `${a.runId}/${a.variableName}`
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
                sequenceStats: {
                    ...s.sequenceStats,
                    [k]: {} // invalidate
                },
                variableStats: {
                    ...s.variableStats,
                    [k2]: {} // invalidate
                },
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
        return {
            ...s,
            sequenceStats: {}, // invalidate the sequence stats
            variableStats: {}, // invalidate the variable stats
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