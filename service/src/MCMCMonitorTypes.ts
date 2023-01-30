export const protocolVersion = '0.1.1'

export type MCMCRun = {
    runId: string
}

export type MCMCChain = {
    runId: string
    chainId: string
    variableNames: string[]
    rawHeader?: string
    rawFooter?: string
}

export type MCMCSequence = {
    runId: string
    chainId: string
    variableName: string
    data: number[]
}

export type GetSequencesRequest = {
    sequences: {
        runId: string
        chainId: string
        variableName: string
        position: number
    }[]
}

export type GetSequencesResponse = {
    sequences: {
        runId: string
        chainId: string
        variableName: string
        position: number
        data: number[]
    }[]
}