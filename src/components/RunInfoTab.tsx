import { Grid } from "@mui/material";
import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";
import SequenceHistogram from "./SequenceHistogram";
import SequencePlot from "./SequencePlot";

type Props = {
	runId: string
	width: number
	height: number
}

const RunInfoTab: FunctionComponent<Props> = ({runId, width, height}) => {
	const {chains} = useMCMCMonitor()

	const chainsForRun = useMemo(() => (chains.filter(c => (c.runId === runId))), [chains, runId])

	return (
		<div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
			{
				chainsForRun.map(chain => (
					<div key={chain.chainId}>
						<h1>Chain: {chain.chainId}</h1>
						<h3>Variables</h3>
						<div>{`${chain.variableNames.join(', ')}`}</div>
						<Grid container spacing={5}>
							<Grid item>
								<h3>Raw header</h3>
								<div style={{position: 'relative', maxWidth: 800, maxHeight: 400, overflow: 'auto'}}>
									<pre>{chain.rawHeader || ''}</pre>
								</div>
							</Grid>
							<Grid item>
								<h3>Raw footer</h3>
								<div style={{position: 'relative', maxWidth: 800, maxHeight: 400, overflow: 'auto'}}>
									<pre>{chain.rawFooter || ''}</pre>
								</div>
							</Grid>
						</Grid>
					</div>
				))
			}		
		</div>
	)
}

export default RunInfoTab
