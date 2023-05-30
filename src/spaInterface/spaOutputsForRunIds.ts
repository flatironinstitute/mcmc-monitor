import postStanPlaygroundRequest from "./postStanPlaygroundRequest";
import { parseSpaRunId } from "./util";

export type SpaOutput = {
    chains: {
        chainId: string,
        rawHeader: string,
        rawFooter: string,
        numWarmupDraws?: number,
        sequences: {
            [key: string]: number[]
        }
    }[]
}

export const spaOutputsForRunIds: {[key: string]: {
    sha1: string,
    spaOutput: SpaOutput
}} = {}

export const updateSpaOutputForRun = async (runId: string) => {
    const {projectId, fileName} = parseSpaRunId(runId)
    
    // first we need to get the sha1 of the latest file
    const req = {
        type: 'getProjectFile',
        timestamp: Date.now() / 1000,
        projectId,
        fileName
    }
    const resp = await postStanPlaygroundRequest(req)
    if (resp.type !== 'getProjectFile') {
        console.warn(resp)
        throw Error('Unexpected response from Stan Playground')
    }
    const sha1 = resp.projectFile.contentSha1

    const cachedEntry = spaOutputsForRunIds[runId]
    if ((cachedEntry && cachedEntry.sha1 === sha1)) {
        // we already have the latest version
        return
    }

    const req2 = {
        type: 'getDataBlob',
        timestamp: Date.now() / 1000,
        workspaceId: resp.projectFile.workspaceId,
        projectId,
        sha1
    }
    const resp2 = await postStanPlaygroundRequest(req2)
    if (resp2.type !== 'getDataBlob') {
        console.warn(resp2)
        throw Error('Unexpected response from Stan Playground')
    }
    const x = JSON.parse(resp2.content)
    const spaOutput = x as SpaOutput
    spaOutputsForRunIds[runId] = {
        sha1,
        spaOutput
    }
}