import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

describe("Stan-playground data interaction function", () => {
    const myUrl = 'https://mock.url'
    const mockResponse = JSON.stringify({ id: 1, value: 'result' })
    let mockFetch: Mock
    let originalFetch

    beforeEach(() => {
        originalFetch = global.fetch
        mockFetch = vi.fn().mockResolvedValue({ json: () => mockResponse })
        global.fetch = mockFetch

        vi.doMock('../../src/config', () => {
            return {
                __esModule: true,
                stanPlaygroundUrl: myUrl
            }
        })
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.resetModules()
        global.fetch = originalFetch
    })

    test("Fetches from configured URL", async () => {
        const sut = (await import('../../src/spaInterface/postStanPlaygroundRequest')).default
        const req = { data: 'original' }
        const result = await sut(req)

        expect(mockFetch).toHaveBeenCalledOnce()
        expect(result).toEqual(mockResponse)

        const call = mockFetch.mock.lastCall
        const calledUrl = call[0]
        const calledObj = call[1]
        expect(calledUrl).toEqual(myUrl)
        expect(calledObj.method).toEqual('POST')
        expect(calledObj.body).toEqual(JSON.stringify({payload: req}))
    })
})