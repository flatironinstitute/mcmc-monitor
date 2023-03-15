import { Dispatch, FunctionComponent, PropsWithChildren, SetStateAction, useCallback, useEffect, useMemo, useReducer, useState } from "react"
import { ProbeRequest, isProbeResponse, protocolVersion } from "../service/src/types/MCMCMonitorRequest"
import { MCMCMonitorContext, initialMCMCMonitorData, mcmcMonitorReducer } from "./MCMCMonitorDataManager/MCMCMonitorData"
import MCMCDataManager from "./MCMCMonitorDataManager/MCMCMonitorDataManager"
import { useWebrtc, webrtcConnectionToService } from "./config"
import postApiRequest from "./postApiRequest"

type SetupMcmcMonitorProps = {
    dataManager: MCMCDataManager | undefined
    setDataManager: Dispatch<SetStateAction<MCMCDataManager | undefined>>
}

const SetupMCMCMonitor: FunctionComponent<PropsWithChildren<SetupMcmcMonitorProps>> = (props: PropsWithChildren<SetupMcmcMonitorProps>) => {
    const { children, dataManager, setDataManager } = props
    const [data, dataDispatch] = useReducer(mcmcMonitorReducer, initialMCMCMonitorData)
    const [usingProxy, setUsingProxy] = useState<boolean | undefined>(undefined)

    // instantiate the data manager
    useEffect(() => {
        // should only be instantiated once
        const dm = new MCMCDataManager(dataDispatch)
        setDataManager(dm)
    }, [dataDispatch, setDataManager])


    // every time data changes, the dataManager needs to get the updated data
    useEffect(() => {
        dataManager && dataManager.setData(data)
    }, [data, dataManager])

    const [connectionCheckRefreshCode, setConnectionCheckRefreshCode] = useState(0)
    const checkConnectionStatus = useCallback(() => {
        setConnectionCheckRefreshCode(c => (c + 1))
    }, [])

    const value = useMemo(() => ({
        data,
        dispatch: dataDispatch,
        checkConnectionStatus
    }), [data, dataDispatch, checkConnectionStatus])

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
                setWebrtcConnectionStatus(ss)
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

    useEffect(() => {
        dataDispatch({type: 'setUsingProxy', usingProxy})
    }, [usingProxy])

    // check whether we are connected
    useEffect(() => {
        if ((webrtcConnectionStatus === 'connected') || (webrtcConnectionStatus === 'unused')) {
            // the following line causes some undesired effects in the GUI when clicking the "check connection status" button
            // dataDispatch({type: 'setConnectedToService', connected: undefined})

            setUsingProxy(undefined)
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
                    setUsingProxy(resp.proxy ? true : false)
                    dataDispatch({type: 'setServiceProtocolVersion', version: resp.protocolVersion})
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
    }, [webrtcConnectionStatus, connectionCheckRefreshCode])

    return (
        <MCMCMonitorContext.Provider value={value}>
            {children}
        </MCMCMonitorContext.Provider>
    )
}

export default SetupMCMCMonitor