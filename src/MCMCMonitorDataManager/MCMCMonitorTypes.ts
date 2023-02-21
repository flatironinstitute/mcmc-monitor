import validateObject, { isArrayOf, isNumber, isString, optional } from "../validateObject"

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

export const isMCMCChain = (x: any): x is MCMCChain => (
    validateObject(x, {
        runId: isString,
        chainId: isString,
        variableNames: isArrayOf(isString),
        rawHeader: optional(isString),
        rawFooter: optional(isString),
        variablePrefixesExcluded: optional(isArrayOf(isString)),
        excludedInitialIterationCount: optional(isNumber),
        lastChangeTimestamp: isNumber
    })
)
