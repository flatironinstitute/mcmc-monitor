import { FunctionComponent, useEffect } from "react";
import Hyperlink from "./components/Hyperlink";
import { defaultServiceBaseUrl, exampleServiceBaseUrl, serviceBaseUrl } from "./config";
import Logo from "./Logo";
import { useMCMCMonitor } from "./MCMCMonitorData";
import Home from "./pages/Home";
import RunPage from "./pages/RunPage";
import useRoute from "./useRoute";

type Props = any

const MainWindow: FunctionComponent<Props> = () => {
	const { route } = useRoute()
	const { updateRuns } = useMCMCMonitor()

	useEffect(() => {
		updateRuns()
	}, [updateRuns])

	const {connectedToService} = useMCMCMonitor()

	if (connectedToService === undefined) {
		return (
			<div>Connecting to service {serviceBaseUrl}</div>
		)
	}

	if (connectedToService === false) {
		
		return (
			<div style={{margin: 60}}>
				<Logo />
				<hr />
				<div>Not connected to service {serviceBaseUrl}</div>
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
						<p><a href="https://github.com/magland/mcmc-monitor" target="_blank" rel="noreferrer">How to run a local service</a></p>
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

export default MainWindow
