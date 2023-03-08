import check from 'check-node-version';
import crypto from 'crypto';
import express, { Express, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import * as http from 'http';
import YAML from 'js-yaml';
import OutgoingProxyConnection from './OutgoingProxyConnection';
import OutputManager from './OutputManager';
import getPeer from './RemotePeer';
import SignalCommunicator, { sleepMsec } from './SignalCommunicator';
import { handleApiRequest } from './handleApiRequest';
import { isMCMCMonitorRequest, protocolVersion } from './types/MCMCMonitorRequest';

const allowedOrigins = ['https://flatironinstitute.github.io', 'http://127.0.0.1:5173', 'http://localhost:5173']
const PATH_TO_PACKAGE_JSON = '../package.json'

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
                const response = await handleApiRequest({request, outputManager: this.#outputManager, signalCommunicator, options: {verbose: this.a.verbose, proxy: false}})
                resp.status(200).send(response)
            })()
        })
        const signalCommunicator = new SignalCommunicator()
        if (a.enableRemoteAccess) {
            signalCommunicator.onConnection(connection => { return getPeer(connection, this.#outputManager, signalCommunicator)})
        }
        const urlLocal = `https://flatironinstitute.github.io/mcmc-monitor?s=http://localhost:${this.a.port}`
        console.info('')
        console.info(`Connect on local machine: ${urlLocal}`)
        console.info('')
        if (a.enableRemoteAccess) {
            ;(async () => {
                console.info('Connecting to proxy')
                const {publicId, privateId} = await getServiceIdFromDir(this.a.dir)
                const outgoingProxyConnection = new OutgoingProxyConnection(publicId, privateId, this.#outputManager, signalCommunicator, {verbose: this.a.verbose, webrtc: true})
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
        checkNodeVersion()
        this.#expressServer.listen(this.a.port, () => {
            return console.info(`Server is running on port ${this.a.port}`)
        })

        // clean up output manager periodically
        ;(async () => {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                await this.#outputManager.clearOldData()
                await sleepMsec(30 * 1000)
            }
        })()
    }
}

async function getServiceIdFromDir(dir: string): Promise<{publicId: string, privateId: string}> {
    const yamlPath = `${dir}/mcmc-monitor.yaml`
    let config: {[key: string]: any} = {}
    if (fs.existsSync(yamlPath)) {
        const yaml = await fs.promises.readFile(yamlPath, 'utf8')
        config = YAML.load(yaml)
    }
    if ((!config.publicId) || (!config.privateId)) {
        config.privateId = `${randomAlphaStringLower(40)}`
        config.publicId = sha1Hash(config.privateId).slice(0, 20)
        const newYaml = YAML.dump(config)
        await fs.promises.writeFile(yamlPath, newYaml)
    }
    return {publicId: config.publicId, privateId: config.privateId}
}

function sha1Hash(x: string) {
    const shasum = crypto.createHash('sha1')
    shasum.update(x)
    return shasum.digest('hex')
}

// Note: If we ever have more hard dependencies, we might make this more sophisticated in passing in the package requirements list.
const checkNodeVersion = () => {
    const data = require(PATH_TO_PACKAGE_JSON)
    const needs = data["engines"]
    check(
        needs,
        (error, result) => {
            if (error) {
                throw (error)
            }
            if (!result.isSatisfied) {
                if (!result.versions["node"].isSatisfied) {
                    console.error(`\n\tThis system is running with node version ${result.versions["node"].version}, but the minimum required version is ${result.versions["node"].wanted}. Exiting.`)
                    process.exit(-1)
                }
                // NOTE: The following is currently unreachable since we are only asking for a node version and we already handled that case.
                // However, it'll handle anything else that comes up, so it's left in as a default in case we make changes.
                const errors: string[] = []
                for (const pkg of Object.keys(result.versions)) {
                    if (!result.versions[pkg].isSatisfied) {
                        errors.push(`${pkg} (current version ${result.versions[pkg].version}, needed ${result.versions[pkg].wanted})`)
                    }
                }
                console.error(`The following package requirements were not met:\n\t${errors.join("\n\t")}`)
                process.exit(-1)
            }
        }
    )
}

const randomAlphaStringLower = (num_chars: number) => {
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