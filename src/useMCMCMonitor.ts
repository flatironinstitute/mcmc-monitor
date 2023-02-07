import { useCallback, useContext } from 'react'
import { GeneralOpts, MCMCMonitorContext } from './MCMCMonitorDataManager/MCMCMonitorData'
import { MCMCChain, MCMCRun } from './MCMCMonitorDataManager/MCMCMonitorTypes'
import { GetChainsForRunRequest, GetRunsRequest, isGetChainsForRunResponse, isGetRunsResponse } from './MCMCMonitorRequest'
import postApiRequest from './postApiRequest'

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

    const setSelectedRunId = useCallback((runId: string) => {
        dispatch({ type: 'setSelectedRunId', runId })
    }, [dispatch])

    const updateRuns = useCallback(() => {
        ; (async () => {
            const req: GetRunsRequest = {
                type: 'getRunsRequest'
            }
            const resp = await postApiRequest(req)
            if (!isGetRunsResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected getRuns response')
            }
            setRuns(resp.runs)
        })()
    }, [setRuns])

    const updateChainsForRun = useCallback((runId: string) => {
        ; (async () => {
            const req: GetChainsForRunRequest = {
                type: 'getChainsForRunRequest',
                runId
            }
            const resp = await postApiRequest(req)
            if (!isGetChainsForRunResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected getChainsForRun response')
            }
            setChainsForRun(runId, resp.chains)
        })()
    }, [setChainsForRun])

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
        selectedRunId: data.selectedRunId,
        connectedToService: data.connectedToService,
        generalOpts: data.generalOpts,
        sequenceStats: data.sequenceStats,
        updateRuns,
        updateChainsForRun,
        updateExistingSequences,
        setSelectedVariableNames,
        setSelectedChainIds,
        setSelectedRunId,
        setGeneralOpts
    }
}