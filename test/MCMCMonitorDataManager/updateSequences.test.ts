import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { GetSequencesResponse, MCMCMonitorRequest, MCMCMonitorResponse, MCMCSequence, MCMCSequenceUpdate, isGetSequencesRequest } from '../../service/src/types'
import { MCMCMonitorAction, MCMCMonitorData } from '../../src/MCMCMonitorDataManager/MCMCMonitorDataTypes'

type apiEndpoint = (request: MCMCMonitorRequest) => Promise<MCMCMonitorResponse>
type dispatcher = (a: MCMCMonitorAction) => void
type spaSequenceUpdates = (runId: string, sequences: MCMCSequence[]) => Promise<MCMCSequenceUpdate[] | undefined>

type mockSequence = {
    runId: string,
    chainId: string,
    variableName: string,
    wantsUpdate: boolean,
    startPosition: number
}

const makeMockSequence = (p: mockSequence): MCMCSequence => {
    return { runId: p.runId, chainId: p.chainId, variableName: p.variableName, updateRequested: p.wantsUpdate, data: [1, 2, 3, 4, 5] }
}

const makeMockSequenceResponse = (p: mockSequence): MCMCSequenceUpdate | undefined => {
    if (!p.wantsUpdate) return
    return { runId: p.runId, chainId: p.chainId, variableName: p.variableName, position: p.startPosition, data: [6, 7, 8, 9] }
}

const sequenceFeedData = [
    {
        runId: "run1",
        chainId: "chain1",
        variableName: "var1",
        wantsUpdate: true,
        startPosition: 5
    },
    {
        runId: "run1",
        chainId: "chain2",
        variableName: "var1",
        wantsUpdate: true,
        startPosition: 5
    },
    {
        runId: "run1",
        chainId: "chain1",
        variableName: "var2",
        wantsUpdate: false,
        startPosition: 5
    },
]

describe("Sequence update request function", () => {
    let mockPostApiRequestFn: Mock
    let mockDispatchBase: Mock
    let mockDispatch: dispatcher
    let mockData: MCMCMonitorData
    let mockResponse: GetSequencesResponse
    let mockGetSpaSequenceUpdates: Mock
    
    beforeEach(() => {
        mockDispatchBase = vi.fn()
        mockDispatch = mockDispatchBase as unknown as dispatcher
        mockData = {
            sequences: sequenceFeedData.map(a => makeMockSequence(a))
        } as MCMCMonitorData
        mockResponse = {
            type: "getSequencesResponse",
            sequences: sequenceFeedData.map(x => makeMockSequenceResponse(x)).filter(s => s !== undefined)
        } as unknown as GetSequencesResponse

        mockPostApiRequestFn = vi.fn()
        vi.doMock('../../src/networking/postApiRequest', () => {
            return {
                __esModule: true,
                default: mockPostApiRequestFn as unknown as apiEndpoint
            }
        })

        mockGetSpaSequenceUpdates = vi.fn()
        vi.doMock('../../src/spaInterface/getSpaSequenceUpdates', () => {
            return {
                __esModule: true,
                default: mockGetSpaSequenceUpdates as unknown as spaSequenceUpdates
            }
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
        vi.resetAllMocks()
        vi.resetModules()
    })

    test("Does nothing if no sequences request updates", async () => {
        const local_updateSequences = (await import("../../src/MCMCMonitorDataManager/updateSequences")).default
        const data: MCMCMonitorData = {
            sequences: [
                { updateRequested: false }, { updateRequested: false }, { updateRequested: false }
            ]
        } as unknown as MCMCMonitorData
        const result = await local_updateSequences(data, mockDispatch)
        expect(result).toBeUndefined()
        expect(mockDispatch).toHaveBeenCalledTimes(0)
    })
    test("Hits API endpoint to request updates to sequences needing update", async () => {
        const local_updateSequences = (await import("../../src/MCMCMonitorDataManager/updateSequences")).default
        mockPostApiRequestFn.mockResolvedValue(mockResponse)
        await local_updateSequences(mockData, mockDispatch)
        expect(mockPostApiRequestFn).toBeCalledTimes(1)
        const call = mockPostApiRequestFn.mock.lastCall[0]
        if (!isGetSequencesRequest(call)) return // should always be true--here just for type narrowing
        expect(call.sequences.length).toBe(sequenceFeedData.filter(s => s.wantsUpdate).length)
    })
    test("Throws error on mix of stan-playground and non-stan-playground runs", async () => {
        const mockIsSpaRunId = vi.fn().mockReturnValueOnce(true).mockReturnValue(false)
        vi.doMock('../../src/spaInterface/util', () => {
            return {
                __esModule: true,
                isSpaRunId: mockIsSpaRunId
            }
        })
        const local_updateSequences = (await import("../../src/MCMCMonitorDataManager/updateSequences")).default
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        // Todo: catch and assert on warning? issues with async
        expect(() => local_updateSequences(mockData, mockDispatch)).rejects.toThrow(/Cannot mix/)
        vi.spyOn(console, 'warn').mockRestore()
    })
    test("Uses stan-playground sequence update fn for stan-playground runs", async () => {
        const mockIsSpaRunId = vi.fn().mockReturnValue(true)
        vi.doMock('../../src/spaInterface/util', () => {
            return {
                __esModule: true,
                isSpaRunId: mockIsSpaRunId
            }
        })
        const local_updateSequences = (await import("../../src/MCMCMonitorDataManager/updateSequences")).default
        mockGetSpaSequenceUpdates.mockResolvedValue([])
        await local_updateSequences(mockData, mockDispatch)
        expect(mockGetSpaSequenceUpdates).toHaveBeenCalledOnce()
        expect(mockDispatch).toHaveBeenCalledTimes(0)
    })
    test("Throws error on unexpected API request", async () => {
        mockPostApiRequestFn.mockResolvedValue({type: "Not a valid response"})
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        expect(spy.getMockName()).toEqual('warn')
        const local_updateSequences = (await import("../../src/MCMCMonitorDataManager/updateSequences")).default
        expect(() => local_updateSequences(mockData, mockDispatch)).rejects.toThrow(/Unexpected getSequences response/)
        // Note: attempt to assert that console.warn was called fails because of async issues. Might look into that later.
        vi.spyOn(console, 'warn').mockRestore()
    })
    test("Dispatches update event with API response payload", async () => {
        const local_updateSequences = (await import("../../src/MCMCMonitorDataManager/updateSequences")).default
        mockPostApiRequestFn.mockResolvedValue(mockResponse)
        await local_updateSequences(mockData, mockDispatch)
        expect(mockDispatch).toHaveBeenCalledOnce()
        const call = mockDispatchBase.mock.lastCall[0]
        expect(call.type).toBe("updateSequenceData")
        expect(call.sequences).toBe(mockResponse.sequences)
    })
})
