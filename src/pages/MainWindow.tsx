import { Fragment, FunctionComponent, PropsWithChildren, useEffect } from "react";
import { protocolVersion } from "../../service/src/types/MCMCMonitorRequest";
import MCMCDataManager from "../MCMCMonitorDataManager/MCMCMonitorDataManager";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import Hyperlink from "../components/Hyperlink";
import { defaultServiceBaseUrl, exampleServiceBaseUrl, serviceBaseUrl, useWebrtc } from "../config";
import useRoute from "../util/useRoute";
import Home from "./Home";
import Logo from "./Logo";
import RunPage from "./RunPage";


type Props = {
    dataManager: MCMCDataManager | undefined
}

const MainWindow: FunctionComponent<Props> = (props: Props) => {
    const { dataManager } = props
	const { route } = useRoute()
	const { updateRuns, serviceProtocolVersion } = useMCMCMonitor()
	useEffect(() => {
		updateRuns()
	}, [updateRuns])

	const {connectedToService, webrtcConnectionStatus} = useMCMCMonitor()

	if (webrtcConnectionStatus === 'error') {
        return <WebRtcError />
	}

	if (connectedToService === undefined) {
        return <ConnectionInProgress />
	}

	if (connectedToService === false) {
		return (
            <LogoFrame>
                <FailedConnection serviceProtocolVersion={serviceProtocolVersion} />
            </LogoFrame>
		)
	}

    switch (route.page) {
        case "home":
            return (
                <LogoFrame>
                    <Home />
                </LogoFrame>
            )
            break
        case "run":
            return <RunPage runId={route.runId} dataManager={dataManager} />
            break
        default:
            return <span />
    }
}

const WebRtcError: FunctionComponent = () => {
    return (
        <div>Unable to connect to service using WebRTC: {serviceBaseUrl}</div>
    )
}

const ConnectionInProgress: FunctionComponent = () => {
    return (
        <div>Connecting to service{useWebrtc ? ' using WebRTC' : ''}: {serviceBaseUrl}</div>
    )
}

const LogoFrame: FunctionComponent<PropsWithChildren> = ({children}) => {
    return (
        <div style={{margin: 60}}>
            <Logo />
            <h3>WIP</h3>
            {children}
            <hr />
            <GithubLink />
        </div>
    )
}

type FailedConnectionProps = {
    serviceProtocolVersion: string | undefined
}

const FailedConnection: FunctionComponent<FailedConnectionProps> = (props: FailedConnectionProps) => {
    const { serviceProtocolVersion } = props
    return (
        <Fragment>
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
        </Fragment>
    )
}

const GithubLink: FunctionComponent = () => {
    return <Fragment>
        <div style={{margin: 25}}>
            <span>
                To report issues, make suggestions, or check for updates, please visit <Hyperlink
                    onClick={() => {;(window as any).location = "https://github.com/flatironinstitute/mcmc-monitor"}}
                >the project Github repository</Hyperlink>.
            </span>
        </div>
    </Fragment>
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
        <div><span style={{fontWeight: "bolder"}}>PROTOCOL MISMATCH:</span> Connected service is running protocol version {serviceProtocol} while we expect {expectedProtocol}.
        Please contact the service administrator and request that they upgrade.
        </div>
    </div>
}

export default MainWindow
