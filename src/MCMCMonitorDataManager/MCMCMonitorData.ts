import React from 'react'
import { MCMCChain, MCMCSequence, getSequenceIdentifier } from '../../service/src/types'
import { MCMCSequenceUpdate } from '../../service/src/types/MCMCMonitorRequest'
import sortedListsAreEqual from '../util/sortedListsAreEqual'
import { MCMCMonitorAction, MCMCMonitorData, SequenceStatsDict, VariableStatsDict } from './MCMCMonitorDataTypes'


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

export const mcmcMonitorReducer = (s: MCMCMonitorData, a: MCMCMonitorAction): MCMCMonitorData => {
    switch (a.type) {
        case "setRuns": {
            const runIds = a.runs.map(r => (r.runId))
            return {
                ...s,
                runs: a.runs,
                chains: s.chains.filter(c => (runIds.includes(c.runId)))
            }
        }
        case "setChainsForRun": {
            return doChainUpdate(s, a.runId, a.chains)
        }
        case "updateChainsForRun": {
            const hadUpdates = chainsWereUpdated(a.runId, a.chains, s.chains)
            if (!hadUpdates) return s // preserve reference equality if nothing changed
            return doChainUpdate(s, a.runId, a.chains)
        }
        case "setSelectedVariableNames": {
            const sortedVariableNames = [...a.variableNames].sort()
            if (sortedListsAreEqual(sortedVariableNames, s.selectedVariableNames)) return s
            const newState = {...s, selectedVariableNames: sortedVariableNames}
            addNovelSequences(newState)
            return newState
        }
        case "setSelectedChainIds": {
            const sortedChainIds = [...a.chainIds].sort()
            if (sortedListsAreEqual(sortedChainIds, s.selectedChainIds)) return s
            const newData = { ...s, selectedChainIds: sortedChainIds }
            addNovelSequences(newData)
            return newData
        }
        case "setSelectedRunId": {
            if (s.selectedRunId === a.runId) return s
            const newData = { ...s, selectedRunId: a.runId}
            addNovelSequences(newData)
            return newData
        }
        case "setConnectedToService": {
            return {
                ...s,
                connectedToService: a.connected
            }
        }
        case "setServiceProtocolVersion": {
            return {
                ...s,
                serviceProtocolVersion: a.version
            }
        }
        case "setWebrtcConnectionStatus": {
            return {
                ...s,
                webrtcConnectionStatus: a.status
            }
        }
        case "setUsingProxy": {
            return {
                ...s,
                usingProxy: a.usingProxy
            }
        }
        case "setGeneralOpts": {
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
        case "updateSequenceData": {
            if (a.sequences.length === 0) return s
            return doSequenceUpdate(s, a.sequences)
        }
        case "requestSequenceUpdate": {
            return {
                ...s,
                sequences: s.sequences.map(x => (
                    (x.runId !== a.runId) ?
                        x : {...x, updateRequested: true}
                ))
            }
        }
        case "setSequenceStats": {
            const k = `${a.runId}/${a.chainId}/${a.variableName}`
            return {
                ...s,
                sequenceStats: {
                    ...s.sequenceStats,
                    [k]: a.stats
                }
            }
        }
        case "setVariableStats": {
            const k = `${a.runId}/${a.variableName}`
            return {
                ...s,
                variableStats: {
                    ...s.variableStats,
                    [k]: a.stats
                }
            }
        }
        default: {
            throw Error(`Unknown reducer action ${JSON.stringify(a)}`)
        }
    }
}


export const detectedWarmupIterationCount = (chains: MCMCChain[]): number | undefined => {
    const observedCount = chains.filter(c => c.excludedInitialIterationCount !== undefined)[0]?.excludedInitialIterationCount
    return observedCount
}


const doSequenceUpdate = (s: MCMCMonitorData, sequences: MCMCSequenceUpdate[]): MCMCMonitorData => {
    const knownSequences: Map<string, MCMCSequence> = new Map()
    s.sequences.forEach(seq => knownSequences.set(getSequenceIdentifier(seq), seq))

    const updatedSequences: Map<string, MCMCSequence> = new Map()
    const unmodifiedSequences: Map<string, MCMCSequence> = new Map()
    const sequenceStatsToExpire: string[] = []
    const variableStatsToExpire: string[] = []
    sequences.forEach(update => {
        const key = getSequenceIdentifier(update)
        const known = knownSequences.get(key)
        if (!known) throw Error("Attempt to update unknown sequence, should not be possible")
        knownSequences.delete(key)

        if (update.data.length === 0) {
            known.updateRequested = false   // modifies original data structure in-place
            unmodifiedSequences.set(key, known)
            return
        }
        sequenceStatsToExpire.push(`${update.runId}/${update.chainId}/${update.variableName}`)
        variableStatsToExpire.push(`${update.runId}/${update.variableName}`)
        // consider assert that key does not already exist--it shouldn't
        updatedSequences.set(key, {...known, updateRequested: false, data: appendData(known.data, update.position, update.data)})
    })
    if (updatedSequences.size === 0) return s // no data changes, so don't change reference equality: no need to trigger update

    const newSequences = [...knownSequences.values(), ...unmodifiedSequences.values(), ...updatedSequences.values()]
    sequenceStatsToExpire.map(key => invalidateStats(s.sequenceStats, key))
    variableStatsToExpire.map(key => invalidateStats(s.variableStats, key))

    return {
        ...s,
        sequences: newSequences
    }
}


const addNovelSequences = (data: MCMCMonitorData) => {
    const runId = data.selectedRunId
    if (!runId) return
    if (data.selectedChainIds.length === 0 || data.selectedVariableNames.length === 0) return

    // TODO: cache this? It's not like the list ever gets shorter
    const knownSequences = new Map<string, MCMCSequence>()
    data.sequences.forEach(s => {
        knownSequences.set(getSequenceIdentifier(s), s)
    })
    const unknownSequences = new Map<string, MCMCSequence>()
    for (const chainId of data.selectedChainIds) {
        for (const variableName of data.selectedVariableNames) {
            const key = getSequenceIdentifier({runId, chainId, variableName})
            if (knownSequences.has(key)) continue
            if (unknownSequences.has(key)) {
                throw Error(`Key collision in data from sequence update. This shouldn't be possible.`)
            }
            unknownSequences.set(key, {runId, chainId, variableName, data: [], updateRequested: true})
        }
    }
    if (unknownSequences.size > 0) {
        data.sequences = [...data.sequences, ...unknownSequences.values()]
    }
}


/**
 * Function to append asynchronously-fetched data from a matrix to the internal data store.
 * 
 * We have an existing (cached) data series {@link existingData} and an incoming set of data entries
 * {@link newData}. Both are intended to represent data entries for the same data series from
 * some external file. {@link newData} represents the entries which might need to be appended to
 * the cache, by reading the file starting from the row {@link position}.
 * 
 * Because the cache update can be requested repeatedly in an asyncrhonous environment, we have
 * to deal with cases where data does not align properly. The {@link position} field is key to this,
 * since it is largely passed through from the original request. In the case where {@link position}
 * is greater than the existing data's cached length, we return the existing data unmodified (since
 * we don't have a principled way to add to a data series with a hole in it). In the case where
 * {@link position} plus the length of the data in {@link newData} is less than the overall length
 * of {@link existingData}, we again return the existing data unmodified (since the incoming data
 * update should only represent data that's already in cache). Finally, if the incoming data
 * {@link newData} starts at or before the end of the existing data but continues beyond the
 * end of the existing data series, we can append some or all of {@link newData} to
 * {@link existingData}; we do so and return a new list.
 * In no event do we overwrite anything in the existing cached data series {@link existingData}.
 * 
 * @param existingData A cached data series.
 * @param position The row of the ultimate data source file which marks where the
 * {@link newData} starts.
 * @param newData A data series representing (hopefully newer) entries of {@link existingData}
 * from the original source file.
 * @returns A copy of the data series, possibly with some of the new entries appended.
 */
function appendData(existingData: number[], position: number, newData: number[]) {
    if (position > existingData.length) return existingData
    if (position + newData.length <= existingData.length) return existingData
    return [...existingData, ...newData.slice(existingData.length - position)]
}


// Update should keep any existing chains for other run IDs, and replace anything with the specified run ID with the new chain values.
const doChainUpdate = (s: MCMCMonitorData, runId: string, newChains: MCMCChain[]): MCMCMonitorData => {
    const chains = [...s.chains.filter(c => (c.runId !== runId)), ...newChains]
    const newState = { ...s, chains }
    const effectiveWarmupIterations = computeEffectiveWarmupIterations(newState, newState.generalOpts.requestedInitialDrawsToExclude)
    if (effectiveWarmupIterations !== newState.effectiveInitialDrawsToExclude) {
        newState.effectiveInitialDrawsToExclude = effectiveWarmupIterations
    }
    return newState
}


const chainsWereUpdated = (runId: string, newChains: MCMCChain[], oldChains: MCMCChain[]): boolean => {
    const known: Map<string, number> = new Map()
    oldChains.filter(c => c.runId === runId).forEach(c => known.set(c.chainId, c.lastChangeTimestamp))
    // There is an update if there are any new chains for which either a) the chain ID is not known
    // (hence "|| -1") or b) the new chain update timestamp is greater (more recent) than the old one
    return (newChains.some(newChain => newChain.lastChangeTimestamp > (known.get(newChain.chainId) || -1)))
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
        const observedCount = detectedWarmupIterationCount(data.chains)
        return observedCount ?? 0
    } else {
        return requested
    }
}


const invalidateStats = <T extends SequenceStatsDict | VariableStatsDict>(statsDict: T, key?: string): T => {
    if (key === undefined) {
        Object.keys(statsDict).forEach(s => statsDict[s].isUpToDate = false)
    }
    else if (Object.keys(statsDict).includes(key)) {
        statsDict[key].isUpToDate = false
    } else {
        // No-op--this situation is actually entirely expected.
        // console.warn(`Attempt to invalidate stats with key ${key}, which is not in the dictionary.`)
    }

    return statsDict
}

export {
    addNovelSequences as addNovelSequences_TEST, appendData as appendData_TEST, chainsWereUpdated as chainsWereUpdated_TEST,
    computeEffectiveWarmupIterations as computeEffectiveWarmupIterations_TEST, doChainUpdate as doChainUpdate_TEST, doSequenceUpdate as doSequenceUpdate_TEST, invalidateStats as invalidateStats_TEST
}

