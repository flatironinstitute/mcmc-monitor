import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../util/useMCMCMonitor";
import SequencePlotWidget, { PlotSequence } from "./SequencePlotWidget";

type Props = {
	runId: string
	chainIds: string[]
	variableName: string
	highlightDrawRange?: [number, number]
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

const SequencePlot: FunctionComponent<Props> = ({runId, chainIds, variableName, highlightDrawRange, chainColors, width, height}) => {
	const {sequences} = useMCMCMonitor()
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
			highlightDrawRange={highlightDrawRange}
		/>
	)
}

export default SequencePlot
