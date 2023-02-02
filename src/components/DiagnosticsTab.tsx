import { Checkbox, FormControlLabel, Grid } from "@mui/material";
import { FunctionComponent, useMemo, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import AutocorrelationPlot from "./AutocorrelationPlot";
import SequenceHistogram from "./SequenceHistogram";
import SequencePlot from "./SequencePlot";

type Props = {
	runId: string
	numIterationsForRun: number
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

export const useSequenceHistogramIterationRange = (numIterationsForRun: number) => {
	const {sequenceHistogramOpts} = useMCMCMonitor()

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

	return sequenceHistogramIterationRange
}

type DiagnosticsSelection = {
	timeseries: boolean
	histogram: boolean
	acf: boolean
}

const initialDiagnosticsSelection: DiagnosticsSelection = {
	timeseries: true,
	histogram: true,
	acf: true
}

const Diagnostics: FunctionComponent<Props> = ({runId, numIterationsForRun, chainColors, width, height}) => {
	const {selectedVariableNames, selectedChainIds, sequenceHistogramOpts} = useMCMCMonitor()

	const sequenceHistogramIterationRange = useSequenceHistogramIterationRange(numIterationsForRun)

	const [diagnosticsSelection, setDiagnosticsSelection] = useState<DiagnosticsSelection>(initialDiagnosticsSelection)

	return (
		<div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
			<DiagnosticsSelectionSelector diagnosticsSelection={diagnosticsSelection} setDiagnosticsSelection={setDiagnosticsSelection} />
			{
				selectedVariableNames.map(v => (
					<div key={v}>
						<div style={{position: 'relative', border: 'solid 2px gray', paddingLeft: 12}}>
							<h2>{v}</h2>
							<Grid container spacing={3}>
								<Grid item key="sequence-plot">
									{diagnosticsSelection.timeseries && <SequencePlot
										runId={runId}
										chainIds={selectedChainIds}
										chainColors={chainColors}
										variableName={v}
										highlightIterationRange={sequenceHistogramIterationRange}
										width={Math.min(width, 700)}
										height={400}
									/>}
								</Grid>
								{
									diagnosticsSelection.histogram && selectedChainIds.map(chainId => (
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
								{
									diagnosticsSelection.acf && selectedChainIds.map(chainId => (
										<Grid item key={chainId}>
											<AutocorrelationPlot
												runId={runId}
												chainId={chainId}
												variableName={v}
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

const selectorItems = [
	{
		key: 'timeseries',
		label: 'show timeseries'
	},
	{
		key: 'histogram',
		label: 'show histogram'
	},
	{
		key: 'acf',
		label: 'show ACF'
	}
]

const DiagnosticsSelectionSelector: FunctionComponent<{diagnosticsSelection: DiagnosticsSelection, setDiagnosticsSelection: (a: DiagnosticsSelection) => void}> = ({diagnosticsSelection, setDiagnosticsSelection}) => {
	return (
		<div>
			{
				selectorItems.map(item => (
					<FormControlLabel
						key={item.key}
						control={
							<Checkbox
								checked={(diagnosticsSelection as any)[item.key]}
								onClick={() => setDiagnosticsSelection({...diagnosticsSelection, [item.key]: !(diagnosticsSelection as any)[item.key]})}
							/>
						}
						label={item.label}
					/>
				))
			}
		</div>
	)
}

export default Diagnostics
