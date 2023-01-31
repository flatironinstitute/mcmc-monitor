import { Grid, Select, SelectChangeEvent, MenuItem } from "@mui/material";
import { FunctionComponent, useMemo, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { useSequenceHistogramIterationRange } from "./ConvergenceTab";
import SequenceScatterplot from "./SequenceScatterplot";
import SequenceScatterplot3D from "./SequenceScatterplot3D";

type Props = {
	runId: string
	numIterationsForRun: number
	width: number
	height: number
}

type Mode = '2d' | '3d' | 'both'

const ScatterplotsTab: FunctionComponent<Props> = ({ runId, numIterationsForRun, width, height }) => {
	const { selectedVariableNames, selectedChainIds } = useMCMCMonitor()

	const [mode, setMode] = useState<Mode>('2d')

	const sequenceHistogramIterationRange = useSequenceHistogramIterationRange(numIterationsForRun)

	const variablePairs = useMemo(() => {
		const ret: { v1: string, v2: string }[] = []
		for (let i = 0; i < selectedVariableNames.length; i++) {
			for (let j = i + 1; j < selectedVariableNames.length; j++) {
				ret.push({ v1: selectedVariableNames[i], v2: selectedVariableNames[j] })
			}
		}
		return ret
	}, [selectedVariableNames])

	const variableTriplets = useMemo(() => {
		const ret: { v1: string, v2: string, v3: string }[] = []
		for (let i = 0; i < selectedVariableNames.length; i++) {
			for (let j = i + 1; j < selectedVariableNames.length; j++) {
				for (let k = j + 1; k < selectedVariableNames.length; k++) {
					ret.push({ v1: selectedVariableNames[i], v2: selectedVariableNames[j], v3: selectedVariableNames[k] })
				}
			}
		}
		return ret
	}, [selectedVariableNames])

	return (
		<div style={{ position: 'absolute', width, height, overflowY: 'auto' }}>
			<ModeSelector mode={mode} setMode={setMode} />
			{
				(variablePairs.length === 0) ? (
					<div>Select 2 or more variables to view scatter plots</div>
				) : ((mode === '3d') && (variableTriplets.length === 0)) ? (
					<div>Select 3 or more variables to view 3D scatter plots</div>
				) : (
					<Grid container spacing={3}>
						{
							['2d', 'both'].includes(mode) && variablePairs.map(({ v1, v2 }, ii) => (
								<Grid item key={ii}>
									<SequenceScatterplot
										runId={runId}
										chainIds={selectedChainIds}
										xVariableName={v1}
										yVariableName={v2}
										highlightIterationRange={sequenceHistogramIterationRange}
										width={400}
										height={400}
									/>

								</Grid>
							))
						}
						{
							['3d', 'both'].includes(mode) && variableTriplets.map(({ v1, v2, v3 }, ii) => (
								<Grid item key={ii}>
									<SequenceScatterplot3D
										runId={runId}
										chainIds={selectedChainIds}
										xVariableName={v1}
										yVariableName={v2}
										zVariableName={v3}
										highlightIterationRange={sequenceHistogramIterationRange}
										width={700}
										height={700}
									/>
								</Grid>
							))
						}
					</Grid>
				)
			}
			<div>&nbsp;</div>
		</div>
	)
}

const ModeSelector: FunctionComponent<{ mode: Mode, setMode: (m: Mode) => void }> = ({ mode, setMode }) => {
	return (
		<Select
			value={mode}
			onChange={(evt: SelectChangeEvent<string>) => { setMode(evt.target.value as Mode) }}
		>
			<MenuItem key="2d" value={'2d'}>2D scatterplots</MenuItem>
			<MenuItem key="3d" value={'3d'}>3D scatterplots</MenuItem>
			<MenuItem key="both" value={'both'}>2D and 3D scatterplots</MenuItem>
		</Select>
	)
}

export default ScatterplotsTab
