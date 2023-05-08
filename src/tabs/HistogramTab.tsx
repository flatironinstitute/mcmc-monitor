import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import { Checkbox, FormControlLabel, Grid, IconButton } from "@mui/material";
import { FunctionComponent, useMemo, useReducer, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import SequenceHistogram from "../components/SequenceHistogram";
import { PlotSize, PlotSizeSelector } from "./ScatterplotsTab";

type Props = {
	runId: string
	numDrawsForRun: number
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

export const useSequenceDrawRange = (numDrawsForRun: number) => {
	const {effectiveInitialDrawsToExclude} = useMCMCMonitor()

	const sequenceDrawRange: [number, number] | undefined = useMemo(() => {
		return [Math.min(effectiveInitialDrawsToExclude, numDrawsForRun), numDrawsForRun]
	}, [numDrawsForRun, effectiveInitialDrawsToExclude])

	return sequenceDrawRange
}

// Todo: repurpose this for whether or not to display the warmup iterations
// as part of the graphs
type DiagnosticsSelection = {
	histogram: boolean
}

const initialDiagnosticsSelection: DiagnosticsSelection = {
	histogram: true,
}

type CollapsedVariablesState = {[variableName: string]: boolean}

type CollapsedVariablesAction = {
	type: 'toggle'
	variableName: string
}

const collapsedVariablesReducer = (s: CollapsedVariablesState, a: CollapsedVariablesAction): CollapsedVariablesState => {
	if (a.type === 'toggle') {
		return {
			...s,
			[a.variableName]: s[a.variableName] ? false : true
		}
	}
	else return s
}

const Diagnostics: FunctionComponent<Props> = ({runId, numDrawsForRun, width, height}) => {
	const {selectedVariableNames, selectedChainIds} = useMCMCMonitor()

	const [collapsedVariables, collapsedVariablesDispatch] = useReducer(collapsedVariablesReducer, {})

	const sequenceHistogramDrawRange = useSequenceDrawRange(numDrawsForRun)

	const [diagnosticsSelection, setDiagnosticsSelection] = useState<DiagnosticsSelection>(initialDiagnosticsSelection)

	const [plotSize, setPlotSize] = useState<PlotSize>('medium')

	const sizeScale = plotSize === 'small' ? 0.7 : plotSize === 'medium' ? 1 : plotSize === 'large' ? 1.3 : plotSize === 'xlarge' ? 1.6 : 1

	return (
		<div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
			<Grid container>
				<DiagnosticsSelectionSelector diagnosticsSelection={diagnosticsSelection} setDiagnosticsSelection={setDiagnosticsSelection} />
				<PlotSizeSelector plotSize={plotSize} setPlotSize={setPlotSize} />
			</Grid>
			{
				selectedVariableNames.map(v => (
					<div key={v}>
						<div style={{position: 'relative', border: 'solid 2px gray', paddingLeft: 12}}>
							<h2>
								<CollapseControl collapsed={collapsedVariables[v]} onToggle={() => collapsedVariablesDispatch({type: 'toggle', variableName: v})} />
								{v}
							</h2>
							{
								!collapsedVariables[v] &&
								<Grid container spacing={3}>
									{
										// histograms for individual chains
										selectedChainIds.map(chainId => (
											<Grid item key={chainId}>
												<SequenceHistogram
													runId={runId}
													chainId={chainId}
													title={chainId}
													variableName={v}
													drawRange={sequenceHistogramDrawRange}
													width={Math.min(width, 300 * sizeScale)}
													height={450 * sizeScale}
												/>
											</Grid>
										))
									}
									{
										// histogram for all chains
                                        <Grid item key={"___all_chains"}>
                                            <SequenceHistogram
                                                runId={runId}
                                                chainId={selectedChainIds}
                                                title="All selected chains"
                                                variableName={v}
                                                drawRange={sequenceHistogramDrawRange}
                                                width={Math.min(width, 300 * sizeScale)}
                                                height={450 * sizeScale}
                                            />
                                        </Grid>
									}
								</Grid>
							}
						</div>
						<div>&nbsp;</div>
					</div>
				))
			}
			<div>&nbsp;</div>
		</div>
	)
}

const CollapseControl: FunctionComponent<{collapsed: boolean, onToggle: () => void}> = ({collapsed, onToggle}) => {
	if (collapsed) {
		return <IconButton onClick={onToggle}><KeyboardArrowRight /></IconButton>
	}
	else {
		return <IconButton onClick={onToggle}><KeyboardArrowDown /></IconButton>
	}
}

const selectorItems = [
	{
		key: 'timeseries',
		label: 'show timeseries'
	},
	{
		key: 'histogram',
		label: 'show histograms'
	},
	{
		key: 'acf',
		label: 'show ACFs'
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
