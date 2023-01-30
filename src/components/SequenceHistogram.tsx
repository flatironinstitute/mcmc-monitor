import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import SequenceHistogramWidget from "./SequenceHistogramWidget";

type Props = {
	runId: string
	chainId: string
	variableName: string
	sequenceHistogramOpts: SequenceHistogramOpts
	iterationRange: [number, number] | undefined
	width: number
	height: number
}

export type SequenceHistogramOpts = {
	numIterations: number
}

const SequenceHistogram: FunctionComponent<Props> = ({runId, chainId, variableName, sequenceHistogramOpts, iterationRange, width, height}) => {
	const {sequences, updateSequence} = useMCMCMonitor()
	useEffect(() => {
		if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName)).length === 0) {
			updateSequence(runId, chainId, variableName)
		}
	}, [sequences, runId, chainId, updateSequence, variableName])
	const histData = useMemo(() => {
		const s = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
		if (s) {
			return applyIterationRange(s.data, iterationRange)
		}
		else {
			return []
		}
	}, [chainId, sequences, runId, variableName, iterationRange])
	return (
		<SequenceHistogramWidget histData={histData} variableName={variableName} title={chainId} width={width} height={height} />
	)
}

function applyIterationRange(data: number[], iterationRange: [number, number] | undefined) {
	if (!iterationRange) return data
	return data.slice(iterationRange[0], iterationRange[1])
}

export default SequenceHistogram
