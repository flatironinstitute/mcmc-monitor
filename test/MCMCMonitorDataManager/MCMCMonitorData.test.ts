import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MCMCChain, MCMCSequence, MCMCSequenceUpdate } from '../../service/src/types'
import { addNovelSequences_TEST, appendData_TEST, chainsWereUpdated_TEST, computeEffectiveWarmupIterations_TEST, detectedWarmupIterationCount, doChainUpdate_TEST, doSequenceUpdate_TEST, initialMCMCMonitorData, invalidateStats_TEST, mcmcMonitorReducer } from '../../src/MCMCMonitorDataManager/MCMCMonitorData'
import { MCMCMonitorAction, MCMCMonitorData, SequenceStats, SequenceStatsDict, VariableStats, VariableStatsDict } from '../../src/MCMCMonitorDataManager/MCMCMonitorDataTypes'


/**
 * ceteris paribus, adv: "With all other conditions remaining the same."
 * Utility function to compare two objects and ensure that the modified version has
 * not modified any fields except the ones intended to be modified.
 * @param original Original version of the object.
 * @param modified Modified copy, expected to be created through spread operator.
 * @param excluded Named fields which are expected to have been changed.
 */
const ceterisParibus = <T extends object>(original: T, modified: T, excluded: string[]) => {
    const known = new Set(Object.keys(original))
    const novel = new Set(Object.keys(modified))
    excluded.forEach(k => {
        known.delete(k)
        novel.delete(k)
    })
    expect(known).toStrictEqual(novel)
    known.forEach(k => expect(original[k]).toStrictEqual(modified[k]))
}

describe("MCMCMonitorData reducer run setting", () => {
    let data: MCMCMonitorData
    beforeEach(() => {
        data = {
            connectedToService: true,
            serviceProtocolVersion: 'version12',
            runs: [{runId: 'run1'}, {runId: 'run2'}, {runId: 'run3'}],
            chains: [
                {
                    runId: 'run1',
                    chainId: 'chain1',
                    variableNames: ['var1', 'var2'],
                    lastChangeTimestamp: 5
                },
                {
                    runId: 'run2',
                    chainId: 'chain1',
                    variableNames: ['var1', 'var2'],
                    lastChangeTimestamp: 5
                },
                {
                    runId: 'run4',
                    chainId: 'chain1',
                    variableNames: ['var1', 'var2'],
                    lastChangeTimestamp: 5
                }
            ]
        } as unknown as MCMCMonitorData
    })
    test("Setting runs persists the newly selected run list", () => {
        const newRuns = [{runId: 'run1'}, {runId: 'run4'}]
        const act = {
            type: 'setRuns',
            runs: newRuns
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['runs', 'chains'])
        expect(res.runs).toEqual(newRuns)
    })
    test("Setting runs restricts chains to those in the new run set", () => {
        const newRuns = [{runId: 'run1'}, {runId: 'run4'}]
        const act = {
            type: 'setRuns',
            runs: newRuns
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['runs', 'chains'])
        expect(res.runs).toEqual(newRuns)
    })
})

