import { WebrtcSignalingRequest, WebrtcSignalingResponse } from "../types/MCMCMonitorRequestTypes";

class SignalCommunicator {
    #onConnectionCallbacks: ((connection: SignalCommunicatorConnection) => void)[] = []
    #connections: {[clientId: string]: SignalCommunicatorConnection} = {}
    async handleRequest(request: WebrtcSignalingRequest): Promise<WebrtcSignalingResponse> {
        if (!(request.clientId in this.#connections)) {
            const cc = new SignalCommunicatorConnection()
            this.#connections[request.clientId] = cc
            cc.onClose(() => {
                if (request.clientId in this.#connections) {
                    delete this.#connections[request.clientId]
                }
            })
            this.#onConnectionCallbacks.forEach(cb => {cb(cc)})
        }
        return await this.#connections[request.clientId].handleRequest(request)
    }
    onConnection(cb: (connection: SignalCommunicatorConnection) => void) {
        this.#onConnectionCallbacks.push(cb)
    }
}

export class SignalCommunicatorConnection {
    #onSignalCallbacks: ((s: string) => void)[] = []
    #onCloseCallbacks: (() => void)[] = []
    #pendingSignalsToSend: string[] = []
    #closed = false
    constructor() { }
    async handleRequest(request: WebrtcSignalingRequest): Promise<WebrtcSignalingResponse> {
        if (request.signal) {
            this.#onSignalCallbacks.forEach(cb => {cb(request.signal)})
        }
        if (this.#pendingSignalsToSend.length === 0) {
            const timer = Date.now()
            while ((Date.now() - timer) < 1000) {
                if (this.#pendingSignalsToSend.length > 0) {
                    break
                }
                await sleepMsec(100)
            }
        }
        const signals0 = this.#pendingSignalsToSend
        this.#pendingSignalsToSend = []
        return {
            type: 'webrtcSignalingResponse',
            signals: signals0
        }
    }
    sendSignal(s: string) {
        this.#pendingSignalsToSend.push(s)
    }
    close() {
        this.#onCloseCallbacks.forEach(cb => {cb()})
        this.#closed = true
    }
    onClose(cb: () => void) {
        this.#onCloseCallbacks.push(cb)
    }
    wasClosed() {
        return this.#closed
    }
    onSignal(cb: (s: string) => void) {
        this.#onSignalCallbacks.push(cb)
    }
}

export const sleepMsec = async (msec: number): Promise<void> => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, msec)
    })
}

export default SignalCommunicator