import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer, useRef } from "react"
import { serviceBaseUrl } from "./config"
import { initialMCMCMonitorData, MCMCMonitorContext, mcmcMonitorReducer } from "./MCMCMonitorDataManager/MCMCMonitorData"
import MCMCDataManager from "./MCMCMonitorDataManager/MCMCMonitorDataManager"
import { GetSequencesRequest, GetSequencesResponse, MCMCSequence, protocolVersion } from "./MCMCMonitorDataManager/MCMCMonitorTypes"

const SetupMCMCMonitor: FunctionComponent<PropsWithChildren> = ({children}) => {
    const [data, dataDispatch] = useReducer(mcmcMonitorReducer, initialMCMCMonitorData)
    const sequencesRef = useRef<MCMCSequence[]>(data.sequences)

    const dataManager = useMemo(() => (
        // should only be instantiated once
        new MCMCDataManager(dataDispatch)
    ), [dataDispatch])

    useEffect(() => {
        // every time data changes, the dataManager needs to get the updated data
        dataManager.setData(data)
    }, [data, dataManager])

    useEffect(() => {
        // start iterating the data manager
        let canceled = false
        function iter() {
            setTimeout(() => {
                if (canceled) return
                dataManager.iterate()
                iter()
            }, 1000)
        }
        iter()
        return () => {canceled = true}
    }, [dataManager])

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

    return (
        <MCMCMonitorContext.Provider value={value}>
            {children}
        </MCMCMonitorContext.Provider>
    )
}

export default SetupMCMCMonitor