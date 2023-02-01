import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { applyIterationRange } from "./SequenceHistogram";
import SequenceScatterplot3DWidget from "./SequenceScatterplot3DWidget"
import { Scatterplot3DSequence } from "./SequenceScatterplot3DWidget";

type Props = {
	runId: string
	chainIds: string[]
	xVariableName: string
	yVariableName: string
	zVariableName: string
	highlightIterationRange?: [number, number]
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

const SequenceScatterplot3D: FunctionComponent<Props> = ({runId, chainIds, xVariableName, yVariableName, zVariableName, highlightIterationRange, chainColors, width, height}) => {
	const {sequences, updateSequence} = useMCMCMonitor()
	useEffect(() => {
		for (const chainId of chainIds) {
			if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === xVariableName)).length === 0) {
				updateSequence(runId, chainId, xVariableName)
			}
			if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === yVariableName)).length === 0) {
				updateSequence(runId, chainId, yVariableName)
			}
			if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === zVariableName)).length === 0) {
				updateSequence(runId, chainId, zVariableName)
			}
		}
	}, [sequences, runId, chainIds, updateSequence, xVariableName, yVariableName, zVariableName])
	const scatterplot3DSequences = useMemo(() => {
		const ret: Scatterplot3DSequence[] = []
		for (const chainId of chainIds) {
			const sX = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === xVariableName))[0]
			const sY = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === yVariableName))[0]
			const sZ = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === zVariableName))[0]
			if ((sX) && (sY) && (sZ)) {
				ret.push({
					label: chainId,
					xData: applyIterationRange(sX.data, highlightIterationRange),
					yData: applyIterationRange(sY.data, highlightIterationRange),
					zData: applyIterationRange(sZ.data, highlightIterationRange),
					color: chainColors[chainId] || 'black'
				})
			}
		}
		return ret
	}, [chainIds, chainColors, sequences, runId, xVariableName, yVariableName, zVariableName, highlightIterationRange])
	return (
		<SequenceScatterplot3DWidget
			scatterplot3DSequences={scatterplot3DSequences}
			xVariableName={xVariableName}
			yVariableName={yVariableName}
			zVariableName={zVariableName}
			width={width}
			height={height}
		/>
	)
}

export default SequenceScatterplot3D
