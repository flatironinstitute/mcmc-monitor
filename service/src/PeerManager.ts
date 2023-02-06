import { handleApiRequest } from "./handleApiRequest"
import { isMCMCMonitorPeerRequest, MCMCMonitorPeerResponse } from "./MCMCMonitorPeerRequest"
import OutputManager from "./OutputManager"

class Peer {
    // placeholder for when we can handle peer-to-peer communication
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on(e: string, cb: (x: any) => void) {
        
    }
    public get id() {
        return 'not-implemented'
    }
}

class DataConnection {
    // placeholder for when we can handle peer-to-peer communication
    close() {

    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    send(msg: any) {
        
    }
}

class PeerManager {
    #peer: Peer
    #connections: {[key: string]: PeerConnection} = {}
    constructor(private outputManager: OutputManager, private o: {verbose: boolean}) {

    }
    async start() {
        this.#peer = new Peer()
        console.info('Peer ID', this.#peer.id)
        this.#peer.on('connection', c => {
            const peerId = c.peer
            if (this.#connections[peerId]) {
                console.warn(`Already have a connection for peer ${peerId}`)
                c.close()
                return
            }
            const connection = new PeerConnection(c, this.outputManager, this.o)
            this.#connections[peerId] = connection
            c.on('close', () => {
                connection.stop()
                delete this.#connections[peerId]
            })
            c.on('error', (err) => {
                console.error(`Error from peer ${peerId}: ${err.message}`)
            })
            c.on('data', (data) => {
                connection.processData(data)
            })
        })
        this.#peer.on('error', (err) => {
            console.error(`Error with peer ${err.message}`)
        })
        this.#peer.on('disconnected', () => {
            console.warn('Peer disconnected.')
        })
        this.#peer.on('open', () => {
            console.info('Peer opened')
        })
    }
}

class PeerConnection {
    constructor(private peerConnection: DataConnection, private outputManager: OutputManager, private o: {verbose: boolean}) {

    }
    stop() {

    }
    async processData(data: any) {
        if (!isMCMCMonitorPeerRequest(data)) {
            console.warn(data)
            console.error('Invalid peer request. Disconnecting.')
            this.peerConnection.close()
            return
        }
        const response = await handleApiRequest(data.request, this.outputManager, this.o)
        const rr: MCMCMonitorPeerResponse = {
            type: 'mcmcMonitorPeerResponse',
            response,
            requestId: data.requestId
        }
        this.peerConnection.send(rr)
    }
}

export default PeerManager