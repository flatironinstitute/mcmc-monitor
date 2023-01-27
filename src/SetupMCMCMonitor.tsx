import { FunctionComponent, PropsWithChildren, useMemo, useReducer } from "react"
import { initialMCMCMonitorData, MCMCMonitorContext, mcmcMonitorReducer } from "./MCMCMonitorData"

const SetupMCMCMonitor: FunctionComponent<PropsWithChildren> = ({children}) => {
    const [data, dataDispatch] = useReducer(mcmcMonitorReducer, initialMCMCMonitorData)

    const value = useMemo(() => ({
        data,
        dispatch: dataDispatch
    }), [data, dataDispatch])

    return (
        <MCMCMonitorContext.Provider value={value}>
            {children}
        </MCMCMonitorContext.Provider>
    )
}

export default SetupMCMCMonitor