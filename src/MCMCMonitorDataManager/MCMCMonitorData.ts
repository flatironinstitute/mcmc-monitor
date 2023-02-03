import React from 'react'
import { MCMCChain, MCMCRun, MCMCSequence } from './MCMCMonitorTypes'

export type GeneralOpts = {
    updateMode: 'auto' | 'manual'
    excludeInitialDraws: number
}

export type MCMCMonitorData = {
    connectedToService: boolean | undefined
    runs: MCMCRun[]
    chains: MCMCChain[]
    sequences: MCMCSequence[]
    selectedVariableNames: string[]
    selectedChainIds: string[]
    generalOpts: GeneralOpts
}

export const initialMCMCMonitorData: MCMCMonitorData = {
    connectedToService: undefined,
    runs: [],
    chains: [],
    sequences: [],
    selectedVariableNames: [],
    selectedChainIds: [],
    generalOpts: {updateMode: 'manual', excludeInitialDraws: 20}
}

export const MCMCMonitorContext = React.createContext<{ data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void }>({
    data: initialMCMCMonitorData,
    dispatch: () => { }
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
    type: 'setSelectedChainIds'
    chainIds: string[]
} | {
    type: 'setConnectedToService'
    connected: boolean
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
    else if (a.type === 'setConnectedToService') {
        return {
            ...s,
            connectedToService: a.connected
        }
    }
    else if (a.type === 'appendSequenceData') {
        return {
            ...s,
            sequences: s.sequences.map(x => (
                (x.runId !== a.runId || x.chainId !== a.chainId || x.variableName !== a.variableName) ?
                    x : {...x, updateRequested: false, data: appendData(x.data, a.position, a.data)}
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
        return {
            ...s,
            generalOpts: a.opts
        }
    }
    else return s
}

function appendData(x: number[], position: number, y: number[]) {
    if (position > x.length) return x
    if (position + y.length <= x.length) return x
    return [...x, ...y.slice(x.length - position)]
}