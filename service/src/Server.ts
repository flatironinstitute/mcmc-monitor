import express, { Express, NextFunction, Request, Response } from 'express';
import * as http from 'http';
import { handleApiRequest } from './handleApiRequest';
import { isMCMCMonitorRequest, protocolVersion } from './MCMCMonitorRequest';
import OutputManager from './OutputManager';
import ngrok from 'ngrok'
import { Server as WSServer } from 'ws'
import SimplePeer from 'simple-peer';
import wrtc from 'wrtc'
import { isMCMCMonitorPeerRequest, MCMCMonitorPeerResponse } from './MCMCMonitorPeerRequest';
import { isWebsocketMessage, WebsocketMessage } from './WebsocketMessage';

class Server {
    #expressApp: Express
    #expressServer: http.Server
    #outputManager: OutputManager
    constructor(private a: {port: number, dir: string, verbose: boolean, enableRemoteAccess: boolean}) {
        this.#outputManager = new OutputManager(a.dir)
        this.#expressApp = express()
        this.#expressApp.use(express.json())
        this.#expressServer = http.createServer(this.#expressApp)
        const allowedOrigins = ['https://flatironinstitute.github.io', 'http://127.0.0.1:5173']
        this.#expressApp.use((req: Request, resp: Response, next: NextFunction) => {
            const origin = req.get('origin')
            const allowedOrigin = allowedOrigins.includes(origin) ? origin : undefined
            if (allowedOrigin) {
                resp.header('Access-Control-Allow-Origin', allowedOrigin)
                resp.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept")
            }
            next()
        })
        this.#expressApp.get('/probe', (req: Request, resp: Response) => {
            resp.status(200).send({protocolVersion})
        })
        this.#expressApp.post('/api', (req: Request, resp: Response) => {
            const request = req.body
            if (!isMCMCMonitorRequest(request)) {
                resp.status(500).send('Invalid request')
                return
            }
            ;(async () => {
                const response = await handleApiRequest(request, this.#outputManager, {verbose: this.a.verbose})
                resp.status(200).send(response)
            })()
        })
        const wss: WSServer = new WSServer({server: this.#expressServer})
        wss.on('connection', (ws) => {
            const peer = new SimplePeer({initiator: false, wrtc})
            peer.on('data', d => {
                const peerRequest = JSON.parse(d)
                if (!isMCMCMonitorPeerRequest(peerRequest)) {
                    console.warn('Invalid webrtc peer request. Disconnecting.')
                    ws.close()
                    return
                }
                handleApiRequest(peerRequest.request, this.#outputManager, {verbose: true, webrtc: true}).then(response => {
                    const resp: MCMCMonitorPeerResponse = {
                        type: 'mcmcMonitorPeerResponse',
                        response,
                        requestId: peerRequest.requestId
                    }
                    peer.send(JSON.stringify(resp))
                })
            })
            peer.on('signal', s => {
                const mm: WebsocketMessage = {
                    type: 'signal',
                    signal: JSON.stringify(s)
                }
                ws.send(JSON.stringify(mm))
            })
            peer.on('error', e => {
                console.error('Error in webrtc peer', e.message)
                ws.close()
            })
            peer.on('connect', () => {
                console.info('webrtc peer connected')
            })
            ws.on('close', () => {
                peer.destroy()
            })
            ws.on('message', msg => {
                const messageJson = msg.toString()
                let message: any
                try {
                    message = JSON.parse(messageJson)
                }
                catch(err) {
                    console.error(`Error parsing message. Closing websocket`)
                    ws.close()
                    return
                }
                if (!isWebsocketMessage(message)) {
                    console.warn(message)
                    console.error(`Invalid websocket message to service. Closing websocket`)
                    ws.close()
                    return
                }
                if (message.type === 'signal') {
                    peer.signal(JSON.parse(message.signal))
                }
            })
        })
        if (a.enableRemoteAccess) {
            ;(async () => {
                if (!process.env.NGROK_AUTH_TOKEN) {
                    console.error('Env variable not set: NGROK_AUTH_TOKEN')
                    console.error('Exiting')
                    process.exit()
                }
                console.info('Connecting to ngrok')
                await ngrok.authtoken(process.env.NGROK_AUTH_TOKEN)
                const url = await ngrok.connect({addr: this.a.port, host_header: 'rewrite', ngrok_skip_browser_warning: true})
                console.info(`Connect remotely: https://flatironinstitute.github.io/mcmc-monitor?s=${url}&webrtc=1`)
            })()
        }
        // if (a.enableRemoteAccess) {
        //     this.#peerManager = new PeerManager(this.#outputManager, {verbose: this.a.verbose})
        //     this.#peerManager.start()
        // }
    }
    async stop() {
        return new Promise<void>((resolve) => {
            this.#expressServer.close((err) => {
                if (err) {console.warn(err)}
                resolve()
            })
        })
    }
    start() {
        this.#expressServer.listen(this.a.port, () => {
            return console.info(`Server is running on port ${this.a.port}`)
        })
    }
}

export default Server