import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { applyIterationRange } from "./SequenceHistogram";
import SequenceScatterplotWidget from "./SequenceScatterplotWidget";
import { ScatterplotSequence } from "./SequenceScatterplotWidget";

type Props = {
	runId: string
	chainIds: string[]
	xVariableName: string
	yVariableName: string
	highlightIterationRange?: [number, number]
	width: number
	height: number
}

const SequenceScatterplot: FunctionComponent<Props> = ({runId, chainIds, xVariableName, yVariableName, highlightIterationRange, width, height}) => {
	const {sequences, updateSequence} = useMCMCMonitor()
	useEffect(() => {
		for (const chainId of chainIds) {
			if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === xVariableName)).length === 0) {
				updateSequence(runId, chainId, xVariableName)
			}
			if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === yVariableName)).length === 0) {
				updateSequence(runId, chainId, yVariableName)
			}
		}
	}, [sequences, runId, chainIds, updateSequence, xVariableName, yVariableName])
	const scatterplotSequences = useMemo(() => {
		const ret: ScatterplotSequence[] = []
		for (const chainId of chainIds) {
			const sX = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === xVariableName))[0]
			const sY = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === yVariableName))[0]
			if ((sX) && (sY)) {
				ret.push({
					label: chainId,
					xData: applyIterationRange(sX.data, highlightIterationRange),
					yData: applyIterationRange(sY.data, highlightIterationRange)
				})
			}
		}
		return ret
	}, [chainIds, sequences, runId, xVariableName, yVariableName, highlightIterationRange])
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
