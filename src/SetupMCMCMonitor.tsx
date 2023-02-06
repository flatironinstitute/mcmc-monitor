import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer, useState } from "react"
import { serviceBaseUrl } from "./config"
import { initialMCMCMonitorData, MCMCMonitorContext, mcmcMonitorReducer } from "./MCMCMonitorDataManager/MCMCMonitorData"
import MCMCDataManager from "./MCMCMonitorDataManager/MCMCMonitorDataManager"
import { isProbeResponse, ProbeRequest, protocolVersion } from "./MCMCMonitorRequest"

const SetupMCMCMonitor: FunctionComponent<PropsWithChildren> = ({children}) => {
    const [data, dataDispatch] = useReducer(mcmcMonitorReducer, initialMCMCMonitorData)
    const [dataManager, setDataManager] = useState<MCMCDataManager | undefined>()

    // instantiate the data manager
    useEffect(() => {
        // should only be instantiated once
        const dm = new MCMCDataManager(dataDispatch)
        dm.start()
        setDataManager(dm)
        return () => {
            dm.stop()
        }
    }, [dataDispatch])


    // every time data changes, the dataManager needs to get the updated data
    useEffect(() => {
        dataManager && dataManager.setData(data)
    }, [data, dataManager])

    const value = useMemo(() => ({
        data,
        dispatch: dataDispatch
    }), [data, dataDispatch])

    // check whether we are connected
    useEffect(() => {
        ;(async () => {
            try {
                const req: ProbeRequest = {
                    type: 'probeRequest'
                }
                const rr = await fetch(
                    `${serviceBaseUrl}/api`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(req)
                    }
                )
                const resp = await rr.json()
                if (!isProbeResponse(resp)) {
                    console.warn(resp)
                    throw Error('Unexpected probe response')
                }
                if (resp.protocolVersion !== protocolVersion) {
                    throw Error(`Unexpected protocol version: ${resp.protocolVersion} <> ${protocolVersion}`)
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