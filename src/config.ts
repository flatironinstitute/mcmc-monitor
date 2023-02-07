import WebrtcConnectionToService from "./WebrtcConnectionToService"

const urlSearchParams = new URLSearchParams(window.location.search)
const queryParams = Object.fromEntries(urlSearchParams.entries())

export const defaultServiceBaseUrl = 'http://localhost:61542'

export const exampleServiceBaseUrl = 'https://lit-bayou-76056.herokuapp.com'

export const serviceBaseUrl = queryParams.s ? (
    queryParams.s
) : (
    defaultServiceBaseUrl
)

export const useWebrtc = queryParams.webrtc === '1'

export let webrtcConnectionToService: WebrtcConnectionToService | undefined

if ((useWebrtc) && (!webrtcConnectionToService)) {
    const wsUrl = serviceBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    webrtcConnectionToService = new WebrtcConnectionToService(wsUrl)
}