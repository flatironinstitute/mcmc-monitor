import { useCallback, useContext } from 'react'
import { serviceBaseUrl } from './config'
import { GeneralOpts, MCMCMonitorContext } from './MCMCMonitorDataManager/MCMCMonitorData'
import { MCMCChain, MCMCRun } from './MCMCMonitorDataManager/MCMCMonitorTypes'

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
        generalOpts: data.generalOpts,
        updateRuns,
        updateChainsForRun,
        updateSequence,
        updateExistingSequences,
        setSelectedVariableNames,
        setSelectedChainIds,
        setGeneralOpts
    }
}