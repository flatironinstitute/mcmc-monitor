import { Grid } from "@mui/material";
import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import SequenceHistogram from "./SequenceHistogram";
import SequencePlot from "./SequencePlot";

type Props = {
	runId: string
	numIterationsForRun: number
	width: number
	height: number
}

const ConvergenceTab: FunctionComponent<Props> = ({runId, numIterationsForRun, width, height}) => {
	const {selectedVariableNames, selectedChainIds, sequenceHistogramOpts} = useMCMCMonitor()

	const sequenceHistogramIterationRange: [number, number] | undefined = useMemo(() => {
		if (sequenceHistogramOpts.numIterations < 0) {
			return undefined
		}
		else {
			if (numIterationsForRun <= sequenceHistogramOpts.numIterations) {
				return undefined // undefined might be preferable to [0, numIterationsForRun] because it reduces the number of state changes
			}
			else {
				return [numIterationsForRun - sequenceHistogramOpts.numIterations, numIterationsForRun]
			}
		}
	}, [numIterationsForRun, sequenceHistogramOpts.numIterations])

	return (
		<div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
			{
				selectedVariableNames.map(v => (
					<div key={v}>
						<div style={{position: 'relative', border: 'solid 2px gray', paddingLeft: 12}}>
							<h2>{v}</h2>
							<Grid container spacing={3}>
								<Grid item key="sequence-plot">
									<SequencePlot
										runId={runId}
										chainIds={selectedChainIds}
										variableName={v}
										highlightIterationRange={sequenceHistogramIterationRange}
										width={Math.min(width, 700)}
										height={400}
									/>
								</Grid>
								{
									selectedChainIds.map(chainId => (
										<Grid item key={chainId}>
											<SequenceHistogram
												runId={runId}
												chainId={chainId}
												variableName={v}
												sequenceHistogramOpts={sequenceHistogramOpts}
												iterationRange={sequenceHistogramIterationRange}
												width={Math.min(width, 300)}
												height={400}
											/>
										</Grid>
									))
								}
							</Grid>
						</div>
						<div>&nbsp;</div>
					</div>
				))
			}
			<div>&nbsp;</div>
		</div>
	)
}

export default ConvergenceTab
