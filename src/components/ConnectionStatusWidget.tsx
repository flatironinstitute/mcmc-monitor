import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import { serviceBaseUrl, webrtcConnectionToService } from "../config";
import Hyperlink from "./Hyperlink";

type Props = any

const ConnectionStatusWidget: FunctionComponent<Props> = () => {
    const {usingProxy, connectedToService, checkConnectionStatus} = useMCMCMonitor()

    const checkButton = (
        <div><Hyperlink onClick={checkConnectionStatus}>Check connection status</Hyperlink></div>
    )

    if (!connectedToService) {
        return (
            <div>
                <div style={{color: 'darkred'}}>Not connected to service: {serviceBaseUrl}</div>
                {checkButton}
            </div>
        )
    }

    return (
        <div>
            <div style={{color: "darkgreen"}}>Connected to service: {serviceBaseUrl}</div>
            <div>&nbsp;</div>
            {
                usingProxy ? (
                    <div>- Using proxy</div>
                ) : (
                    <div>- Not using proxy</div>
                )
            }
            {
                webrtcConnectionToService === undefined ? (
                    <div>- Not using WebRTC</div>
                ) : webrtcConnectionToService.status === 'pending' ? (
                    <div>- WebRTC connection pending, using HTTP in the meantime</div>
                ) : webrtcConnectionToService.status === 'error' ? (
                    <div>- WebRTC connection error--using HTTP fallback</div>
                ) : webrtcConnectionToService.status === 'connected' ? (
                    <div>- Connected using WebRTC</div>
                ) : <span />
            }
            <div>&nbsp;</div>
            {checkButton}
        </div>
    )
}

export default ConnectionStatusWidget
