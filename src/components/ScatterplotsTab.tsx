import { Grid, Select, SelectChangeEvent, MenuItem, FormControl } from "@mui/material";
import { FunctionComponent, useMemo, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { useSequenceHistogramIterationRange } from "./DiagnosticsTab";
import SequenceScatterplot from "./SequenceScatterplot";
import SequenceScatterplot3D from "./SequenceScatterplot3D";

type Props = {
	runId: string
	numIterationsForRun: number
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

type Mode = '2d' | '3d' | 'both'

type PlotSize = 'small' | 'medium' | 'large' | 'xlarge'

function sizeForPlotSize(ps: PlotSize) {
	if (ps === 'small') return { x: 200, y: 200 }
	else if (ps === 'medium') return { x: 400, y: 400 }
	else if (ps === 'large') return { x: 700, y: 700 }
	else if (ps === 'xlarge') return { x: 1000, y: 1000 }
	else return { x: 400, y: 400 }
}

function sizeForPlotSize3D(ps: PlotSize) {
	if (ps === 'small') return { x: 300, y: 300 }
	else if (ps === 'medium') return { x: 600, y: 600 }
	else if (ps === 'large') return { x: 1000, y: 1000 }
	else if (ps === 'xlarge') return { x: 1500, y: 1500 }
	else return { x: 600, y: 600 }
}

const ScatterplotsTab: FunctionComponent<Props> = ({ runId, numIterationsForRun, chainColors, width, height }) => {
	const { selectedVariableNames, selectedChainIds } = useMCMCMonitor()

	const [mode, setMode] = useState<Mode>('2d')
	const [plotSize, setPlotSize] = useState<PlotSize>('medium')
	const [tooMany, setTooMany] = useState(false)
	const [tooMany3D, setTooMany3D] = useState(false)

	const sequenceHistogramIterationRange = useSequenceHistogramIterationRange(numIterationsForRun)

	const variablePairs = useMemo(() => {
		let ret: { v1: string, v2: string }[] = []
		for (let i = 0; i < selectedVariableNames.length; i++) {
			for (let j = i + 1; j < selectedVariableNames.length; j++) {
				ret.push({ v1: selectedVariableNames[i], v2: selectedVariableNames[j] })
			}
		}
		if (ret.length > 20) {
			ret = ret.slice(0, 20)
			setTooMany(true)
		}
		else setTooMany(false)
		return ret
	}, [selectedVariableNames])

	const variableTriplets = useMemo(() => {
		let ret: { v1: string, v2: string, v3: string }[] = []
		for (let i = 0; i < selectedVariableNames.length; i++) {
			for (let j = i + 1; j < selectedVariableNames.length; j++) {
				for (let k = j + 1; k < selectedVariableNames.length; k++) {
					ret.push({ v1: selectedVariableNames[i], v2: selectedVariableNames[j], v3: selectedVariableNames[k] })
				}
			}
		}
		if (ret.length > 10) {
			ret = ret.slice(0, 10)
			setTooMany3D(true)
		}
		else setTooMany3D(false)
		return ret
	}, [selectedVariableNames])

	return (
		<div style={{ position: 'absolute', width, height }}>
			&nbsp;
			<Grid container>
				<ModeSelector mode={mode} setMode={setMode} />
				&nbsp;
				<PlotSizeSelector plotSize={plotSize} setPlotSize={setPlotSize} />
			</Grid>
			<div style={{ position: 'absolute', top: 70, width, height: height - 100, overflowY: 'auto' }}>
				{
					tooMany && (mode === '2d' || mode === 'both') && (
						<div>Too many variables selected, only showing first 20 plots.</div>
					)
				}
				{
					tooMany3D && (mode === '3d' || mode === 'both') && (
						<div>Too many variables selected, only showing first 10 3D plots.</div>
					)
				}
				{
					(variablePairs.length === 0) ? (
						<div>Select 2 or more variables to view scatterplots</div>
					) : ((mode === '3d') && (variableTriplets.length === 0)) ? (
						<div>Select 3 or more variables to view 3D scatterplots</div>
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
											chainColors={chainColors}
											width={sizeForPlotSize(plotSize).x}
											height={sizeForPlotSize(plotSize).y}
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
											chainColors={chainColors}
											width={sizeForPlotSize3D(plotSize).x}
											height={sizeForPlotSize3D(plotSize).y}
										/>
									</Grid>
								))
							}
						</Grid>
					)
				}
				<div>&nbsp;</div>
				<div>&nbsp;</div>
				<div>&nbsp;</div>
			</div>
		</div>
	)
}

const ModeSelector: FunctionComponent<{ mode: Mode, setMode: (m: Mode) => void }> = ({ mode, setMode }) => {
	return (
		<FormControl size="small">
			<Select
				value={mode}
				onChange={(evt: SelectChangeEvent<string>) => { setMode(evt.target.value as Mode) }}
			>
				<MenuItem key="2d" value={'2d'}>2D scatterplots</MenuItem>
				<MenuItem key="3d" value={'3d'}>3D scatterplots</MenuItem>
				<MenuItem key="both" value={'both'}>2D and 3D scatterplots</MenuItem>
			</Select>
		</FormControl>
	)
}

const PlotSizeSelector: FunctionComponent<{ plotSize: PlotSize, setPlotSize: (ps: PlotSize) => void }> = ({ plotSize, setPlotSize }) => {
	return (
		<FormControl size="small">
			<Select
				value={plotSize}
				onChange={(evt: SelectChangeEvent<string>) => { setPlotSize(evt.target.value as PlotSize) }}
			>
				<MenuItem key="small" value={'small'}>Small</MenuItem>
				<MenuItem key="medium" value={'medium'}>Medium</MenuItem>
				<MenuItem key="large" value={'large'}>Large</MenuItem>
				<MenuItem key="xlarge" value={'xlarge'}>Extra large</MenuItem>
			</Select>
		</FormControl>
	)
}

export default ScatterplotsTab
