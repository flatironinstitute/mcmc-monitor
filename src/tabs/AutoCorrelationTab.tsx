import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import { Checkbox, FormControlLabel, Grid, IconButton } from "@mui/material";
import { FunctionComponent, useReducer, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import AutocorrelationPlot from "../components/AutocorrelationPlot";
import { useSequenceDrawRange } from "./DiagnosticsTab";
import { PlotSize, PlotSizeSelector } from "./ScatterplotsTab";

type Props = {
	runId: string
	numDrawsForRun: number
	width: number
	height: number
}

// Todo: repurpose this for whether or not to display the warmup iterations
// as part of the dataset
type DiagnosticsSelection = {
	acf: boolean
}

const initialDiagnosticsSelection: DiagnosticsSelection = {
	acf: true,
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
										selectedChainIds.map(chainId => (
											<Grid item key={chainId}>
												<AutocorrelationPlot
													runId={runId}
													chainId={chainId}
													variableName={v}
													drawRange={sequenceHistogramDrawRange}
													width={Math.min(width, 300 * sizeScale)}
													height={450 * sizeScale}
												/>
											</Grid>
										))
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
