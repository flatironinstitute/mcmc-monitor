import { FunctionComponent, useEffect } from "react";
import { protocolVersion } from "../service/src/types/MCMCMonitorRequest";
import Logo from "./Logo";
import Hyperlink from "./components/Hyperlink";
import { defaultServiceBaseUrl, exampleServiceBaseUrl, serviceBaseUrl, useWebrtc } from "./config";
import Home from "./pages/Home";
import RunPage from "./pages/RunPage";
import { useMCMCMonitor } from "./useMCMCMonitor";
import useRoute from "./useRoute";


type Props = any

const MainWindow: FunctionComponent<Props> = () => {
	const { route } = useRoute()
	const { updateRuns, serviceProtocolVersion } = useMCMCMonitor()

	useEffect(() => {
		updateRuns()
	}, [updateRuns])

	const {connectedToService, webrtcConnectionStatus} = useMCMCMonitor()

	if (webrtcConnectionStatus === 'error') {
		return (
			<div>Unable to connect to service using WebRTC: {serviceBaseUrl}</div>
		)
	}

	if (connectedToService === undefined) {
		return (
			<div>Connecting to service{useWebrtc ? ' using WebRTC' : ''}: {serviceBaseUrl}</div>
		)
	}

	if (connectedToService === false) {
		return (
			<div style={{margin: 60}}>
				<Logo />
				<hr />
				<div style={{color: 'darkred'}}>Not connected to service {serviceBaseUrl}</div>
                <ProtocolCheck expectedProtocol={protocolVersion} serviceProtocol={serviceProtocolVersion} />
				<hr />
				<div>
					{
						serviceBaseUrl !== exampleServiceBaseUrl && (
							<Hyperlink
								onClick={() => {;(window as any).location = `${window.location.protocol}//${window.location.host}${window.location.pathname}?s=${exampleServiceBaseUrl}`}}
							>View example data</Hyperlink>
						)
					}
				</div>
				{
					serviceBaseUrl === defaultServiceBaseUrl && (
						<p><a href="https://github.com/flatironinstitute/mcmc-monitor" target="_blank" rel="noreferrer">How to run a local service</a></p>
					)
				}
			</div>
		)
	}

	return (
		<div>
			{
				route.page === 'home' ? (
					<Home />
				) : route.page === 'run' ? (
					<RunPage runId={route.runId} />
				) : <span />
			}
		</div>
	)
}

type ProtocolCheckProps = {
    expectedProtocol: string
    serviceProtocol?: string
}

const ProtocolCheck: FunctionComponent<ProtocolCheckProps> = (props: ProtocolCheckProps) => {
    const { expectedProtocol, serviceProtocol } = props
    if (serviceProtocol === undefined || expectedProtocol === serviceProtocol) {
        return <></>
    }
    return <div>
        <hr />
        <div><b>PROTOCOL MISMATCH:</b> Connected service is running protocol version {serviceProtocol} while we expect {expectedProtocol}.
        Please contact the service administrator and request that they upgrade.
        </div>
    </div>
}

export default MainWindow
