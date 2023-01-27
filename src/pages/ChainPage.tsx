import { FunctionComponent, useEffect, useMemo } from "react";
import Hyperlink from "../components/Hyperlink";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { MCMCChain } from "../MCMCMonitorTypes";
import useRoute from "../useRoute";
import useWindowDimensions from "../useWindowDimensions";

type Props = {
	runId: string
	chainId: string
}

const ChainPage: FunctionComponent<Props> = ({runId, chainId}) => {
	const {chains, updateChainsForRun} = useMCMCMonitor()

	useEffect(() => {
		updateChainsForRun(runId)
	}, [runId, updateChainsForRun])

	const chain: MCMCChain | undefined = useMemo(() => (chains.filter(c => (c.runId === runId && c.chainId === chainId))[0]), [chains, runId, chainId])

	const {width, height} = useWindowDimensions()

	const {setRoute} = useRoute()

	if (!chain) return <span>Chain not found: {runId}/{chainId}</span>
	return (
		<div style={{position: 'absolute', width: width - 40, margin: 20, overflowX: 'auto', overflowY: 'hidden'}}>
			<Hyperlink onClick={() => setRoute({page: 'run', runId})}>Back to run</Hyperlink>
			<h2>Chain: {runId}/{chainId}</h2>
			<div>Variables: {`${chain.variableNames.join(', ')}`}</div>
			<h3>Raw header</h3>
			<div style={{position: 'relative', overflowX: 'auto'}}>
				<pre>{chain.rawHeader || ''}</pre>
			</div>
		</div>
	)
}

export default ChainPage
