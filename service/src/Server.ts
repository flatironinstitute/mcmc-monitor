import express, { Express, NextFunction, Request, Response } from 'express';
import * as http from 'http';
import { GetChainsForRunResponse, GetRunsResponse, GetSequencesResponse, isMCMCMonitorRequest, ProbeResponse, protocolVersion } from './MCMCMonitorRequest';
import OutputManager from './OutputManager';

class Server {
    #expressApp: Express
    #expressServer: http.Server
    #outputManager: OutputManager
    constructor(private a: {port: number, dir: string, verbose: boolean}) {
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
                if (request.type === 'probeRequest') {
                    const response: ProbeResponse = {
                        type: 'probeResponse',
                        protocolVersion
                    }
                    resp.status(200).send(response)
                }
                else if (request.type === 'getRunsRequest') {
                    if (this.a.verbose) {
                        console.info(`${req.method} /getRuns`)
                    }
                    const runs = await this.#outputManager.getRuns()
                    const response: GetRunsResponse = {type: 'getRunsResponse', runs}
                    resp.status(200).send(response)
                }
                else if (request.type === 'getChainsForRunRequest') {
                    const {runId} = request
                    if (this.a.verbose) {
                        console.info(`${req.method} /getChainsForRun ${runId}`)
                    }
                    const chains = await this.#outputManager.getChainsForRun(runId)
                    const response: GetChainsForRunResponse ={
                        type: 'getChainsForRunResponse',
                        chains
                    }
                    resp.status(200).send(response)
                }
                else if (request.type === 'getSequencesRequest') {
                    if (this.a.verbose) {
                        console.info(`${req.method} /getSequences ${request.sequences.length}`)
                    }
                    const response: GetSequencesResponse = {type: 'getSequencesResponse', sequences: []}
                    for (const s of request.sequences) {
                        const {runId, chainId, variableName, position} = s
                        
                        const sd = await this.#outputManager.getSequenceData(runId, chainId, variableName, position)
                        response.sequences.push({
                            runId,
                            chainId,
                            variableName,
                            position,
                            data: sd.data
                        })
                    }
                    resp.status(200).send(response)
                }
                else {
                    resp.status(500).send('Unexpected request type')
                }
            })()
        })
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