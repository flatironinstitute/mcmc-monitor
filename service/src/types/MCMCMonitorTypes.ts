import validateObject, { isArrayOf, isBoolean, isNumber, isString, optional } from "./validateObject"

export type MCMCRun = {
    runId: string
}

export const isMCMCRun = (x: any): x is MCMCRun => (
    validateObject(x, { runId: isString })
)


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


export type MCMCSequence = {
    runId: string
    chainId: string
    variableName: string
    data: number[]
    updateRequested?: boolean
}

export const isMCMCSequence = (x: any): x is MCMCSequence => (
    validateObject(x, {
        runId: isString,
        chainId: isString,
        variableName: isString,
        data: isArrayOf(isNumber),
        updateRequested: optional(isBoolean)
    })
)
