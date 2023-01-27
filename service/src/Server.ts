import express, { Express, NextFunction, Request, Response } from 'express';
import * as http from 'http';
import { MCMCChain, MCMCRun, protocolVersion } from './MCMCMonitorTypes';
import OutputManager from './OutputManager';

class Server {
    #expressApp: Express
    #expressServer: http.Server
    #outputManager: OutputManager
    constructor(private a: {port: number, dir: string, verbose: boolean}) {
        this.#outputManager = new OutputManager(a.dir)
        this.#expressApp = express()
        this.#expressServer = http.createServer(this.#expressApp)
        const allowedOrigins = ['https://magland.github.io', 'http://127.0.0.1:5173']
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
        this.#expressApp.get('/getRuns', (req: Request, resp: Response) => {
            if (this.a.verbose) {
                console.info(`${req.method} /getRuns`)
            }
            ;(async () => {
                const runs = await this.#outputManager.getRuns()
                resp.status(200).send({runs})
            })()
        })
        this.#expressApp.get('/getChainsForRun/:runId', (req: Request, resp: Response) => {
            const runId: string = req.params.runId
            if (this.a.verbose) {
                console.info(`${req.method} /getChainsForRun ${runId}`)
            }
            ;(async () => {
                const chains = await this.#outputManager.getChainsForRun(runId)
                resp.status(200).send({chains})
            })()
        })
    }
    start() {
        this.#expressServer.listen(this.a.port, () => {
            return console.info(`Server is running on port ${this.a.port}`)
        })
    }
}

export default Server