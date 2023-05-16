import SimplePeer from 'simple-peer'
import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MCMCMonitorRequest, MCMCMonitorResponse, ProbeRequest } from '../../service/src/types'

type apiEndpoint = (request: MCMCMonitorRequest) => Promise<MCMCMonitorResponse>


class MockWorkingPeer {
    signalCallbacks: any[]
    connectCallbacks: any[]
    dataCallbacks: any[]
    initiator
    send
    constructor(initiator: boolean) {
        this.initiator = initiator
        this.signalCallbacks = []
        this.connectCallbacks = []
        this.dataCallbacks = []
        this.send = vi.fn()
    }
    on(type: string, cb: any) {
        switch(type) {
            case 'signal':
                this.signalCallbacks.push(cb)
                break
            case 'connect':
                this.connectCallbacks.push(cb)
                break
            case 'data':
                this.dataCallbacks.push(cb)
                break
            default:
                throw Error(`Bad cb stack in mock simple peer: ${type}`)
        }
    }
    signal(s: any) {
        this.signalCallbacks.forEach(cb => cb(s))
    }
    connect() {
        this.connectCallbacks.forEach(cb => cb())
    }
    data(d: any) {
        this.dataCallbacks.forEach(cb => cb(d))
    }
}


describe("web rtc signal transmission function", () => {
    const clientId = "my-client-id"
    let mockPeer: { signal: Mock<any, any> }
    let mockPostApiRequest: Mock

    beforeEach(() => {
        mockPeer = { signal: vi.fn() }
        mockPostApiRequest = vi.fn()
        vi.doMock('../../src/networking/postApiRequest', () => {
            return {
                __esModule: true,
                default: mockPostApiRequest as unknown as apiEndpoint
            }
        })
    })
    afterEach(() => {
        vi.restoreAllMocks()
        vi.resetModules()
    })
    test("Sends appropriately constituted request", async () => {
        mockPostApiRequest.mockResolvedValue({ type: 'webrtcSignalingResponse', signals: [] })
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).sendWebrtcSignal
        await sut(clientId, mockPeer as any as SimplePeer.Instance, undefined)
        expect(mockPostApiRequest).toHaveBeenCalledOnce()
        const req = mockPostApiRequest.mock.lastCall[0]
        expect(req.type).toBe("webrtcSignalingRequest")
        expect(req.clientId).toBe(clientId)
        expect(req.signal).toBeUndefined()

        const myData = { "data": "value" }
        await sut(clientId, mockPeer as unknown as SimplePeer.Instance, myData as unknown as SimplePeer.SignalData)
        expect(mockPostApiRequest).toHaveBeenCalledTimes(2)
        const req2 = mockPostApiRequest.mock.lastCall[0]
        expect(req2.type).toBe("webrtcSignalingRequest")
        expect(req2.clientId).toBe(clientId)
        expect(req2.signal).toEqual(JSON.stringify(myData))
    })
    test("Throws on non-webrtcSignalingResponse response", async () => {
        mockPostApiRequest.mockResolvedValue({type: 'Surprise!'})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).sendWebrtcSignal
        expect(() => sut(clientId, mockPeer as any as SimplePeer.Instance, undefined)).rejects.toThrow(/Unexpected webrtc signaling response/)
    })
    test("Calls peer signal method on received response signals", async () => {
        const signals = ['signal 1', 'signal 2']
        mockPostApiRequest.mockResolvedValue({type: 'webrtcSignalingResponse', signals})
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).sendWebrtcSignal
        await sut(clientId, mockPeer as any as SimplePeer.Instance, undefined)
        expect(mockPeer.signal).toHaveBeenCalledTimes(2)
        mockPeer.signal.mock.calls.forEach((c, i) => expect(c[0]).toEqual(signals[i]))
    })
})


