export const isSpaRunId = (runId: string): boolean => {
    return runId.startsWith('spa|')
}

export const constructSpaRunId = (projectId: string, fileName: string): string => {
    return `spa|${projectId}|${fileName}`
}

export const parseSpaRunId = (runId: string): {projectId: string, fileName: string} => {
    const a = runId.split('|')
    if (a.length !== 3) throw Error(`Invalid SPA runId: ${runId}`)
    if (a[0] !== 'spa') throw Error(`Invalid SPA runId: ${runId}`)
    const projectId = a[1]
    const fileName = a[2]
    return {
        projectId,
        fileName
    }
}