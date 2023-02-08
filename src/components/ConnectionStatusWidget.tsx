import { FunctionComponent } from "react";
import { serviceBaseUrl } from "../config";
import { useMCMCMonitor } from "../useMCMCMonitor";
import Hyperlink from "./Hyperlink";

type Props = any

const ConnectionStatusWidget: FunctionComponent<Props> = () => {
	const {usingProxy, connectedToService, webrtcConnectionStatus, checkConnectionStatus} = useMCMCMonitor()

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
				webrtcConnectionStatus === 'connected' ? (
					<div>- Connected using WebRTC</div>
				) : webrtcConnectionStatus === 'pending' ? (
					<div>- WebRTC connection pending</div>
				) : webrtcConnectionStatus === 'error' ? (
					<div>- WebRTC connection error</div>
				) : webrtcConnectionStatus === 'unused' ? (
					<div>- Not using WebRTC</div>
				) : <span />
			}
            <div>&nbsp;</div>
            {checkButton}
		</div>
	)
}

export default ConnectionStatusWidget
