import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import AutocorrelationPlotWidget from "./AutocorrelationPlotWidget";

type Props = {
	runId: string
	chainId: string
	variableName: string
	drawRange: [number, number] | undefined
	width: number
	height: number
}

const AutocorrelationPlot: FunctionComponent<Props> = ({runId, chainId, variableName, drawRange, width, height}) => {
	const {sequenceStats} = useMCMCMonitor()

	const autocorrelationData = useMemo(() => {
		const k = `${runId}/${chainId}/${variableName}`
		const ss = sequenceStats[k]
		if (!ss) {
			return undefined
		}
		const {acor} = ss
		if (!acor) return undefined
		const dx: number[] = []
		const y: number[] = []
		for (let i = 0; i < Math.min(acor.length, 100); i++) {
			dx.push(i)
			y.push(acor[i])
		}
		return {dx, y}
	}, [sequenceStats, runId, chainId, variableName])
	return (
		<AutocorrelationPlotWidget
			autocorrelationData={autocorrelationData}
			variableName={variableName}
			title={chainId}
			width={width}
			height={height}
		/>
	)
}

export default AutocorrelationPlot