describe("MCMCMonitorData reducer chain setting/updates", () => {
    let data: MCMCMonitorData
    let chains: MCMCChain[]
    beforeEach(() => {
        chains = [
            {
                runId: 'run1',
                chainId: 'chain1',
                variableNames: ['var1', 'var2'],
                lastChangeTimestamp: 5
            },
            {
                runId: 'run2',
                chainId: 'chain1',
                variableNames: ['var1', 'var2'],
                lastChangeTimestamp: 5
            },
            {
                runId: 'run4',
                chainId: 'chain1',
                variableNames: ['var1', 'var2'],
                lastChangeTimestamp: 5
            }
        ] as unknown as MCMCChain[]
        data = {
            connectedToService: false,
            serviceProtocolVersion: "MyOriginalVersion",
            webrtcConnectionStatus: "unused",
            usingProxy: false,
            selectedRunId: "mySelectedId",
            chains,
            generalOpts: { requestedInitialDrawsToExclude: 10 },
            effectiveInitialDrawsToExclude: 10
        } as any as MCMCMonitorData
    })
    test("Setting chains for run updates chains for that run only", () => {
        const newChain = {
            ...chains[0], variableNames: ['newVar'], lastChangeTimestamp: chains[0].lastChangeTimestamp + 15
        }
        const act = {
            type: 'setChainsForRun',
            runId: newChain.runId,
            chains: [newChain]
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['chains'])
        const updated = res.chains.filter(c => c.runId === newChain.runId)
        const unchanged = res.chains.filter(c => c.runId !== newChain.runId)
        expect(updated.length).toBe(1)
        expect(unchanged.length).toBe(2)
        unchanged.forEach(c => {
            const match = chains.filter(m => m.runId === c.runId)[0]
            expect(match).toBe(c)
        })
        expect(updated[0].variableNames).toEqual(['newVar'])
        expect(updated[0].lastChangeTimestamp).toEqual(chains[0].lastChangeTimestamp + 15)
    })
    test("Updating chains for run returns identity if no chains were updated", () => {
        const unmodifiedChain = chains[0]
        const act = {
            type: 'updateChainsForRun',
            runId: unmodifiedChain.runId,
            chains: [unmodifiedChain]
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        expect(res).toBe(data)
    })
    test("Updating chains for run updates chains if there were updates", () => {
        const newChain = {
            ...chains[0], lastChangeTimestamp: chains[0].lastChangeTimestamp + 15
        }
        const act = {
            type: 'updateChainsForRun',
            runId: newChain.runId,
            chains: [newChain]
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['chains'])
        const updated = res.chains.filter(c => c.runId === newChain.runId)
        const unchanged = res.chains.filter(c => c.runId !== newChain.runId)
        expect(updated.length).toBe(1)
        expect(unchanged.length).toBe(2)
        unchanged.forEach(c => {
            const match = chains.filter(m => m.runId === c.runId)[0]
            expect(match).toBe(c)
        })
        expect(updated[0].lastChangeTimestamp).toEqual(chains[0].lastChangeTimestamp + 15)
    })
})

describe("MCMCMonitorData reducer variable/chain/run selection", () => {
    let data: MCMCMonitorData
    const makeSequence = (runId: string, chainId: string, variableName: string): MCMCSequence => {
        return { runId, chainId, variableName, data: [1, 2, 3, 4], updateRequested: false }
    }
    beforeEach(() => {
        data = {
            connectedToService: true,
            serviceProtocolVersion: 'version12',
            runs: ['run1'],
            selectedRunId: 'run1',
            selectedChainIds: ['chain1', 'chain2'],
            selectedVariableNames: ['var1', 'var2'],
            sequences: [
                makeSequence('run1', 'chain1', 'var1'),
                makeSequence('run1', 'chain1', 'var2'),
                makeSequence('run1', 'chain2', 'var1'),
                makeSequence('run1', 'chain2', 'var2'),
            ]
        } as unknown as MCMCMonitorData
    })
    test("Setting selected variable names returns identity if no new selection", () => {
        const newVars = data.selectedVariableNames
        const act = {
            type: 'setSelectedVariableNames',
            variableNames: newVars
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        expect(res).toBe(data)
    })
    test("Setting selected variable names persists new variable name list", () => {
        const newVars = ['var2']
        const act = {
            type: 'setSelectedVariableNames',
            variableNames: newVars
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['selectedVariableNames', 'sequences'])
        expect(res.selectedVariableNames).toEqual(newVars)
    })
    test("Setting selected variable names adds any missing sequences", () => {
        const newVars = ['var2', 'var3']
        const act = {
            type: 'setSelectedVariableNames',
            variableNames: newVars
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['selectedVariableNames', 'sequences'])
        expect(res.sequences.length).toBe(6)
        expect(res.sequences.filter(s => s.variableName === 'var3').length).toBe(2)
    })
    test("Setting selected chains returns identity on no change", () => {
        const newChains = data.selectedChainIds
        const act = {
            type: 'setSelectedChainIds',
            chainIds: newChains
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        expect(res).toBe(data)
    })
    test("Setting selected chains persists the selected list", () => {
        const newChains = ['chain2']
        const act = {
            type: 'setSelectedChainIds',
            chainIds: newChains
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['selectedChainIds', 'sequences'])
        expect(res.selectedChainIds).toEqual(newChains)
    })
    test("Setting selected chains adds any missing sequences", () => {
        const newChains = ['chain2', 'chain3']
        const act = {
            type: 'setSelectedChainIds',
            chainIds: newChains
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['selectedChainIds', 'sequences'])
        expect(res.sequences.length).toBe(6)
        expect(res.sequences.filter(s => s.chainId === 'chain3').length).toBe(2)
    })
    test("Setting selected run ID returns identity on no change", () => {
        const repeatedOldRun = data.selectedRunId
        const act = {
            type: 'setSelectedRunId',
            runId: repeatedOldRun
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        expect(res).toBe(data)
    })
    test("Setting selected run ID persists the input run ID", () => {
        const newRun = 'run2'
        const act = {
            type: 'setSelectedRunId',
            runId: newRun
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['selectedRunId', 'sequences'])
        expect(res.selectedRunId).toBe(newRun)
    })
    test("Setting selected run ID adds any missing sequences", () => {
        const newRun = 'run2'
        const act = {
            type: 'setSelectedRunId',
            runId: newRun
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['selectedRunId', 'sequences'])
        expect(res.sequences.length).toBe(8)
        expect(res.sequences.filter(s => s.runId === newRun).length).toBe(4)
    })
})

describe("MCMCMonitorData reducer connection accounting", () => {
    let data: MCMCMonitorData
    beforeEach(() => {
        data = {
            connectedToService: false,
            serviceProtocolVersion: "MyOriginalVersion",
            webrtcConnectionStatus: "unused",
            usingProxy: false,
            selectedRunId: "mySelectedId"
        } as any as MCMCMonitorData
    })
    test("Setting service connection persists connection status", () => {
        const newConnectionState = !data.connectedToService
        const action = {
            type: "setConnectedToService",
            connected: newConnectionState
        } as any as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        ceterisParibus(data, res, ["connectedToService"])
        expect(res.connectedToService).toBe(newConnectionState)
    })
    test("Setting protocol version persists", () => {
        const newProtocol = "a new protocol version"
        const action = {
            type: "setServiceProtocolVersion",
            version: newProtocol
        } as any as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        ceterisParibus(data, res, ["serviceProtocolVersion"])
        expect(res.serviceProtocolVersion).toBe(newProtocol)
    })
    test("Setting Web RTC connection persists", () => {
        const newStatus = "pending"
        expect(data.webrtcConnectionStatus !== newStatus).toBeTruthy()
        const action = {
            type: "setWebrtcConnectionStatus",
            status: newStatus
        } as any as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        ceterisParibus(data, res, ["webrtcConnectionStatus"])
        expect(res.webrtcConnectionStatus).toBe(newStatus)
    })
    test("Setting proxy status persists", () => {
        const newProxy = !data.usingProxy
        const action = {
            type: "setUsingProxy",
            usingProxy: newProxy
        } as any as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        ceterisParibus(data, res, ["usingProxy"])
        expect(res.usingProxy).toBe(newProxy)
    })
})

describe("MCMCMonitorData reducer general options accounting", () => {
    let data: MCMCMonitorData
    const encodedIterationCount = 27
    const currentExclusion = 10
    beforeEach(() => {
        data = {
            generalOpts: {
                dataRefreshMode: 'manual',
                dataRefreshIntervalSec: 5,
                requestedInitialDrawsToExclude: currentExclusion
            },
            sequenceStats: {
                key1: { isUpToDate: true },
                key2: { isUpToDate: true }
            },
            variableStats: {
                varkey1: { isUpToDate: true },
                varkey2: { isUpToDate: true }
            },
            effectiveInitialDrawsToExclude: currentExclusion,
            chains: [{
                excludedInitialIterationCount: encodedIterationCount
            }] as unknown as MCMCChain[]
        } as unknown as MCMCMonitorData
    })
    test("Recomputes effective warmup iterations if requested", () => {
        const opts = {
            dataRefreshMode: 'auto',
            dataRefreshIntervalSec: 6,
            requestedInitialDrawsToExclude: -1
        }
        const act = {
            type: "setGeneralOpts",
            opts
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['generalOpts', 'effectiveInitialDrawsToExclude'])
        expect(res.effectiveInitialDrawsToExclude).toBe(encodedIterationCount)
        expect(Object.values(res.sequenceStats).every(s => s.isUpToDate === false)).toBeTruthy()
        expect(Object.values(res.variableStats).every(s => s.isUpToDate === false)).toBeTruthy()
        expect(res.generalOpts).toBe(opts)
    })
    test("Invalidates stats on sequences and variables if warmup iterations changed", () => {
        const newRequestedExclusion = data.generalOpts.requestedInitialDrawsToExclude + 3
        const opts = {
            dataRefreshMode: 'auto',
            dataRefreshIntervalSec: 6,
            requestedInitialDrawsToExclude: newRequestedExclusion
        }
        const act = {
            type: "setGeneralOpts",
            opts
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['generalOpts', 'effectiveInitialDrawsToExclude'])
        expect(res.effectiveInitialDrawsToExclude).toBe(newRequestedExclusion)
        expect(Object.values(res.sequenceStats).every(s => s.isUpToDate === false)).toBeTruthy()
        expect(Object.values(res.variableStats).every(s => s.isUpToDate === false)).toBeTruthy()
        expect(res.generalOpts).toBe(opts)
    })
    test("Persists new options", () => {
        const opts = {
            dataRefreshMode: 'auto',
            dataRefreshIntervalSec: 6,
            requestedInitialDrawsToExclude: currentExclusion
        }
        const act = {
            type: "setGeneralOpts",
            opts
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, act)
        ceterisParibus(data, res, ['generalOpts', 'effectiveInitialDrawsToExclude'])
        expect(res.effectiveInitialDrawsToExclude).toBe(currentExclusion)
        expect(Object.values(res.sequenceStats).every(s => s.isUpToDate === true)).toBeTruthy()
        expect(Object.values(res.variableStats).every(s => s.isUpToDate === true)).toBeTruthy()
        expect(res.generalOpts).toBe(opts)
    })
})

describe("MCMCMonitorData reducer sequence updating", () => {
    test("Returns identity if incoming sequence list is empty", () => {
        const data = {
            connectedToService: false,
            selectedRunId: "12",
            sequences: [ "a", "b", "c" ]
        } as unknown as MCMCMonitorData
        const action = {
            type: "updateSequenceData",
            sequences: []
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        expect(res).toBe(data)
    })
    test("Updates sequences if updated sequence values are passed", () => {
        const data = {
            connectedToService: false,
            selectedRunId: "12",
            sequenceStats: {},
            variableStats: {},
            sequences: [{
                runId: "run1",
                chainId: "chain1",
                variableName: "var1",
                data: [1, 2, 3],
                updateRequested: true
            }]
        } as unknown as MCMCMonitorData
        const action = {
            type: "updateSequenceData",
            sequences: [{
                runId: "run1",
                chainId: "chain1",
                variableName: "var1",
                position: 2,
                data: [3, 4, 5]
            }]
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        ceterisParibus(data, res, ["sequences"])
        expect(res.sequences[0].updateRequested).toBeFalsy()
        expect(res.sequences[0].data).toEqual([1, 2, 3, 4, 5])
    })
})

describe("MCMCMonitorData reducer sequence update request", () => {
    test("Flags all sequences matching the incoming runId as requiring update", () => {
        const targetRunId = "run2"
        const data: MCMCMonitorData = {
            connectedToService: false,
            selectedRunId: "12",
            sequences: [
                {
                    runId: targetRunId + "5",
                    updateRequested: false
                },
                {
                    runId: targetRunId,
                    updateRequested: false
                },
                {
                    runId: targetRunId + "15",
                    updateRequested: false
                },
                {
                    runId: targetRunId,
                    updateRequested: false
                }
            ]
        } as unknown as MCMCMonitorData
        const action = {
            type: "requestSequenceUpdate",
            runId: targetRunId
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        ceterisParibus(data, res, ["sequences"])
        const untouched = res.sequences.filter(s => s.runId !== targetRunId)
        const modified = res.sequences.filter(s => s.runId === targetRunId)
        expect(untouched.every(s => s.updateRequested === false)).toBeTruthy()
        expect(modified.every(s => s.updateRequested === true)).toBeTruthy()
    })
})

describe("MCMCMonitorData reducer stats update", () => {
    let data: MCMCMonitorData
    const sequenceKeys = ["run1/chain1/var1", "run1/chain1/var2"]
    const variableKeys = ["run1/var1", "run1/var2"]
    beforeEach(() => {
        data = {
            selectedChainIds: ['a', 'b', 'c'],
            sequenceStats: sequenceKeys.reduce((o, k) => ({...o, [k]: {mean: -5} as any as SequenceStats}), {}),
            variableStats: variableKeys.reduce((o, k) => ({...o, [k]: {mean: -10} as any as VariableStats}), {})
        } as unknown as MCMCMonitorData
    })
    test("Setting sequence stats sets only the stats for the specified key", () => {
        const action = {
            type: 'setSequenceStats',
            runId: "run1",
            chainId: "chain1",
            variableName: "var1",
            stats: {mean: 15}
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        ceterisParibus(data, res, ['sequenceStats'])
        expect(res.sequenceStats[sequenceKeys[0]].mean).toBe(15)
        expect(res.sequenceStats[sequenceKeys[1]].mean).toBe(-5)
    })
    test("Setting variable stats sets only the stats for the specified key", () => {
        const action = {
            type: 'setVariableStats',
            runId: "run1",
            variableName: "var1",
            stats: {mean: 15}
        } as unknown as MCMCMonitorAction
        const res = mcmcMonitorReducer(data, action)
        ceterisParibus(data, res, ['variableStats'])
        expect(res.variableStats[variableKeys[0]].mean).toBe(15)
        expect(res.variableStats[variableKeys[1]].mean).toBe(-10)
    })
})
describe("MCMCMonitorData reducer throws error on bad action request", () => {
    test("Throws error on unrecognized action verb", () => {
        const action = { type: "BadAction" } as unknown as MCMCMonitorAction
        const data = {} as unknown as MCMCMonitorData
        expect(() => mcmcMonitorReducer(data, action)).toThrow(/Unknown reducer action/)
    })
})

describe("Detected warmup iteration count", () => {
    let chains: MCMCChain[]

    const expectedCount = 15
    beforeEach(() => {
        const runId = "0"
        const knownChainIds = ["1", "2"]
        const varNames = ["not used 1", "not used 2"]
        const knownLastChangeTime = 1000
        chains = knownChainIds.map(id => {
            return {
                runId: runId,
                chainId: id,
                variableNames: varNames,
                lastChangeTimestamp: knownLastChangeTime
            }
        })
    })
    test("Returns the detected value when some chain has an explicit count", () => {
        chains[1].excludedInitialIterationCount = expectedCount
        expect(detectedWarmupIterationCount(chains)).toBe(expectedCount)
    })
    test("Returns undefined when no chain has an explicit count", () => {
        expect(detectedWarmupIterationCount(chains)).toBeUndefined()
    })
})


// Tests for private functions--MCMCMonitorData.ts

describe("Sequence update function", () => {
    let data: MCMCMonitorData
    let baseSequences: MCMCSequence[]

    const makeUpdateFromBase = (base: MCMCSequence, newData: number[], position?: number): MCMCSequenceUpdate => {
        return {
            runId: base.runId,
            chainId: base.chainId,
            variableName: base.variableName,
            position: position ?? base.data.length,
            data: newData
        }
    }
    beforeEach(() => {
        baseSequences = [
            {
                runId: "1",
                chainId: "chain1",
                variableName: "var1",
                data: [1, 2, 3],
                updateRequested: true
            },
            {
                runId: "1",
                chainId: "chain2",
                variableName: "var1",
                data: [1, 2, 3, 4, 5],
                updateRequested: true
            },
            {
                runId: "1",
                chainId: "chain1",
                variableName: "var2",
                data: [1, 2, 3, 4],
                updateRequested: true
            }
        ]
    
        const seqStatsDict: SequenceStatsDict = baseSequences.reduce((o, baseSeq) => ({...o, [`${baseSeq.runId}/${baseSeq.chainId}/${baseSeq.variableName}`]: { isUpToDate: true } as any as SequenceStats}), {})
        const varStatsDict: VariableStatsDict = baseSequences.reduce((o, baseSeq) => ({...o, [`${baseSeq.runId}/${baseSeq.variableName}`]: { isUpToDate: true } as any as VariableStats}), {})
        data = {
            sequenceStats: seqStatsDict,
            variableStats: varStatsDict,
            sequences: baseSequences
        } as any as MCMCMonitorData
    })

    test("Throws if update set contains an unknown key", () => {
        const unknownNewSequence: MCMCSequenceUpdate[] = [
            makeUpdateFromBase(baseSequences[0], [1, 2])
        ]
        unknownNewSequence[0].runId += "NOT-FOUND"
        expect(() => doSequenceUpdate_TEST(data, unknownNewSequence)).toThrow(/unknown sequence/)
    })
    test("Returns original object if no effective updates", () => {
        const ineffectiveUpdate = [
            makeUpdateFromBase(baseSequences[0], [])
        ]
        const response = doSequenceUpdate_TEST(data, ineffectiveUpdate)
        expect(response).toBe(data)
    })
    test("Seen sequences without modification have update-requested flag set to false", () => {
        const ineffectiveUpdate = [
            makeUpdateFromBase(baseSequences[0], [])
        ]
        const response = doSequenceUpdate_TEST(data, ineffectiveUpdate)
        expect(response.sequences[0].updateRequested).toBeFalsy()
    })
    test("Returns a mix of unmodified and updated sequences when sequences have updates", () => {
        const update = [
            makeUpdateFromBase(baseSequences[0], [4, 5, 6]),
            makeUpdateFromBase(baseSequences[2], [4, 5, 6], baseSequences[2].data.length - 1)
        ]
        const response = doSequenceUpdate_TEST(data, update)
        expect(response.sequences.length).toEqual(3)
        const firstUpdate = response.sequences.filter(s => s.runId === update[0].runId
            && s.chainId === update[0].chainId && s.variableName === update[0].variableName)[0]
        const secondUpdate = response.sequences.filter(s => s.runId === update[1].runId
            && s.chainId === update[1].chainId && s.variableName === update[1].variableName)[0]
        const unchanged = response.sequences.filter(s => s.updateRequested)[0]
        expect(firstUpdate.updateRequested).toBeFalsy()
        expect(secondUpdate.updateRequested).toBeFalsy()
        expect(unchanged).toBe(baseSequences[1])
        expect(firstUpdate.data).toEqual([1, 2, 3, 4, 5, 6])
        expect(secondUpdate.data).toEqual([1, 2, 3, 4, 5, 6])
    })
    test("Invalidates statistics of updated sequences/variables", () => {
        const update = [
            makeUpdateFromBase(baseSequences[0], [4, 5, 6]),
            makeUpdateFromBase(baseSequences[2], [4, 5, 6], baseSequences[2].data.length - 1)
        ]
        expect(Object.keys(data.sequenceStats).length).toBe(3)
        expect(Object.keys(data.variableStats).length).toBe(2)
        const response = doSequenceUpdate_TEST(data, update)
        expect(Object.keys(response.sequenceStats).length).toBe(3)
        expect(Object.keys(response.variableStats).length).toBe(2)
        const updatedSequenceKeys = update.map(u => `${u.runId}/${u.chainId}/${u.variableName}`)
        const updatedVariableKeys = [...new Set(update.map(u => `${u.runId}/${u.variableName}`))]
        const unupdatedSequenceKey = `${baseSequences[1].runId}/${baseSequences[1].chainId}/${baseSequences[1].variableName}`

        updatedSequenceKeys.map(k => expect(response.sequenceStats[k].isUpToDate).toBeFalsy())
        updatedVariableKeys.map(k => expect(response.variableStats[k].isUpToDate).toBeFalsy())
        expect(response.sequenceStats[unupdatedSequenceKey].isUpToDate).toBeTruthy()
    })
})

describe("Novel sequence addition function", () => {
    let mockGetSeqId
    let data: MCMCMonitorData
    const baseSequences = [{
        runId: "2",
        chainId: "chain1",
        variableName: "var1"
    },
    {
        runId: "1",
        chainId: "chain1",
        variableName: "var1"
    }]
    const baseChainIds = ["chain1", "chain2"]
    const baseVariables = ["var1", "var2"]
    const mockId = () => {
        mockGetSeqId = vi.fn()
        vi.doMock('../../service/src/types/MCMCMonitorTypes', () => {
            return {
                __esModule: true,
                getSequenceIdentifier: mockGetSeqId
            }
        })
    }
    beforeEach(() => {
        data = {
            sequences: baseSequences,
            selectedRunId: "1",
            selectedChainIds: baseChainIds,
            selectedVariableNames: baseVariables
        } as unknown as MCMCMonitorData
    })
    afterEach(() => {
        vi.resetModules()
    })
    test("Short-circuits if no runId is selected", async () => {
        mockId()
        const addNovelSequences = (await import("../../src/MCMCMonitorDataManager/MCMCMonitorData")).addNovelSequences_TEST
        data.selectedRunId = undefined
        addNovelSequences(data)
        expect(mockGetSeqId).toHaveBeenCalledTimes(0)
    })
    test("Short-circuits if no chain IDs are selected", async () => {
        mockId()
        const addNovelSequences = (await import("../../src/MCMCMonitorDataManager/MCMCMonitorData")).addNovelSequences_TEST
        data.selectedChainIds = []
        addNovelSequences(data)
        expect(mockGetSeqId).toHaveBeenCalledTimes(0)
    })
    test("Short-circuits if no variable names are selected", async () => {
        mockId()
        const addNovelSequences = (await import("../../src/MCMCMonitorDataManager/MCMCMonitorData")).addNovelSequences_TEST
        data.selectedVariableNames = []
        addNovelSequences(data)
        expect(mockGetSeqId).toHaveBeenCalledTimes(0)
    })
    test("Throws if chain ID or variable name are repeated in selection", () => {
        data.selectedVariableNames = [...data.selectedVariableNames, "var3", "var3"]
        expect(() => addNovelSequences_TEST(data)).toThrow(/Key collision/)
    })
    test("Adds missing sequences to input object", () => {
        expect(data.selectedChainIds.length).toBe(2)
        expect(data.selectedVariableNames.length).toBe(2)
        expect(data.sequences.length).toBe(2)
        expect(data.sequences.filter(s =>
            s.runId === data.selectedRunId
            && data.selectedChainIds.includes(s.chainId)
            && data.selectedVariableNames.includes(s.variableName))
            .length).toBe(1)
        addNovelSequences_TEST(data)
        expect(data.sequences.length).toBe(5)
    })
})

describe("Data appending function", () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    test("Existing data object is returned when the position begins past the end of the existing data series", () => {
        const oldDataEnd = 4
        const newDataStart = 8
        const oldData = numbers.slice(0, oldDataEnd)
        expect(oldData.length).toBe(oldDataEnd)
        const newData = numbers.slice(newDataStart)
        expect(newData.length).toBe(numbers.length - newDataStart)
        const result = appendData_TEST(oldData, newDataStart, newData)
        expect(result).toBe(oldData)
    })
    test("Existing data object is returned when the incoming data is all known", () => {
        const oldDataEnd = 6
        const newDataStart = 2
        const newDataEnd = 4
        const oldData = numbers.slice(0, oldDataEnd)
        expect(oldData.length).toBe(oldDataEnd)
        const newData = numbers.slice(newDataStart, newDataEnd)
        expect(newData.length).toBe(newDataEnd - newDataStart)
        const result = appendData_TEST(oldData, newDataStart, newData)
        expect(result).toBe(oldData)
    })
    test("New data entries are all appended when the new data starts at the current last position", () => {
        const oldDataEnd = 5
        const newDataLength = 3
        const newDataStart = oldDataEnd
        const newDataEnd = newDataStart + newDataLength
        const oldData = numbers.slice(0, oldDataEnd)
        expect(oldData.length).toBe(oldDataEnd)
        const newData = numbers.slice(newDataStart, newDataEnd)
        expect(newData.length).toBe(newDataLength)
        const result = appendData_TEST(oldData, newDataStart, newData)
        expect(result.length).toBe(newDataEnd)
        expect(result).toEqual(numbers.slice(0, newDataEnd))
    })
    test("When position is before the end of the existing data series, the later new-data entries are appended", () => {
        const oldDataEnd = 5
        const newDataLength = 5
        const newDataStart = oldDataEnd - 2
        const newDataEnd = newDataStart + newDataLength
        const oldData = numbers.slice(0, oldDataEnd)
        expect(oldData.length).toBe(oldDataEnd)
        const newData = numbers.slice(newDataStart, newDataEnd)
        expect(newData.length).toBe(newDataLength)
        const result = appendData_TEST(oldData, newDataStart, newData)
        expect(result.length).toBe(newDataEnd)
        expect(result).toEqual(numbers.slice(0, newDataEnd))
    })
})

describe("Chain update execution function", () => {
    const run_a = "run1"
    const run_b = "run2"
    const chainIds = ["chain1", "chain2", "chain3", "chain4"]
    const newChainId = "chain5"
    const variableNames = ["a", "b"]
    const lastChangeTimestamp = 1000
    const data: MCMCMonitorData = { ...initialMCMCMonitorData }
    let newChains: MCMCChain[] = []
    beforeEach(() => {
        const myChains: MCMCChain[] = chainIds.map(id => {return {runId: run_a, chainId: id, variableNames, lastChangeTimestamp}})
        data.chains = myChains
        newChains = [
            {runId: run_a, chainId: newChainId, variableNames, lastChangeTimestamp, excludedInitialIterationCount: data.effectiveInitialDrawsToExclude - 1 }
        ]
    })

    test("Update preserves chains for other runs", () => {
        data.chains[0].runId = run_b
        expect(data.chains.filter(c => c.runId === run_b).length).toBe(1)
        const newState = doChainUpdate_TEST(data, run_a, newChains)
        expect(newState.chains.length).toBe((data.chains.filter(c => c.runId === run_b).length) + newChains.length)
    })
    test("Includes new chains in the output state", () => {
        expect(data.chains.some(c => c.chainId === newChainId)).toBeFalsy()
        const newState = doChainUpdate_TEST(data, run_a, newChains)
        expect(newState.chains.some(c => c.chainId === newChainId)).toBeTruthy()
        expect(newState.chains.length).toBe(newChains.length)
    })
    test("Sets effective warmup draws per the computation function", () => {
        const newState = doChainUpdate_TEST(data, run_a, newChains)
        expect(newState.effectiveInitialDrawsToExclude).toBe(initialMCMCMonitorData.effectiveInitialDrawsToExclude - 1)
    })
})

describe('Chain update detection function', () => {
    const runId = "0"
    const knownChainIds = ["1", "2"]
    const varNames = ["not used 1", "not used 2"]
    const knownLastChangeTime = 1000
    const oldChains: MCMCChain[] = knownChainIds.map(id => {
        return {
            runId: runId,
            chainId: id,
            variableNames: varNames,
            lastChangeTimestamp: knownLastChangeTime
        }
    })
    test('Returns update when a new chain has an unknown chain ID', () => {
        const newChains: MCMCChain[] = [
            ...oldChains,
            {
                ...oldChains[0],
                chainId: Math.random().toString()
            }
        ]
        expect(chainsWereUpdated_TEST(runId, newChains, oldChains)).toBeTruthy
    })
    test("Returns an update when the new chain's update timestamp is greater than the old one", () => {
        const newChains: MCMCChain[] = [{
            ...oldChains[0],
            lastChangeTimestamp: knownLastChangeTime + 1
        }]
        expect(chainsWereUpdated_TEST(runId, newChains, oldChains)).toBeTruthy
    })
    test("Returns false when all new chains' IDs match old chains', with not-more-recent updates.", () => {
        const newChains = oldChains
        expect(chainsWereUpdated_TEST(runId, newChains, oldChains)).toBeFalsy
    })
})

describe('Effective warmup iteration computation function', () => {
    test("Reflects input value if one exists", () => {
        const c = computeEffectiveWarmupIterations_TEST(initialMCMCMonitorData, 15)
        expect(c).toBe(15)
    })
    test("Checks chains for dynamic value and returns 0 if there isn't one", () => {
        const c = computeEffectiveWarmupIterations_TEST(initialMCMCMonitorData, -1)
        expect(c).toBe(0)
    })
    test("Checks chains for dynamic value and returns if there is one", () => {
        const specifiedValue = 17
        const mockChain: MCMCChain = {
            runId: "0",
            chainId: "",
            variableNames: [""],
            lastChangeTimestamp: 10,
            excludedInitialIterationCount: specifiedValue
        }
        const myData = {...initialMCMCMonitorData, chains: [mockChain] }
        const c = computeEffectiveWarmupIterations_TEST(myData, -1)
        expect(c).toBe(specifiedValue)
    })
})

describe('Stat invalidation function', () => {
    let sequenceStats: SequenceStatsDict
    let variableStats: VariableStatsDict
    const sequenceKeys = ["firstKey", "secondKey"]
    const variableKeys = ['firstVariable', 'secondVariable']

    beforeEach(() => {
        sequenceStats = sequenceKeys.reduce((o, key) => ({...o, [key]: {}}), {})
        variableStats = variableKeys.reduce((o, key) => ({...o, [key]: {}}), {})

        sequenceStats[sequenceKeys[0]] = {
            mean: 15,
            isUpToDate: true
        }
        sequenceStats[sequenceKeys[1]] = {
            ess: 10,
            isUpToDate: true
        }
        variableStats[variableKeys[0]] = {
            count: 10,
            isUpToDate: true
        }
        variableStats[variableKeys[1]] = {
            rhat: 15,
            isUpToDate: true
        }
    })
    test("Sets all stats to stale when no key is given", () => {
        invalidateStats_TEST(sequenceStats)
        invalidateStats_TEST(variableStats)
        expect(Object.values(sequenceStats).some(s => s.isUpToDate)).toBeFalsy()
        expect(Object.values(variableStats).some(s => s.isUpToDate)).toBeFalsy()
    })
    test("Sets only matching stat to stale when a key is given", () => {
        invalidateStats_TEST(sequenceStats, sequenceKeys[1])
        invalidateStats_TEST(variableStats, variableKeys[0])
        expect(sequenceStats[sequenceKeys[0]].isUpToDate).toBeTruthy()
        expect(sequenceStats[sequenceKeys[1]].isUpToDate).toBeFalsy()
        expect(variableStats[variableKeys[0]].isUpToDate).toBeFalsy()
        expect(variableStats[variableKeys[1]].isUpToDate).toBeTruthy()
    })
    test("Does nothing when requested key is not found", () => {
        const badkey = "DEFINED_BUT_NOT_PRESENT_KEY"
        expect(Object.keys(sequenceStats).includes(badkey)).toBeFalsy()
        expect(Object.keys(variableStats).includes(badkey)).toBeFalsy()
        invalidateStats_TEST(sequenceStats, badkey)
        invalidateStats_TEST(variableStats, badkey)
        expect(Object.values(sequenceStats).every(s => s.isUpToDate)).toBeTruthy()
        expect(Object.values(variableStats).every(s => s.isUpToDate)).toBeTruthy()
    })
})
