import OutputManager from "../logic/OutputManager";
import { GetChainsForRunRequest, GetChainsForRunResponse, GetRunsResponse, GetSequencesRequest, GetSequencesResponse, MCMCMonitorRequest, MCMCMonitorResponse, ProbeResponse, WebrtcSignalingRequest, WebrtcSignalingResponse, isGetChainsForRunRequest, isGetRunsRequest, isGetSequencesRequest, isProbeRequest, isWebrtcSignalingRequest, protocolVersion } from "../types/MCMCMonitorRequestTypes";
import SignalCommunicator from "./SignalCommunicator";

type apiRequestOptions = {
    verbose: boolean,
    webrtc?: boolean,
    proxy?: boolean
}

type apiRequest = {
    request: MCMCMonitorRequest,
    outputManager: OutputManager,
    signalCommunicator: SignalCommunicator,
    options: apiRequestOptions
}


export const handleApiRequest = async (props: apiRequest): Promise<MCMCMonitorResponse> => {
    const { request, outputManager, signalCommunicator, options } = props
    const webrtcFlag = options.webrtc ? "Webrtc" : ""

    if (isProbeRequest(request)) {
        return handleProbeRequest(options.proxy)
    }

    if (isGetRunsRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} getRuns`)
        return handleGetRunsRequest(outputManager)
    }

    if (isGetChainsForRunRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} getChainsForRun ${request.runId}`)
        return handleGetChainsForRunRequest(request, outputManager)
    }
    
    if (isGetSequencesRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} getSequences ${request.sequences.length}`)
        return handleGetSequencesRequest(request, outputManager)
    }

    if (isWebrtcSignalingRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} webrtcSignalingRequest`)
        return handleWebrtcSignalingRequest(request, signalCommunicator)
    }

    throw Error('Unexpected request type')
}


const handleProbeRequest = async (usesProxy?: boolean): Promise<ProbeResponse> => {
    const response: ProbeResponse = {
        type: 'probeResponse',
        protocolVersion: protocolVersion,
        proxy: usesProxy
    }
    if (usesProxy) {
        response.proxy = true
    }
    return response
}


const handleGetRunsRequest = async (outputManager: OutputManager): Promise<GetRunsResponse> => {
    const runs = await outputManager.getRuns()
    const response: GetRunsResponse = {type: 'getRunsResponse', runs}
    return response
}


const handleGetChainsForRunRequest = async (request: GetChainsForRunRequest, outputManager: OutputManager): Promise<GetChainsForRunResponse> => {
    const {runId} = request
    const chains = await outputManager.getChainsForRun(runId)
    const response: GetChainsForRunResponse ={
        type: 'getChainsForRunResponse',
        chains
    }
    return response
}


const handleGetSequencesRequest = async (request: GetSequencesRequest, outputManager: OutputManager): Promise<GetSequencesResponse> => {
    const response: GetSequencesResponse = { type: 'getSequencesResponse', sequences: [] };
    for (const s of request.sequences) {
        const { runId, chainId, variableName, position } = s;

        const sd = await outputManager.getSequenceData(runId, chainId, variableName, position);
        response.sequences.push({
            runId,
            chainId,
            variableName,
            position,
            data: sd.data
        });
    }
    return response;
}


const handleWebrtcSignalingRequest = async (request: WebrtcSignalingRequest, signalCommunicator: SignalCommunicator): Promise<WebrtcSignalingResponse> => {
    return await signalCommunicator.handleRequest(request)
}
