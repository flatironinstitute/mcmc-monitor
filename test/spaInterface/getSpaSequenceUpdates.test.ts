import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MCMCSequence } from '../../service/src/types'

describe("Stan-playground sequence update fetching function", () => {
    const selectedRunId = 'spa|prog1|file1'
    const nonSelectedRunId = 'spa|prog1|file2'
    const emptyRunId = 'spa|prog2|file1'
    const nonexistentRunId = 'not-valid'
    const mockSpaOutputsForRunIds = {}
    const goodChains = [
        {
            chainId: 'chain1',
            rawHeader: 'header',
            rawFooter: 'footer',
            numWarmupDraws: 10,
            sequences: {
                a: [1, 2, 3],
                b: [2, 3, 4]
            }
        }, {
            chainId: 'chain2',
            rawHeader: 'header',
            rawFooter: 'footer',
            sequences: {
                a: [6, 7, 8],
                b: [8, 9, 10]
            }
        }
    ]
    const notUsedChain = [{ chainId: 'chain3', rawHeader: '', rawFooter: '', sequences: {c: [4, 3, 2]} }]
    mockSpaOutputsForRunIds[selectedRunId] = {
        sha1: 'abc',
        spaOutput: { chains: goodChains }
    }
    mockSpaOutputsForRunIds[nonSelectedRunId] = {
        sha1: 'def',
        spaOutput: { chains: notUsedChain }
    }
    mockSpaOutputsForRunIds[emptyRunId] = {
        sha1: 'bar',
        spaOutput: { chains: [] }
    }
    let mockUpdateSpaOutputForRun: Mock

    beforeEach(() => {
        mockUpdateSpaOutputForRun = vi.fn()

        vi.doMock('../../src/spaInterface/spaOutputsForRunIds', () => {
            return {
                __esModule: true,
                spaOutputsForRunIds: mockSpaOutputsForRunIds,
                updateSpaOutputForRun: mockUpdateSpaOutputForRun
            }
        })
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.resetModules()
    })

    test("Updates the requested run id", async () => {
        const sut = (await import('../../src/spaInterface/getSpaSequenceUpdates')).default
        await sut(emptyRunId, [])
        expect(mockUpdateSpaOutputForRun).toHaveBeenCalledOnce()
    })
    test("Returns empty list on cache miss", async () => {
        // TODO: Verify console warning?
        const sut = (await import('../../src/spaInterface/getSpaSequenceUpdates')).default
        const result = await sut(nonexistentRunId, [])
        expect(result).toBeDefined()
        expect((result || []).length).toBe(0)
    })
    test("Returns an MCMCSequenceUpdate for each returned sequence", async () => {
        const searchedSequences = [
            {chainId: 'chain1', variableName: 'a', data: [1, 2]},
            {chainId: 'chain2', variableName: 'b', data: [8, 9]},
            {chainId: 'chain1', variableName: 'x', data: [1]} // should return nothing since variable name doesn't match
        ] as unknown as MCMCSequence[]
        const hits = searchedSequences.map(s => goodChains.find(c => c.chainId === s.chainId)?.sequences[s.variableName] ?? [])
        expect(hits.length).toBe(searchedSequences.length)

        const sut = (await import('../../src/spaInterface/getSpaSequenceUpdates')).default
        const result = await sut(selectedRunId, searchedSequences)
        expect(result).toBeDefined()
        expect((result || []).length).toEqual(hits.length)
        // TODO: Consider interrogating this more--or let integration tests pick it up?
    })
})