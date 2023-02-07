import SimplePeer from "simple-peer";
import { isMCMCMonitorPeerResponse, MCMCMonitorPeerRequest } from "./MCMCMonitorPeerRequest";
import { MCMCMonitorRequest, MCMCMonitorResponse } from "./MCMCMonitorRequest";
import { isWebsocketMessage, WebsocketMessage } from "./WebsocketMessage";

class WebrtcConnectionToService {
    #peer: SimplePeer.Instance | undefined
    #requestCallbacks: {[requestId: string]: (response: MCMCMonitorResponse) => void} = {}
    #status: 'pending' | 'connected' | 'error' = 'pending'
    constructor(url: string) {
        const ws = new WebSocket(url)
        ws.addEventListener('open', () => {
            const peer = new SimplePeer({initiator: true})
            ws.addEventListener('close', () => {
                console.info('websocket connection closed')
                peer.destroy()
            })
            ws.addEventListener('message', (msg) => {
                const mm = JSON.parse(msg.data)
                if (!isWebsocketMessage(mm)) {
                    console.warn('Invalid websocket message')
                    ws.close()
                    return
                }
                if (mm.type === 'signal') {
                    peer.signal(JSON.parse(mm.signal))
                }
            })
            peer.on('signal', async s => {
                const mm: WebsocketMessage = {
                    type: 'signal',
                    signal: JSON.stringify(s)
                }
                ws.send(JSON.stringify(mm))
            })
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
            this.#peer = peer
        })
    }
    async postApiRequest(request: MCMCMonitorRequest): Promise<MCMCMonitorResponse> {
        if (!this.#peer) throw Error('No peer')
        if (this.status === 'error') {
            throw Error('Error in webrtc connection')
        }
        while (this.status === 'pending') {
            await sleepMsec(100)
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
}

export const randomAlphaString = (num_chars: number) => {
    if (!num_chars) {
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    let text = ""
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < num_chars; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

export const sleepMsec = async (msec: number): Promise<void> => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, msec)
    })
}

export default WebrtcConnectionToService