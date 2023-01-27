import { FunctionComponent, useEffect, useMemo } from "react";
import ChainsTable from "../components/ChainsTable";
import { MCMCRun, useMCMCMonitor } from "../MCMCMonitorData";

type Props = {
	runId: string
}

const RunPage: FunctionComponent<Props> = ({runId}) => {
	const {runs, chains, updateChainsForRun} = useMCMCMonitor()
	console.log('--- chains', chains)

	useEffect(() => {
		updateChainsForRun(runId)
	}, [runId, updateChainsForRun])

	const run: MCMCRun | undefined = useMemo(() => (runs.filter(r => (r.runId === runId))[0]), [runs, runId])

	const chainsForRun = useMemo(() => (chains.filter(c => (c.runId === runId))), [chains, runId])

	if (!run) return <span>Run not found: {runId}</span>
	return (
		<div>
			<h3>Run: {runId}</h3>
			<ChainsTable
				chains={chainsForRun}
			/>
		</div>
	)
}

export default RunPage
