import express, { Express, NextFunction, Request, Response } from 'express';
import * as http from 'http';
import { handleApiRequest } from './handleApiRequest';
import { isMCMCMonitorRequest, protocolVersion } from './MCMCMonitorRequest';
import OutputManager from './OutputManager';
import SimplePeer from 'simple-peer';
import wrtc from 'wrtc'
import { isMCMCMonitorPeerRequest, MCMCMonitorPeerResponse } from './MCMCMonitorPeerRequest';
import SignalCommunicator from './SignalCommunicator';
import OutgoingProxyConnection from './OutgoingProxyConnection';
import fs from 'fs'
import YAML from 'js-yaml'

class Server {
    #expressApp: Express
    #expressServer: http.Server
    #outputManager: OutputManager
    #outgoingProxyConnection: OutgoingProxyConnection | undefined
    constructor(private a: {port: number, dir: string, verbose: boolean, enableRemoteAccess: boolean}) {
        this.#outputManager = new OutputManager(a.dir)
        this.#expressApp = express()
        this.#expressApp.use(express.json())
        this.#expressServer = http.createServer(this.#expressApp)
        const allowedOrigins = ['https://flatironinstitute.github.io', 'http://127.0.0.1:5173', 'http://localhost:5173']
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
                const response = await handleApiRequest(request, this.#outputManager, signalCommunicator, {verbose: this.a.verbose})
                resp.status(200).send(response)
            })()
        })
        const signalCommunicator = new SignalCommunicator()
        if (a.enableRemoteAccess) {
            signalCommunicator.onConnection(connection => {
                const peer = new SimplePeer({initiator: false, wrtc})
                peer.on('data', d => {
                    const peerRequest = JSON.parse(d)
                    if (!isMCMCMonitorPeerRequest(peerRequest)) {
                        console.warn('Invalid webrtc peer request. Disconnecting.')
                        peer.destroy()
                        connection.close()
                        return
                    }
                    handleApiRequest(peerRequest.request, this.#outputManager, signalCommunicator, {verbose: true, webrtc: true}).then(response => {
                        const resp: MCMCMonitorPeerResponse = {
                            type: 'mcmcMonitorPeerResponse',
                            response,
                            requestId: peerRequest.requestId
                        }
                        peer.send(JSON.stringify(resp))
                    })
                })
                peer.on('signal', s => {
                    connection.sendSignal(JSON.stringify(s))
                })
                peer.on('error', e => {
                    console.error('Error in webrtc peer', e.message)
                    peer.destroy()
                    connection.close()
                })
                peer.on('connect', () => {
                    console.info('webrtc peer connected')
                })
                peer.on('close', () => {
                    console.info('webrtc peer disconnected')
                    connection.close()
                })
                connection.onSignal(signal => {
                    peer.signal(JSON.parse(signal))
                })
            })
        }
        const urlLocal = `https://flatironinstitute.github.io/mcmc-monitor?s=http://localhost:${this.a.port}`
        console.info('')
        console.info(`Connect on local machine: ${urlLocal}`)
        console.info('')
        if (a.enableRemoteAccess) {
            ;(async () => {
                console.info('Connecting to proxy')
                // const serviceName = randomAlphaString(10)
                const serviceName = await getServiceNameFromDir(this.a.dir)
                const outgoingProxyConnection = new OutgoingProxyConnection(serviceName, this.#outputManager, signalCommunicator, {verbose: this.a.verbose, webrtc: true})
                this.#outgoingProxyConnection = outgoingProxyConnection
                const proxyUrl = outgoingProxyConnection.url
                const urlRemote = `https://flatironinstitute.github.io/mcmc-monitor?s=${proxyUrl}&webrtc=1`
                console.info('')
                console.info(`Connect on remote machine: ${urlRemote}`)
                console.info('')
            })()
        }
        // if (a.enableRemoteAccess) {
        //     this.#peerManager = new PeerManager(this.#outputManager, {verbose: this.a.verbose})
        //     this.#peerManager.start()
        // }
    }
    async stop() {
        return new Promise<void>((resolve) => {
            if (this.#outgoingProxyConnection) {
                this.#outgoingProxyConnection.close()
            }
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

async function getServiceNameFromDir(dir: string): Promise<string> {
    const yamlPath = `${dir}/mcmc-monitor.yaml`
    let config: {[key: string]: any} = {}
    if (fs.existsSync(yamlPath)) {
        const yaml = await fs.promises.readFile(yamlPath, 'utf8')
        config = YAML.load(yaml)
    }
    if (!config.serviceName) {
        config.serviceName = `s-${randomAlphaStringLower(12)}`
        const newYaml = YAML.dump(config)
        await fs.promises.writeFile(yamlPath, newYaml)
    }
    return config.serviceName
}

export const randomAlphaStringLower = (num_chars: number) => {
    if (!num_chars) {
        /* istanbul ignore next */
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    let text = "";
    const possible = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < num_chars; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

export default Server