import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";
import SequenceHistogramWidget from "./SequenceHistogramWidget";

type Props = {
	runId: string
	chainId: string | string[]
	variableName: string
	drawRange: [number, number] | undefined
	title: string
	width: number
	height: number
}

const SequenceHistogram: FunctionComponent<Props> = ({runId, chainId, variableName, drawRange, title, width, height}) => {
	const {sequences} = useMCMCMonitor()
	const histData = useMemo(() => {
		function getDataForChain(ch: string) {
			const s = sequences.filter(s => (s.runId === runId && s.chainId === ch && s.variableName === variableName))[0]
			if (s) {
				return applyDrawRange(s.data, drawRange)
			}
			else {
				return []
			}
		}
		if (!Array.isArray(chainId)) {
			return getDataForChain(chainId)
		}
		else {
			return chainId.map(ch => (getDataForChain(ch))).flat()
		}
	}, [chainId, sequences, runId, variableName, drawRange])
	return (
		<SequenceHistogramWidget histData={histData} variableName={variableName} title={title} width={width} height={height} />
	)
}

export function applyDrawRange(data: number[], drawRange: [number, number] | undefined) {
	if (!drawRange) return data
	return data.slice(drawRange[0], drawRange[1])
}

export default SequenceHistogram
