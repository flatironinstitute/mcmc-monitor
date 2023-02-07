import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer, useState } from "react"
import { useWebrtc, webrtcConnectionToService } from "./config"
import { initialMCMCMonitorData, MCMCMonitorContext, mcmcMonitorReducer } from "./MCMCMonitorDataManager/MCMCMonitorData"
import MCMCDataManager from "./MCMCMonitorDataManager/MCMCMonitorDataManager"
import { isProbeResponse, ProbeRequest, protocolVersion } from "./MCMCMonitorRequest"
import postApiRequest from "./postApiRequest"

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

    // wait for webrtc connection (if using)
    const [webrtcConnectionStatus, setWebrtcConnectionStatus] = useState<'pending' | 'connected' | 'error' | 'unused'>('pending')
    useEffect(() => {
        let canceled = false
        if (!useWebrtc) {
            setWebrtcConnectionStatus('unused')
            return
        }
        function check() {
            if (canceled) return
            const ss = webrtcConnectionToService?.status || 'pending'
            if ((ss === 'connected') || (ss === 'error')) {
                setWebrtcConnectionStatus('connected')
                return
            }
            setTimeout(() => {
                check()
            }, 100)
        }
        check()
        return () => {canceled = true}
    }, [])

    useEffect(() => {
        dataDispatch({type: 'setWebrtcConnectionStatus', status: webrtcConnectionStatus})
    }, [webrtcConnectionStatus])

    // check whether we are connected
    useEffect(() => {
        if ((webrtcConnectionStatus === 'connected') || (webrtcConnectionStatus === 'unused')) {
            ;(async () => {
                try {
                    const req: ProbeRequest = {
                        type: 'probeRequest'
                    }
                    const resp = await postApiRequest(req)
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
        }
    }, [webrtcConnectionStatus])

    return (
        <MCMCMonitorContext.Provider value={value}>
            {children}
        </MCMCMonitorContext.Provider>
    )
}

export default SetupMCMCMonitor