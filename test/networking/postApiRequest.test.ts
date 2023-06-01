import { afterEach, describe, expect, test, vi } from 'vitest'
import { MCMCMonitorRequest, isMCMCMonitorResponse } from '../../service/src/types'
import WebrtcConnectionToService from '../../src/networking/WebrtcConnectionToService'


describe("Post API Request function", () => {
    const myBaseUrl = "http://mockbase.url"
    const myRequest: MCMCMonitorRequest = {
        type: "probeRequest"
    }
    const myFormattedRequest = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(myRequest)
    }
    const mySignalingRequest: MCMCMonitorRequest = {
        type: "webrtcSignalingRequest",
        clientId: "ignored"
    }
    const myNonProbeRequest: MCMCMonitorRequest = {
        type: "getChainsForRunRequest",
        runId: "Ignored"
    }
    const goodResponse = {
        type: 'probeResponse',
        protocolVersion: "any string"
    }
    const badResponse = {
        type: "Not a valid response"
    }
    const fetchFactory = (wantGoodResponse = true) => {
        return () => Promise.resolve({
            json: () => Promise.resolve(wantGoodResponse ? goodResponse : badResponse)
        } as unknown as Response)
    }
    const webrtcMockResponse = "foo"
    const mockWebrtcPostApiRequest = vi.fn()

    afterEach(() => {
        vi.resetModules()
    })

    type mockConfigProps = {
        useWebrtc?: boolean,
        useUndefinedWebrtcConnection?: boolean,
        useStanPlaygroundMode?: boolean,
        useEmptyServiceBaseUrl?: boolean
    }

    const mockConfig = (props: mockConfigProps) => {
        const { useWebrtc, useUndefinedWebrtcConnection, useStanPlaygroundMode, useEmptyServiceBaseUrl } = props
        mockWebrtcPostApiRequest.mockReturnValue(webrtcMockResponse)
        const rtcCnxn = useWebrtc
            ? useUndefinedWebrtcConnection
                ? undefined
                : {
                    postApiRequest: mockWebrtcPostApiRequest,
                    status: 'connected'
                } as unknown as WebrtcConnectionToService
            : undefined
        vi.doMock('../../src/config', () => {
            return {
                __esModule: true,
                serviceBaseUrl: useEmptyServiceBaseUrl ? undefined : myBaseUrl,
                spaMode: useStanPlaygroundMode,
                useWebrtc,
                webrtcConnectionToService: rtcCnxn
            }
        })
    }

    // mockDetectedIterationCount.mockReturnValueOnce(specifiedValue).mockReturnValueOnce(undefined)
    const importFunctionUnderTest = async () => (await import("../../src/networking/postApiRequest")).default

    test("postApiRequest returns a response from the configured API endpoint", async () => {
        const myFetch = vi.fn(fetchFactory())
        global.fetch = myFetch
        mockConfig({})
        const postApiRequest = await importFunctionUnderTest()
        const resp = await postApiRequest(myRequest)
        expect(myFetch).toHaveBeenCalledTimes(1)
        expect(myFetch).not.toHaveBeenCalledWith(`${myBaseUrl}/bad_endpoint`, myFormattedRequest)
        expect(myFetch).toHaveBeenCalledWith(`${myBaseUrl}/api`, myFormattedRequest)
        expect(isMCMCMonitorResponse(resp)).toBeTruthy()
    })

    test("postApiRequest falls back to http if web rtc is configured but not in connected status", async () => {
        const myFetch = vi.fn(fetchFactory())
        global.fetch = myFetch
        const rtcCnxn = {
            postApiRequest: mockWebrtcPostApiRequest,
            status: 'pending'
        } as unknown as WebrtcConnectionToService
        vi.doMock('../../src/config', () => {
            return {
                __esModule: true,
                serviceBaseUrl: myBaseUrl,
                spaMode: false,
                useWebrtc: true,
                webrtcConnectionToService: rtcCnxn
            }
        })
        const postApiRequest = await importFunctionUnderTest()
        await postApiRequest(myNonProbeRequest)
        expect(mockWebrtcPostApiRequest).toHaveBeenCalledTimes(0)
        expect(myFetch).toHaveBeenCalledOnce()
    })

    test("postApiRequest uses web rtc if configured and connected", async () => {
        mockConfig({useWebrtc: true})
        const postApiRequest = await importFunctionUnderTest()
        const nonProbeResponse = await postApiRequest(myNonProbeRequest)
        expect(mockWebrtcPostApiRequest).toHaveBeenCalledTimes(1)
        expect(nonProbeResponse).toBe(webrtcMockResponse)
    })

    test("postApiRequest webrtc falls back to http if service connection is invalid", async () => {
        const myFetch = vi.fn(fetchFactory())
        global.fetch = myFetch
        mockConfig({useWebrtc: true, useUndefinedWebrtcConnection: true})
        const postApiRequest = await importFunctionUnderTest()
        const resp = await postApiRequest(myNonProbeRequest)
        expect(myFetch).toHaveBeenCalledOnce()
        expect(isMCMCMonitorResponse(resp)).toBeTruthy()
    })

    test("postApiRequest with webrtc uses non-webrtc for probe or signaling request", async () => {
        const myFetch = vi.fn(fetchFactory())
        global.fetch = myFetch
        mockConfig({useWebrtc: true})
        const postApiRequest = await importFunctionUnderTest()
        const resp = await postApiRequest(mySignalingRequest)
        expect(mockWebrtcPostApiRequest).not.lastCalledWith(mySignalingRequest)
        expect(isMCMCMonitorResponse(resp)).toBeTruthy()
    })

    test("postApiRequest throws on stan-playground mode", async () => {
        mockConfig({useStanPlaygroundMode: true})
        const postApiRequest = await importFunctionUnderTest()
        expect(() => postApiRequest(myRequest)).rejects.toThrow(/spa mode/)
    })

    test("postApiRequest throws on undefined service base url", async () => {
        mockConfig({useEmptyServiceBaseUrl: true})
        const postApiRequest = await importFunctionUnderTest()
        expect(() => postApiRequest(myRequest)).rejects.toThrow(/not set/)
    })

    test("postApiRequest throws error on invalid responses", async () => {
        global.fetch = vi.fn(fetchFactory(false))
        const myMockedWarn = vi.fn()
        vi.spyOn(console, 'warn').mockImplementation(myMockedWarn)

        // module mocking has to happen BEFORE your function-under-test is imported.
        mockConfig({})
        const postApiRequest = await importFunctionUnderTest()

        await expect(() => postApiRequest(myRequest)).rejects.toThrowError(TypeError)
        expect(myMockedWarn).toHaveBeenCalledTimes(1)
        vi.spyOn(console, 'warn').mockRestore()
    })
})
