import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";
import { applyDrawRange } from "./SequenceHistogram";
import SequenceScatterplot3DWidget from "./SequenceScatterplot3DWidget"
import { Scatterplot3DSequence } from "./SequenceScatterplot3DWidget";

type Props = {
	runId: string
	chainIds: string[]
	xVariableName: string
	yVariableName: string
	zVariableName: string
	highlightDrawRange?: [number, number]
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

const SequenceScatterplot3D: FunctionComponent<Props> = ({runId, chainIds, xVariableName, yVariableName, zVariableName, highlightDrawRange, chainColors, width, height}) => {
	const {sequences} = useMCMCMonitor()
	const scatterplot3DSequences = useMemo(() => {
		const ret: Scatterplot3DSequence[] = []
		for (const chainId of chainIds) {
			const sX = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === xVariableName))[0]
			const sY = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === yVariableName))[0]
			const sZ = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === zVariableName))[0]
			if ((sX) && (sY) && (sZ)) {
				ret.push({
					label: chainId,
					xData: applyDrawRange(sX.data, highlightDrawRange),
					yData: applyDrawRange(sY.data, highlightDrawRange),
					zData: applyDrawRange(sZ.data, highlightDrawRange),
					color: chainColors[chainId] || 'black'
				})
			}
		}
		return ret
	}, [chainIds, chainColors, sequences, runId, xVariableName, yVariableName, zVariableName, highlightDrawRange])
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
