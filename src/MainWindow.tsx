import { FunctionComponent, useEffect } from "react";
import { useMCMCMonitor } from "./MCMCMonitorData";
import ChainPage from "./pages/ChainPage";
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

	return (
		<div>
			{
				route.page === 'home' ? (
					<Home />
				) : route.page === 'run' ? (
					<RunPage runId={route.runId} />
				) : route.page === 'chain' ? (
					<ChainPage runId={route.runId} chainId={route.chainId} />
				) : <span />
			}
		</div>
	)
}

export default MainWindow
