import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer, useRef } from "react"
import { serviceBaseUrl } from "./config"
import { initialMCMCMonitorData, MCMCMonitorContext, mcmcMonitorReducer } from "./MCMCMonitorData"
import { GetSequencesRequest, GetSequencesResponse, MCMCSequence, protocolVersion } from "./MCMCMonitorTypes"

type SequencesToUpdate = {
    runId: string
    chainId: string
    variableName: string
}[]

const SetupMCMCMonitor: FunctionComponent<PropsWithChildren> = ({children}) => {
    const [data, dataDispatch] = useReducer(mcmcMonitorReducer, initialMCMCMonitorData)
    const sequencesRef = useRef<MCMCSequence[]>(data.sequences)

    const value = useMemo(() => ({
        data,
        dispatch: dataDispatch
    }), [data, dataDispatch])

    useEffect(() => {
        ;(async () => {
            try {
                const resp = await fetch(`${serviceBaseUrl}/probe`)
                const a = await resp.json()
                if (a.protocolVersion !== protocolVersion) {
                    throw Error(`Unexpected protocol version: ${a.protocolVersion} <> ${protocolVersion}`)
                }
                dataDispatch({type: 'setConnectedToService', connected: true})
            }
            catch(err) {
                console.warn(err)
                dataDispatch({type: 'setConnectedToService', connected: false})
            }
        })()
    }, [])

    useEffect(() => {
        sequencesRef.current = data.sequences
    }, [data.sequences])

    useEffect(() => {
        let canceled = false
        function update() {
            if (canceled) return
            ;(async () => {
                const X = sequencesRef.current.filter(s => (s.updateRequested))
                if (X.length > 0) {
                    const req: GetSequencesRequest = {
                        sequences: X.map(s => ({
                            runId: s.runId, chainId: s.chainId, variableName: s.variableName, position: s.data.length
                        }))
                    }
                    const rr = await fetch(
                        `${serviceBaseUrl}/getSequences`, 
                        {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(req)
                        }
                    )
                    const resp: GetSequencesResponse = await rr.json()
                    for (const s of resp.sequences) {
                        dataDispatch({
                            type: 'appendSequenceData',
                            runId: s.runId,
                            chainId: s.chainId,
                            variableName: s.variableName,
                            position: s.position,
                            data: s.data
                        })
                    }
                }
                setTimeout(() => {
                    update()
                }, 1000)
            })()
        }
        update()
        return () => {canceled = true}
    }, [])

    return (
        <MCMCMonitorContext.Provider value={value}>
            {children}
        </MCMCMonitorContext.Provider>
    )
}

export default SetupMCMCMonitor