import { Dispatch, FunctionComponent, PropsWithChildren, SetStateAction, useCallback, useEffect, useMemo, useReducer, useState } from "react"
import { ProbeRequest, isProbeResponse, protocolVersion } from "../../service/src/types"
import postApiRequest from "../networking/postApiRequest"
import { MCMCMonitorContext, initialMCMCMonitorData, mcmcMonitorReducer } from "./MCMCMonitorData"
import MCMCDataManager from "./MCMCMonitorDataManager"

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

    useEffect(() => {
        dataDispatch({type: 'setUsingProxy', usingProxy})
    }, [usingProxy])

    // check whether we are connected
    // TODO: consider alternate mechanism for refresh other than manual check-again button
    useEffect(() => {
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
    }, [connectionCheckRefreshCode])

    return (
        <MCMCMonitorContext.Provider value={value}>
            {children}
        </MCMCMonitorContext.Provider>
    )
}

export default SetupMCMCMonitor