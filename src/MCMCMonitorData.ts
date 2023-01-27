import React, { useCallback, useContext } from 'react'
import { MCMCChain, MCMCRun } from './MCMCMonitorTypes'

export type MCMCMonitorData = {
    runs: MCMCRun[]
    chains: MCMCChain[]
}

export const initialMCMCMonitorData: MCMCMonitorData = {
    runs: [],
    chains: []
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

    const updateRuns = useCallback(() => {
        ; (async () => {
            const resp = await fetch(`http://localhost:61542/getRuns`)
            const x: {runs: MCMCRun[]} = await resp.json()
            setRuns(x.runs)
        })()
    }, [setRuns])

    const updateChainsForRun = useCallback((runId: string) => {
        ; (async () => {
            const resp = await fetch(`http://localhost:61542/getChainsForRun/${runId}`)
            const x: {chains: MCMCChain[]} = await resp.json()
            setChainsForRun(runId, x.chains)
        })()
    }, [setChainsForRun])

    return {
        runs: data.runs,
        chains: data.chains,
        updateRuns,
        updateChainsForRun
    }
}

export type MCMCMonitorAction = {
    type: 'setRuns'
    runs: MCMCRun[]
} | {
    type: 'setChainsForRun'
    runId: string
    chains: MCMCChain[]
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
    else return s
}
