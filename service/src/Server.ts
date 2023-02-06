import express, { Express, NextFunction, Request, Response } from 'express';
import * as http from 'http';
import { handleApiRequest } from './handleApiRequest';
import { isMCMCMonitorRequest, protocolVersion } from './MCMCMonitorRequest';
import OutputManager from './OutputManager';
import PeerManager from './PeerManager';

class Server {
    #expressApp: Express
    #expressServer: http.Server
    #outputManager: OutputManager
    #peerManager: PeerManager | undefined
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
        if (a.enableRemoteAccess) {
            this.#peerManager = new PeerManager(this.#outputManager, {verbose: this.a.verbose})
            this.#peerManager.start()
        }
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