describe("WebrtcConnectionToService peer configuration", () => {
    let mockPostApiRequest: Mock
    let mockPeer: MockWorkingPeer

    beforeEach(() => {
        mockPeer = new MockWorkingPeer(true)
        mockPostApiRequest = vi.fn()
        vi.doMock('../../src/networking/postApiRequest', () => {
            return {
                __esModule: true,
                default: mockPostApiRequest as unknown as apiEndpoint
            }
        })
    })
    afterEach(() => {
        vi.resetAllMocks()
        vi.resetModules()
    })

    test("Peer configuration warns on undefined peer", async () => {
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        const cnxn = new sut(undefined as unknown as SimplePeer.Instance)
        const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        cnxn.configurePeer()
        expect(mockWarn).toBeCalledTimes(1)
        vi.spyOn(console, 'warn').mockRestore()
    })
    test("Instantiated peer responds to signal event", async () => {
        const mySignal = {s: 'mySignal'}
        mockPostApiRequest.mockResolvedValue({type: 'webrtcSignalingResponse', signals: []})
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        new sut(mockPeer as unknown as SimplePeer.Instance).configurePeer()
        mockPeer.signal(mySignal)
        expect(mockPostApiRequest).toHaveBeenCalledOnce()
        const req = mockPostApiRequest.mock.lastCall[0]
        expect(req.signal).toEqual(JSON.stringify(mySignal))
    })
    test("Instantiated peer handles connect event", async () => {
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        const cnxn = new sut(mockPeer as unknown as SimplePeer.Instance).configurePeer()
        const mockInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
        mockPeer.connect()
        expect(cnxn?.status).toEqual('connected')
        expect(mockInfo).toBeCalledTimes(1)
        vi.spyOn(console, 'info').mockRestore()
    })
    test("Instantiated peer calls and deletes ID-matched callback on data response", async () => {
        const requestId = 'abcde'
        const mockCallback = vi.fn()
        const callbacks: {[requestId: string]: (response: MCMCMonitorResponse) => void} = {}
        callbacks[requestId] = (mockCallback)
        const myResponse = { type: 'probeResponse', protocolVersion: 'v1.0' }
        const myPeerResponse = { type: 'mcmcMonitorPeerResponse', response: myResponse, requestId}

        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        new sut(mockPeer as unknown as SimplePeer.Instance, callbacks).configurePeer()

        expect(callbacks[requestId]).not.toBeUndefined()
        mockPeer.data(JSON.stringify(myPeerResponse))
        expect(callbacks[requestId]).toBeUndefined()
        expect(mockCallback).toHaveBeenCalledOnce()
        const call = mockCallback.mock.lastCall[0]
        expect(call).toEqual(myResponse)
    })
    test("Instantiated peer throws on bad data event response", async () => {
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        new sut(mockPeer as unknown as SimplePeer.Instance).configurePeer()

        const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        expect(() => mockPeer.data(JSON.stringify({type: 'Surprise!'}))).toThrow(/Unexpected peer response/)
        expect(mockWarn).toHaveBeenCalledOnce()
        vi.spyOn(console, 'warn').mockRestore()
    })
    test("Instantiated peer warns on peer data response with no matching ID", async () => {
        const callbacks: {[requestId: string]: (response: MCMCMonitorResponse) => void} = {}
        const myResponse = { type: 'probeResponse', protocolVersion: 'v1.0' }
        const myPeerResponse = { type: 'mcmcMonitorPeerResponse', response: myResponse, requestId: 'surprise!'}
        const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        new sut(mockPeer as unknown as SimplePeer.Instance, callbacks).configurePeer()

        mockPeer.data(JSON.stringify(myPeerResponse))
        expect(mockWarn).toHaveBeenCalledOnce()
        vi.spyOn(console, 'warn').mockRestore()
    })
})

describe("WebrtcConnectionToService peer connection", () => {
    let mockPostApiRequest: Mock
    let mockPeer

    beforeEach(() => {
        mockPeer = { signal: vi.fn() }
        mockPostApiRequest = vi.fn()
        vi.doMock('../../src/networking/postApiRequest', () => {
            return {
                __esModule: true,
                default: mockPostApiRequest as unknown as apiEndpoint
            }
        })
    })
    afterEach(() => {
        vi.restoreAllMocks()
        vi.resetModules()
    })

    test("Connecting warns if peer is undefined", async () => {
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        const cnxn = new sut(undefined as unknown as SimplePeer.Instance)
        
        const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        expect(cnxn.status).toEqual('pending')
        cnxn.connect()
        expect(spyWarn).toHaveBeenCalledOnce()
        vi.spyOn(console, 'warn').mockRestore()
    })
    test("Connection object times out after 15 seconds", async () => {
        const now = Date.now()
        const mockDate = vi.spyOn(Date, 'now')
        const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        
        const mockImport = (await import('../../src/networking/WebrtcConnectionToService'))
        const sut = mockImport.default
        mockDate.mockReturnValueOnce(now).mockReturnValueOnce(now + 1 + mockImport.WEBRTC_CONNECTION_TIMEOUT_INTERVAL_MS)
        const cnxn = new sut(mockPeer as unknown as SimplePeer.Instance)
        
        expect(cnxn.status).toBe('pending')
        cnxn.connect()
        expect(cnxn.status).toBe('error')
        expect(mockWarn).toHaveBeenCalledOnce()
        expect(mockDate).toHaveBeenCalledTimes(2)

        vi.spyOn(console, 'warn').mockRestore()
        vi.spyOn(Date, 'now').mockRestore()
    })
    test("Connection resignals on pending status", async () => {
        vi.useFakeTimers()
        mockPostApiRequest.mockReturnValue({type: "webrtcSignalingResponse", signals: []})
        const mockImport = (await import('../../src/networking/WebrtcConnectionToService'))
        const sut = mockImport.default
        const cnxn = new sut(mockPeer as unknown as SimplePeer.Instance)
        
        expect(cnxn.status).toBe('pending')
        const spy = vi.spyOn(cnxn, "connect")
        cnxn.connect()
        vi.advanceTimersToNextTimer()
        expect(spy).toHaveBeenCalledTimes(2)

        vi.useRealTimers()
    })
})

