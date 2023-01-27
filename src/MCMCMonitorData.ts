import React, { useCallback, useContext } from 'react'
import { serviceBaseUrl } from './config'
import { MCMCChain, MCMCRun, MCMCSequence } from './MCMCMonitorTypes'

export type MCMCMonitorData = {
    connectedToService: boolean | undefined
    runs: MCMCRun[]
    chains: MCMCChain[]
    sequences: MCMCSequence[]
    selectedVariableNames: string[]
}

export const initialMCMCMonitorData: MCMCMonitorData = {
    connectedToService: undefined,
    runs: [],
    chains: [],
    sequences: [],
    selectedVariableNames: []
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

    const setSequence = useCallback((runId: string, chainId: string, variableName: string, sequence: MCMCSequence) => {
        dispatch({ type: 'setSequence', runId, chainId, variableName, sequence })
    }, [dispatch])

    const setSelectedVariableNames = useCallback((variableNames: string[]) => {
        dispatch({ type: 'setSelectedVariableNames', variableNames })
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
        ; (async () => {
            const resp = await fetch(`${serviceBaseUrl}/getSequence/${runId}/${chainId}/${variableName}`)
            const x: {sequence: MCMCSequence} = await resp.json()
            setSequence(runId, chainId, variableName, x.sequence)
        })()
    }, [setSequence])

    return {
        runs: data.runs,
        chains: data.chains,
        sequences: data.sequences,
        selectedVariableNames: data.selectedVariableNames,
        connectedToService: data.connectedToService,
        updateRuns,
        updateChainsForRun,
        updateSequence,
        setSelectedVariableNames
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
    type: 'setSequence'
    runId: string
    chainId: string
    variableName: string
    sequence: MCMCSequence
} | {
    type: 'setSelectedVariableNames'
    variableNames: string[]
} | {
    type: 'setConnectedToService'
    connected: boolean
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
    else if (a.type === 'setSequence') {
        return {
            ...s,
            sequences: [...s.sequences.filter(x => (x.runId !== a.runId || x.chainId !== a.chainId || x.variableName !== a.variableName)), a.sequence]
        }
    }
    else if (a.type === 'setSelectedVariableNames') {
        return {
            ...s,
            selectedVariableNames: a.variableNames
        }
    }
    else if (a.type === 'setConnectedToService') {
        return {
            ...s,
            connectedToService: a.connected
        }
    }
    else return s
}
