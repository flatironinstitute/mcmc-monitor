import SimplePeer from "simple-peer"
import WebrtcConnectionToService from "./networking/WebrtcConnectionToService"

const urlSearchParams = new URLSearchParams(window.location.search)
const queryParams = Object.fromEntries(urlSearchParams.entries())

export const defaultServiceBaseUrl = 'http://localhost:61542'

export const exampleServiceBaseUrl = 'https://lit-bayou-76056.herokuapp.com'

export const serviceBaseUrl = queryParams.s ? (
    queryParams.s === 'spa' ? '' : queryParams.s // if we are in spa mode, don't use a serviceBaseUrl
) : (
    defaultServiceBaseUrl
)

export const useWebrtc = queryParams.webrtc === '1'

export let webrtcConnectionToService: WebrtcConnectionToService | undefined

setTimeout(() => {
    // setting the timeout allows the import of postApiRequest to complete before it gets
    // called in the connect() method.
    // Otherwise, you get an (apparently ignorable, but annoying) error during connection setup.
    if ((useWebrtc) && (!webrtcConnectionToService)) {
        const peerInstance = new SimplePeer({initiator: true})
        webrtcConnectionToService = new WebrtcConnectionToService(peerInstance).configurePeer()
        webrtcConnectionToService?.connect()
    }
}, 0)