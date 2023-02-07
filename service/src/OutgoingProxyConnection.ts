import WebSocket from 'ws'
import { handleApiRequest } from './handleApiRequest'
import { InitializeMessageFromService, isAcknowledgeMessageToService, isRequestFromClient, RequestFromClient, ResponseToClient } from './MCMCMonitorProxyTypes'
import { isMCMCMonitorRequest, MCMCMonitorResponse } from './MCMCMonitorRequest'
import OutputManager from './OutputManager'
import SignalCommunicator from './SignalCommunicator'

const proxyUrl = `http://localhost:3035`
const proxySecret = 'mcmc-monitor-no-secret'

class OutgoingProxyConnection {
    #acknowledged: boolean
    #webSocket: WebSocket
    constructor(private serviceName: string, private outputManager: OutputManager, private signalCommunicator: SignalCommunicator, private o: {verbose: boolean, webrtc?: boolean}) {
        this.#acknowledged = false
        console.info(`Connecting to ${proxyUrl}`)
        const wsUrl = proxyUrl.replace('http:','ws:').replace('https:','wss:')
        const ws = new WebSocket(wsUrl)
        this.#webSocket = ws
        ws.on('open', () => {
            console.info('Connected')
            const msg: InitializeMessageFromService = {
                type: 'initialize',
                serviceName: this.serviceName,
                proxySecret: proxySecret
            }
            ws.send(JSON.stringify(msg))
        })
        ws.on('close', () => {
            console.info('Websocket closed.')
            this.#webSocket = undefined
        })
        ws.on('message', msg => {                
            const messageJson = msg.toString()
            let message: any
            try {
                message = JSON.parse(messageJson)
            }
            catch(err) {
                console.error(`Error parsing message. Closing.`)
                ws.close()
                return
            }
            if (isAcknowledgeMessageToService(message)) {
                console.info('Connection acknowledged by proxy server')
                this.#acknowledged = true
                return
            }
            if (!this.#acknowledged) {
                console.info('Unexpected, message before connection acknowledged. Closing.')
                ws.close()
                return
            }
            if (isRequestFromClient(message)) {
                this.handleRequestFromClient(message)
            }
            else {
                console.warn(message)
                console.warn('Unexpected message from proxy server')
            }
        })
    }
    async handleRequestFromClient(request: RequestFromClient) {
        if (!this.#webSocket) return
        const rr = request.request
        if (!isMCMCMonitorRequest(rr)) {
            const resp: ResponseToClient = {
                type: 'responseToClient',
                requestId: request.requestId,
                response: {},
                error: 'Invalid MCMC Monitor request'
            }
            this.#webSocket.send(JSON.stringify(resp))    
            return
        }
        let mcmcMonitorResponse: MCMCMonitorResponse
        try {
            mcmcMonitorResponse = await handleApiRequest(rr, this.outputManager, this.signalCommunicator, this.o)
        }
        catch(err) {
            const resp: ResponseToClient = {
                type: 'responseToClient',
                requestId: request.requestId,
                response: {},
                error: `Error handling request: ${err.message}`
            }
            this.#webSocket.send(JSON.stringify(resp))
            return
        }
        if (!this.#webSocket) return
        const responseToClient: ResponseToClient = {
            type: 'responseToClient',
            requestId: request.requestId,
            response: mcmcMonitorResponse
        }
        this.#webSocket.send(JSON.stringify(responseToClient))
    }
    public get url() {
        return `${proxyUrl}/s/${this.serviceName}`
    }
    close() {
        if (this.#webSocket) {
            this.#webSocket.close()
            this.#webSocket = undefined
        }
    }
}

export default OutgoingProxyConnection