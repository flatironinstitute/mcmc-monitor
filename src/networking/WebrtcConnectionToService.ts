import SimplePeer from "simple-peer";
import { MCMCMonitorPeerRequest, MCMCMonitorRequest, MCMCMonitorResponse, WebrtcSignalingRequest, isMCMCMonitorPeerResponse } from "../../service/src/types";
import randomAlphaString from "../util/randomAlphaString";
import sleepMsec from "../util/sleepMsec";
import postApiRequest from "./postApiRequest";

type webrtcConnectionStatus = 'pending' | 'connected' | 'error'

export const WEBRTC_CONNECTION_RETRY_INTERVAL_MS = 3000
export const WEBRTC_CONNECTION_TIMEOUT_INTERVAL_MS = 15000
export const WEBRTC_CONNECTION_PENDING_API_WAIT_INTERVAL_MS = 100

type callbacksQueueType = {[requestId: string]: (response: MCMCMonitorResponse) => void}

class WebrtcConnectionToService {
    #peer: SimplePeer.Instance | undefined
    #requestCallbacks: callbacksQueueType = {}
    #clientId = 'ID-PENDING'
    #status: webrtcConnectionStatus = 'pending'
    #timer: number | undefined
    constructor(peer: SimplePeer.Instance, callbacksQueue?: callbacksQueueType) {
        this.#clientId = randomAlphaString(10)
        this.#peer = peer
        this.#requestCallbacks = callbacksQueue ?? {}
        this.#timer = undefined
    }
    configurePeer() {
        if (this.#peer === undefined) {
            console.warn(`Attempt to configure uninitialized peer.`)
            return this
        }
        const peer = this.#peer
        peer.on('signal', async s => sendWebrtcSignal(this.#clientId, peer, s))
        peer.on('connect', () => {
            console.info('Webrtc connection established')
            this.#status = 'connected'
        })
        peer.on('data', d => {
            const dd = JSON.parse(d)
            if (!isMCMCMonitorPeerResponse(dd)) {
                console.warn(dd)
                throw Error('Unexpected peer response')
            }
            const cb = this.#requestCallbacks[dd.requestId]
            if (!cb) {
                console.warn('Got response, but no matching request ID callback')
                return
            }
            delete this.#requestCallbacks[dd.requestId]
            cb(dd.response)
        })
        return this
    }
    async connect() {
        if (this.#peer === undefined) {
            console.warn("Attempt to connect using uninitialized SimplePeer instance.")
            return
        }
        this.#timer = this.#timer ?? Date.now()
        const elapsed = Date.now() - this.#timer
        if (elapsed > WEBRTC_CONNECTION_TIMEOUT_INTERVAL_MS) {
            this.#status = 'error'
            console.warn('Unable to establish webrtc connection.')
            return
        }
        if (this.#status === 'pending') {
            sendWebrtcSignal(this.#clientId, this.#peer, undefined)
            setTimeout(() => {
                if (this.#status === 'pending') {
                    this.connect()
                }
            }, WEBRTC_CONNECTION_RETRY_INTERVAL_MS)
        }
    }
    async postApiRequest(request: MCMCMonitorRequest): Promise<MCMCMonitorResponse> {
        if (!this.#peer) throw Error('No peer')
        if (this.status === 'error') {
            throw Error('Error in webrtc connection')
        }
        while (this.status === 'pending') {
            await sleepMsec(WEBRTC_CONNECTION_PENDING_API_WAIT_INTERVAL_MS)
        }
        const peer = this.#peer
        const requestId = randomAlphaString(10)
        const rr: MCMCMonitorPeerRequest = {
            type: 'mcmcMonitorPeerRequest',
            request,
            requestId
        }
        return new Promise((resolve) => {
            this.#requestCallbacks[requestId] = (resp: MCMCMonitorResponse) => {
                resolve(resp)
            }
            peer.send(JSON.stringify(rr))
        })
    }
    public get status() {
        return this.#status
    }
    public get clientId() {
        return this.#clientId
    }
    public setErrorStatus() {
        this.#status = 'error'
    }
}

export const sendWebrtcSignal = async (clientId: string, peer: SimplePeer.Instance, s: SimplePeer.SignalData | undefined) => {
    const request: WebrtcSignalingRequest = {
        type: 'webrtcSignalingRequest',
        clientId,
        signal: s === undefined ? undefined : JSON.stringify(s)
    }
    const response = await postApiRequest(request)
    if (response.type !== 'webrtcSignalingResponse') {
        console.warn(response)
        throw Error('Unexpected webrtc signaling response')
    }
    for (const sig0 of response.signals) {
        peer.signal(sig0)
    }
}

export default WebrtcConnectionToService