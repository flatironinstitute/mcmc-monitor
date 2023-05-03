import SimplePeer from 'simple-peer';
import wrtc from 'wrtc';
import OutputManager from '../logic/OutputManager';
import { MCMCMonitorPeerResponse } from '../types/MCMCMonitorPeerRequestTypes';
import SignalCommunicator, { SignalCommunicatorConnection } from './SignalCommunicator';
import { handleApiRequest } from './handleApiRequest';
import { isMCMCMonitorPeerRequest } from '../types';


type callbackProps = {
    peer: SimplePeer.Instance,
    id: string,
    cnxn: SignalCommunicatorConnection,
    outputMgr: OutputManager,
    signalCommunicator: SignalCommunicator
}


const getPeer = (connection: SignalCommunicatorConnection, outputMgr: OutputManager, signalCommunicator: SignalCommunicator) => {
    const peer = new SimplePeer({initiator: false, wrtc})
    const id = Math.random().toString(36).substring(2, 10)
    const props: callbackProps = {
        peer,
        id,
        cnxn: connection,
        outputMgr: outputMgr,
        signalCommunicator
    }
    peer.on('data', d => onData(d, props))
    peer.on('signal', s => onPeerSignal(s, props))
    peer.on('error', e => onError(e, props))
    peer.on('connect', () => {
        console.info(`webrtc peer ${id} connected`)
    })
    peer.on('close', () => onClose(props))
    connection.onSignal(signal => onConnectionSignal(signal, props))

    return peer
}


const onData = (d: string, props: callbackProps) => {
    const { peer, id, cnxn, outputMgr, signalCommunicator } = props
    const peerRequest = JSON.parse(d)
    if (!isMCMCMonitorPeerRequest(peerRequest)) {
        console.warn('Invalid webrtc peer request. Disconnecting.')
        try {
            peer.destroy()
        } catch(err) {
            console.error(err)
            console.warn(`\tProblem destroying webrtc peer ${id} in response to bad peer request.`)
        }
        cnxn.close()
        return
    }
    handleApiRequest({request: peerRequest.request, outputManager: outputMgr, signalCommunicator, options: {verbose: true, webrtc: true}}).then(response => {
        const resp: MCMCMonitorPeerResponse = {
            type: 'mcmcMonitorPeerResponse',
            response,
            requestId: peerRequest.requestId
        }
        try {
            if (cnxn.wasClosed()) {
                console.warn(`\tSignal communicator connection was closed before the response could be sent.`)
            } else {
                peer.send(JSON.stringify(resp))
            }
        } catch(err) {
            console.error(err)
            console.warn(`\tProblem sending API response to webrtc peer ${id}.`)
        }
    })
}


const onClose = (props: callbackProps) => {
    const { peer, id, cnxn } = props

    console.info(`webrtc peer ${id} disconnected`)
    peer.removeAllListeners('data')
    peer.removeAllListeners('signal')
    peer.removeAllListeners('connect')
    peer.removeAllListeners('close')
    cnxn.close()
}


const onPeerSignal = (s: SimplePeer.SignalData, props: callbackProps) => {
    props.cnxn.sendSignal(JSON.stringify(s))
}


const onError = (e: Error, props: callbackProps) => {
    const { peer, cnxn, id } = props
    console.error('Error in webrtc peer', e.message)
    try {
        peer.destroy()
    } catch(err) {
        console.error(err)
        console.warn(`\tProblem destroying webrtc peer ${id} in response to peer error.`)
    }
    cnxn.close()
}


const onConnectionSignal = (signal: string, props: callbackProps) => {
    const { peer, id } = props
    try {
        peer.signal(JSON.parse(signal))
    } catch(err) {
        console.error(err)
        console.warn(`\tProblem sending signal to webrtc peer ${id}.`)
    }
}


export default getPeer
