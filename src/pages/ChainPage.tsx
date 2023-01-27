import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { MCMCChain } from "../MCMCMonitorTypes";

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

	if (!chain) return <span>Chain not found: {runId}/{chainId}</span>
	return (
		<div>
			<h3>Chain: {runId}/{chainId}</h3>
			<p>Variables: {`${chain.variableNames.join(', ')}`} </p>
			<h3>Raw header</h3>
			<div style={{position: 'relative', width: '100%', height: 800, overflow: 'auto'}}>
				<pre>{chain.rawHeader || ''}</pre>
			</div>
		</div>
	)
}

export default ChainPage
