import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import { applyDrawRange } from "./SequenceHistogram";
import SequenceScatterplotWidget, { ScatterplotSequence } from "./SequenceScatterplotWidget";

type Props = {
	runId: string
	chainIds: string[]
	xVariableName: string
	yVariableName: string
	highlightDrawRange?: [number, number]
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

const SequenceScatterplot: FunctionComponent<Props> = ({runId, chainIds, xVariableName, yVariableName, highlightDrawRange, chainColors, width, height}) => {
	const {sequences} = useMCMCMonitor()
	const scatterplotSequences = useMemo(() => {
		const ret: ScatterplotSequence[] = []
		for (const chainId of chainIds) {
			const sX = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === xVariableName))[0]
			const sY = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === yVariableName))[0]
			if ((sX) && (sY)) {
				ret.push({
					label: chainId,
					xData: applyDrawRange(sX.data, highlightDrawRange),
					yData: applyDrawRange(sY.data, highlightDrawRange),
					color: chainColors[chainId] || 'black'
				})
			}
		}
		return ret
	}, [chainIds, chainColors, sequences, runId, xVariableName, yVariableName, highlightDrawRange])
	return (
		<SequenceScatterplotWidget
			scatterplotSequences={scatterplotSequences}
			xVariableName={xVariableName}
			yVariableName={yVariableName}
			width={width}
			height={height}
		/>
	)
}

export default SequenceScatterplot
