import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

describe("Stan-playground chain fetching function", () => {
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
        const sut = (await import("../../src/spaInterface/getSpaChainsForRun")).default
        await sut(emptyRunId)
        expect(mockUpdateSpaOutputForRun).toHaveBeenCalledOnce()
    })
    test("Returns empty on cache miss", async () => {
        // TODO: Verify console warning?
        const sut = (await import('../../src/spaInterface/getSpaChainsForRun')).default
        const result = await sut(nonexistentRunId)
        expect(result.length).toBe(0)
    })
    test("Returns an MCMCChain for each chain in the fetched stan-playground output", async () => {
        const sut = (await import('../../src/spaInterface/getSpaChainsForRun')).default
        const result = await sut(selectedRunId)
        expect(result.length).toBe(goodChains.length)
        const keys = result.map(r => r.chainId)
        expect(keys.includes('chain1')).toBeTruthy()
        expect(keys.includes('chain2')).toBeTruthy()
        expect(keys.includes('chain3')).toBeFalsy()
        expect(result[0].excludedInitialIterationCount).toBe(10)
        expect(result[1].excludedInitialIterationCount).toBe(0)
    })
})
