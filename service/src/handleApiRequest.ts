import { GetChainsForRunResponse, GetRunsResponse, GetSequencesResponse, MCMCMonitorRequest, MCMCMonitorResponse, ProbeResponse, protocolVersion } from "./MCMCMonitorRequest";
import OutputManager from "./OutputManager";

export const handleApiRequest = async (request: MCMCMonitorRequest, outputManager: OutputManager, o: {verbose: boolean, webrtc?: boolean}): Promise<MCMCMonitorResponse> => {
    if (request.type === 'probeRequest') {
        const response: ProbeResponse = {
            type: 'probeResponse',
            protocolVersion: protocolVersion
        }
        return response
    }
    else if (request.type === 'getRunsRequest') {
        if (o.verbose) {
            console.info(`${o.webrtc ? "Webrtc " : ""}getRuns`)
        }
        const runs = await outputManager.getRuns()
        const response: GetRunsResponse = {type: 'getRunsResponse', runs}
        return response
    }
    else if (request.type === 'getChainsForRunRequest') {
        const {runId} = request
        if (o.verbose) {
            console.info(`${o.webrtc ? "Webrtc " : ""}getChainsForRun ${runId}`)
        }
        const chains = await outputManager.getChainsForRun(runId)
        const response: GetChainsForRunResponse ={
            type: 'getChainsForRunResponse',
            chains
        }
        return response
    }
    else if (request.type === 'getSequencesRequest') {
        if (o.verbose) {
            console.info(`${o.webrtc ? "Webrtc " : ""}getSequences ${request.sequences.length}`)
        }
        const response: GetSequencesResponse = {type: 'getSequencesResponse', sequences: []}
        for (const s of request.sequences) {
            const {runId, chainId, variableName, position} = s
            
            const sd = await outputManager.getSequenceData(runId, chainId, variableName, position)
            response.sequences.push({
                runId,
                chainId,
                variableName,
                position,
                data: sd.data
            })
        }
        return response
    }
    else {
        throw Error('Unexpected request type')
    }
}