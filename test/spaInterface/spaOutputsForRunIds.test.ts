import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { SpaOutput } from '../../src/spaInterface/spaOutputsForRunIds'

describe("stan-playground data fetch-and-cache function", () => {
    const projectId = 'myProjectId'
    const fileName = 'myFileName'
    const myRunId = 'spa|whatever|whatever'
    const knownHash = 'foo'
    const mockParseSpaRunId = vi.fn()
    let mockPostStanPlaygroundRequest: Mock
    const myNow = new Date(2020, 3, 15, 11, 55, 20, 192) // Set date to 11:55:20.192 (AM) on April 15 2020
    const mockGetProjectFileResponse = {
        type: 'getProjectFile',
        projectFile: {
            contentSha1: knownHash,
            workspaceId: 'bar'
        }
    }
    const mockGetDataBlobResponse = {
        type: 'getDataBlob',
        content: JSON.stringify({
            chains: [{
                chainId: 'chain1',
                rawHeader: 'head',
                rawFooter: 'foot',
                sequences: { a: [1, 2, 3] }
            }]
        })
    }

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(myNow)

        mockParseSpaRunId.mockReturnValue({ projectId, fileName })
        mockPostStanPlaygroundRequest = vi.fn()
        vi.doMock('../../src/spaInterface/postStanPlaygroundRequest', () => {
            return {
                __esModule: true,
                default: mockPostStanPlaygroundRequest
            }
        })
        vi.doMock('../../src/spaInterface/util', () => {
            return {
                __esModule: true,
                parseSpaRunId: mockParseSpaRunId
            }
        })
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.resetModules()
        vi.useRealTimers()
    })

    test("Requests the right project file", async () => {
        mockPostStanPlaygroundRequest.mockResolvedValueOnce(mockGetProjectFileResponse).mockResolvedValueOnce(mockGetDataBlobResponse)
        const sut = (await import('../../src/spaInterface/spaOutputsForRunIds')).updateSpaOutputForRun
        await sut(myRunId)

        expect(mockParseSpaRunId).toHaveBeenCalledOnce()
        expect(mockParseSpaRunId.mock.lastCall[0]).toBe(myRunId)
        expect(mockPostStanPlaygroundRequest).toBeCalledTimes(2)
        const getProjectReq = mockPostStanPlaygroundRequest.mock.calls[0][0]
        expect(getProjectReq.projectId).toBe(projectId)
        expect(getProjectReq.fileName).toBe(fileName)
        expect(getProjectReq.timestamp).toBe(myNow.valueOf()/1000)
    })

    test("returns early if retrieved data matches cache hash", async () => {
        mockPostStanPlaygroundRequest.mockResolvedValueOnce(mockGetProjectFileResponse).mockResolvedValueOnce(mockGetDataBlobResponse)
        const imports = await import('../../src/spaInterface/spaOutputsForRunIds')
        const cache = imports.spaOutputsForRunIds
        cache[myRunId] = { sha1: knownHash, spaOutput: {} as unknown as SpaOutput }
        const sut = imports.updateSpaOutputForRun
        await sut(myRunId)

        expect(mockPostStanPlaygroundRequest).toHaveBeenCalledOnce()
    })

    test("Replaces cache with retrieved file", async () => {
        mockPostStanPlaygroundRequest.mockResolvedValueOnce(mockGetProjectFileResponse).mockResolvedValueOnce(mockGetDataBlobResponse)
        const untouchedData = { chains: [{ chainId: 'untouched-data' }] } as unknown as SpaOutput
        const otherRunId = myRunId + 'not-match'

        const imports = await import('../../src/spaInterface/spaOutputsForRunIds')
        const cache = imports.spaOutputsForRunIds
        // Seed cache with data to be replaced and data that shouldn't be touched by update
        cache[myRunId] = { sha1: knownHash + 'not-match', spaOutput: { chains: [{ chainId: 'old-data' }] } as unknown as SpaOutput }
        cache[otherRunId] = { sha1: knownHash, spaOutput: untouchedData }

        const sut = imports.updateSpaOutputForRun
        await sut(myRunId)

        // assert data for this run ID should be replaced
        const matchedData = cache[myRunId]
        expect(matchedData).toBeDefined()
        expect(matchedData.sha1).toEqual(knownHash)
        expect(matchedData.spaOutput).toEqual(JSON.parse(mockGetDataBlobResponse.content))
        // and unrelated data should be untouched
        expect(cache[otherRunId]).toEqual({ sha1: knownHash, spaOutput: untouchedData })
    })

    test("Throws on non-project-file response to first request", async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockPostStanPlaygroundRequest.mockResolvedValueOnce({type: 'not-project-file'})
        const sut = (await import('../../src/spaInterface/spaOutputsForRunIds')).updateSpaOutputForRun
        expect(() => sut(myRunId)).rejects.toThrow(/project file/)
        vi.spyOn(console, 'warn').mockRestore()
    })

    test("Throws on non-data-blob response to second request", async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockPostStanPlaygroundRequest.mockResolvedValueOnce(mockGetProjectFileResponse).mockResolvedValueOnce({type: 'not-data-blob'})
        const sut = (await import('../../src/spaInterface/spaOutputsForRunIds')).updateSpaOutputForRun
        expect(() => sut(myRunId)).rejects.toThrow(/dataset/)
        vi.spyOn(console, 'warn').mockRestore()
    })
})
