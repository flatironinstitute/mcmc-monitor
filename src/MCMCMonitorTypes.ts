export const protocolVersion = '0.1.0'

export type MCMCRun = {
    runId: string
}

export type MCMCChain = {
    runId: string
    chainId: string
    variableNames: string[]
    rawHeader?: string
}

export type MCMCSequence = {
    runId: string
    chainId: string
    variableName: string
    data: number[]
}

export default {}