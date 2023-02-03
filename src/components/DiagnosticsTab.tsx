import { Checkbox, FormControlLabel, Grid } from "@mui/material";
import { FunctionComponent, useMemo, useState } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";
import AutocorrelationPlot from "./AutocorrelationPlot";
import SequenceHistogram from "./SequenceHistogram";
import SequencePlot from "./SequencePlot";

type Props = {
	runId: string
	numDrawsForRun: number
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

export const useSequenceDrawRange = (numDrawsForRun: number) => {
	const {generalOpts} = useMCMCMonitor()

	const sequenceDrawRange: [number, number] | undefined = useMemo(() => {
		return [Math.min(generalOpts.excludeInitialDraws, numDrawsForRun), numDrawsForRun]
	}, [numDrawsForRun, generalOpts.excludeInitialDraws])

	return sequenceDrawRange
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

const Diagnostics: FunctionComponent<Props> = ({runId, numDrawsForRun, chainColors, width, height}) => {
	const {selectedVariableNames, selectedChainIds} = useMCMCMonitor()

	const sequenceHistogramDrawRange = useSequenceDrawRange(numDrawsForRun)

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
										highlightDrawRange={sequenceHistogramDrawRange}
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
												drawRange={sequenceHistogramDrawRange}
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
												drawRange={sequenceHistogramDrawRange}
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
