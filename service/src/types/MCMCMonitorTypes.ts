export type MCMCRun = {
    runId: string
}

export type MCMCChain = {
    runId: string
    chainId: string
    variableNames: string[]
    rawHeader?: string
    rawFooter?: string
    variablePrefixesExcluded?: string[]
    excludedInitialIterationCount?: number
    lastChangeTimestamp: number
}

export type MCMCSequence = {
    runId: string
    chainId: string
    variableName: string
    data: number[]
    updateRequested?: boolean
}