describe("GUI web rtc connection post api request", () => {
    let mockPostApiRequest: Mock
    let mockPeer

    beforeEach(() => {
        // vi.useRealTimers()
        mockPeer = new MockWorkingPeer(true)
        mockPostApiRequest = vi.fn()
        vi.doMock('../../src/networking/postApiRequest', () => {
            return {
                __esModule: true,
                default: mockPostApiRequest as unknown as apiEndpoint
            }
        })
    })
    afterEach(() => {
        vi.resetAllMocks()
        vi.resetModules()
        vi.useRealTimers()
    })

    const mockRequest = { type: 'probeRequest' } as any as ProbeRequest

    test("Throws if no known peer", async () => {
        const imported = (await import('../../src/networking/WebrtcConnectionToService'))
        const cnxn = new imported.default(undefined as any)
        expect(() => cnxn.postApiRequest(mockRequest)).rejects.toThrow(/No peer/)
    })
    test("Throws if connection is in error status", async () => {
        const imported = (await import('../../src/networking/WebrtcConnectionToService'))
        const cnxn = new imported.default(mockPeer)
        expect(cnxn.status).toEqual('pending')
        cnxn.setErrorStatus()
        expect(cnxn.status).toEqual('error')
        expect(() => cnxn.postApiRequest(mockRequest)).rejects.toThrow(/Error in webrtc connection/)
    })
    test("Waits if status is pending", async () => {
        const mockSleep = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('break loop'))
        vi.doMock('../../src/util/sleepMsec', () => {
            return {
                __esModule: true,
                default: mockSleep
            }
        })
        const imported = (await import('../../src/networking/WebrtcConnectionToService'))
        const cnxn = new imported.default(mockPeer)
        expect(cnxn.status).toBe('pending')
        expect(() => cnxn.postApiRequest(mockRequest)).rejects.toThrow(/break loop/)
        expect(mockSleep).toHaveBeenCalledOnce()
        expect(mockSleep.mock.lastCall[0]).toEqual(imported.WEBRTC_CONNECTION_PENDING_API_WAIT_INTERVAL_MS)
    })
    test("Sends stringified request to peer returning promise resolved by callback fn", async () => {
        const imported = (await import('../../src/networking/WebrtcConnectionToService'))
        const requests = {}
        const cnxn = new imported.default(mockPeer, requests).configurePeer()
        mockPeer.connect()
        mockPeer.send = vi.fn().mockResolvedValue(undefined)

        expect(cnxn.status).toBe('connected')
        expect(mockPeer.send).toHaveBeenCalledTimes(0)

        const promise = cnxn.postApiRequest(mockRequest)
        setTimeout(() => {}, 0)
        const reqs = Object.keys(requests)
        expect(reqs.length).toBe(1)
        requests[reqs[0]]('foo')
        const result = await promise
        expect(mockPeer.send).toHaveBeenCalledOnce()

        const call = mockPeer.send.mock.lastCall[0]
        expect(call).toEqual(JSON.stringify({type: 'mcmcMonitorPeerRequest', request: mockRequest, requestId: reqs[0]}))
        expect(result).toBe('foo')
    })
})

describe("GUI web rtc connection instantiation", () => {
    let mockPostApiRequest: Mock

    // we won't be using the postApiRequest mock for anything, but need to mock it
    // or else set up the environment so that the window import is defined--the
    // import chain winds up invoking browser-environment-specific globals
    beforeEach(() => {
        mockPostApiRequest = vi.fn()
        vi.doMock('../../src/networking/postApiRequest', () => {
            return {
                __esModule: true,
                default: mockPostApiRequest as unknown as apiEndpoint
            }
        })

    })

    test("Returns connection's current status", async () => {
        const myPeer = {} as unknown as SimplePeer.Instance
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        const cnxn = new sut(myPeer)
        expect(cnxn.status).toEqual('pending')
    })
    test("ClientID is set during construction", async () => {
        const myPeer = {} as unknown as SimplePeer.Instance
        const sut = (await import('../../src/networking/WebrtcConnectionToService')).default
        const cnxn = new sut(myPeer)
        expect(cnxn.clientId).not.toEqual("ID-PENDING")
        expect(cnxn.clientId.length).toEqual(10)
    })
})
