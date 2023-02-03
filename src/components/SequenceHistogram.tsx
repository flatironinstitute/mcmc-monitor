import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";
import SequenceHistogramWidget from "./SequenceHistogramWidget";

type Props = {
	runId: string
	chainId: string
	variableName: string
	drawRange: [number, number] | undefined
	width: number
	height: number
}

const SequenceHistogram: FunctionComponent<Props> = ({runId, chainId, variableName, drawRange, width, height}) => {
	const {sequences, updateSequence} = useMCMCMonitor()
	useEffect(() => {
		if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName)).length === 0) {
			updateSequence(runId, chainId, variableName)
		}
	}, [sequences, runId, chainId, updateSequence, variableName])
	const histData = useMemo(() => {
		const s = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
		if (s) {
			return applyDrawRange(s.data, drawRange)
		}
		else {
			return []
		}
	}, [chainId, sequences, runId, variableName, drawRange])
	return (
		<SequenceHistogramWidget histData={histData} variableName={variableName} title={chainId} width={width} height={height} />
	)
}

export function applyDrawRange(data: number[], drawRange: [number, number] | undefined) {
	if (!drawRange) return data
	return data.slice(drawRange[0], drawRange[1])
}

export default SequenceHistogram
