import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer } from "react"
import { serviceBaseUrl } from "./config"
import { initialMCMCMonitorData, MCMCMonitorContext, mcmcMonitorReducer } from "./MCMCMonitorData"
import { protocolVersion } from "./MCMCMonitorTypes"

const SetupMCMCMonitor: FunctionComponent<PropsWithChildren> = ({children}) => {
    const [data, dataDispatch] = useReducer(mcmcMonitorReducer, initialMCMCMonitorData)

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

    return (
        <MCMCMonitorContext.Provider value={value}>
            {children}
        </MCMCMonitorContext.Provider>
    )
}

export default SetupMCMCMonitor