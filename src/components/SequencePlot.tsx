import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import SequencePlotWidget, { PlotSequence } from "./SequencePlotWidget";

type Props = {
	runId: string
	chainIds: string[]
	variableName: string
	highlightIterationRange?: [number, number]
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

const SequencePlot: FunctionComponent<Props> = ({runId, chainIds, variableName, highlightIterationRange, chainColors, width, height}) => {
	const {sequences, updateSequence} = useMCMCMonitor()
	useEffect(() => {
		for (const chainId of chainIds) {
			if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName)).length === 0) {
				updateSequence(runId, chainId, variableName)
			}
		}
	}, [sequences, runId, chainIds, updateSequence, variableName])
	const plotSequences = useMemo(() => {
		const ret: PlotSequence[] = []
		for (const chainId of chainIds) {
			const s = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
			if (s) {
				ret.push({
					label: chainId,
					data: s.data,
					color: chainColors[chainId] || 'black'
				})
			}
		}
		return ret
	}, [chainIds, sequences, runId, variableName, chainColors])
	return (
		<SequencePlotWidget
			plotSequences={plotSequences}
			variableName={variableName}
			width={width}
			height={height}
			highlightIterationRange={highlightIterationRange}
		/>
	)
}

export default SequencePlot
