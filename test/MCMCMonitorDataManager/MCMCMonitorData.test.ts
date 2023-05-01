import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MCMCChain, MCMCSequence } from '../../service/src/types'
import { MCMCSequenceUpdate } from '../../service/src/types/MCMCMonitorRequest'
import { addNovelSequences_TEST, appendData_TEST, chainsWereUpdated_TEST, computeEffectiveWarmupIterations_TEST, detectedWarmupIterationCount, doChainUpdate_TEST, doSequenceUpdate_TEST, initialMCMCMonitorData, invalidateStats_TEST } from '../../src/MCMCMonitorDataManager/MCMCMonitorData'
import { MCMCMonitorData, SequenceStats, SequenceStatsDict, VariableStats, VariableStatsDict } from '../../src/MCMCMonitorDataManager/MCMCMonitorDataTypes'



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
        expect(chainsWereUpdated_TEST(newChains, oldChains)).toBeTruthy
    })
    test("Returns an update when the new chain's update timestamp is greater than the old one", () => {
        const newChains: MCMCChain[] = [{
            ...oldChains[0],
            lastChangeTimestamp: knownLastChangeTime + 1
        }]
        expect(chainsWereUpdated_TEST(newChains, oldChains)).toBeTruthy
    })
    test("Returns false when all new chains' IDs match old chains', with not-more-recent updates.", () => {
        const newChains = oldChains
        expect(chainsWereUpdated_TEST(newChains, oldChains)).toBeFalsy
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
