import React, { useCallback, useContext } from 'react'
import { SequenceHistogramOpts } from './components/SequenceHistogram'
import { serviceBaseUrl } from './config'
import { MCMCChain, MCMCRun, MCMCSequence } from './MCMCMonitorTypes'

export type GeneralOpts = {
    updateMode: 'auto' | 'manual'
}

export type MCMCMonitorData = {
    connectedToService: boolean | undefined
    runs: MCMCRun[]
    chains: MCMCChain[]
    sequences: MCMCSequence[]
    selectedVariableNames: string[]
    selectedChainIds: string[]
    sequenceHistogramOpts: SequenceHistogramOpts
    generalOpts: GeneralOpts
}

export const initialMCMCMonitorData: MCMCMonitorData = {
    connectedToService: undefined,
    runs: [],
    chains: [],
    sequences: [],
    selectedVariableNames: [],
    selectedChainIds: [],
    sequenceHistogramOpts: {numIterations: 100},
    generalOpts: {updateMode: 'manual'}
}

export const MCMCMonitorContext = React.createContext<{ data: MCMCMonitorData, dispatch: (a: MCMCMonitorAction) => void }>({
    data: initialMCMCMonitorData,
    dispatch: () => { }
})

export const useMCMCMonitor = () => {
    const { data, dispatch } = useContext(MCMCMonitorContext)

    const setRuns = useCallback((runs: MCMCRun[]) => {
        dispatch({ type: 'setRuns', runs })
    }, [dispatch])

    const setChainsForRun = useCallback((runId: string, chains: MCMCChain[]) => {
        dispatch({ type: 'setChainsForRun', runId, chains })
    }, [dispatch])

    const setSelectedVariableNames = useCallback((variableNames: string[]) => {
        dispatch({ type: 'setSelectedVariableNames', variableNames })
    }, [dispatch])

    const setSelectedChainIds = useCallback((chainIds: string[]) => {
        dispatch({ type: 'setSelectedChainIds', chainIds })
    }, [dispatch])

    const updateRuns = useCallback(() => {
        ; (async () => {
            const resp = await fetch(`${serviceBaseUrl}/getRuns`)
            const x: {runs: MCMCRun[]} = await resp.json()
            setRuns(x.runs)
        })()
    }, [setRuns])

    const updateChainsForRun = useCallback((runId: string) => {
        ; (async () => {
            const resp = await fetch(`${serviceBaseUrl}/getChainsForRun/${runId}`)
            const x: {chains: MCMCChain[]} = await resp.json()
            setChainsForRun(runId, x.chains)
        })()
    }, [setChainsForRun])

    const updateSequence = useCallback((runId: string, chainId: string, variableName: string) => {
        dispatch({
            type: 'updateSequence',
            runId,
            chainId,
            variableName
        })
    }, [dispatch])

    const updateExistingSequences = useCallback((runId: string) => {
        dispatch({
            type: 'updateExistingSequences',
            runId
        })
    }, [dispatch])

    const setSequenceHistogramOpts = useCallback((opts: SequenceHistogramOpts) => {
        dispatch({
            type: 'setSequenceHistogramOpts',
            opts
        })
    }, [dispatch])

    const setGeneralOpts = useCallback((opts: GeneralOpts) => {
        dispatch({
            type: 'setGeneralOpts',
            opts
        })
    }, [dispatch])

    return {
        runs: data.runs,
        chains: data.chains,
        sequences: data.sequences,
        selectedVariableNames: data.selectedVariableNames,
        selectedChainIds: data.selectedChainIds,
        connectedToService: data.connectedToService,
        sequenceHistogramOpts: data.sequenceHistogramOpts,
        generalOpts: data.generalOpts,
        updateRuns,
        updateChainsForRun,
        updateSequence,
        updateExistingSequences,
        setSelectedVariableNames,
        setSelectedChainIds,
        setSequenceHistogramOpts,
        setGeneralOpts
    }
}

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
    type: 'setSequenceHistogramOpts'
    opts: SequenceHistogramOpts
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
    else if (a.type === 'setSequenceHistogramOpts') {
        return {
            ...s,
            sequenceHistogramOpts: a.opts
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