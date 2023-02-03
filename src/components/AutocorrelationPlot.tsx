import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";
import { MCMCSequence } from "../MCMCMonitorDataManager/MCMCMonitorTypes";
import AutocorrelationPlotWidget from "./AutocorrelationPlotWidget";
import { applyDrawRange } from "./SequenceHistogram";
import { autocorr } from "./stats/ess";

type Props = {
	runId: string
	chainId: string
	variableName: string
	drawRange: [number, number] | undefined
	width: number
	height: number
}

const AutocorrelationPlot: FunctionComponent<Props> = ({runId, chainId, variableName, drawRange, width, height}) => {
	const {sequences} = useMCMCMonitor()

	// important to do it this way so we don't recalculate every time any of the sequences change
	const sequence: MCMCSequence | undefined = useMemo(() => (
		sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
	), [chainId, runId, sequences, variableName])

	const sequenceData = useMemo(() => (
		sequence ? applyDrawRange(sequence.data, drawRange) : undefined
	), [sequence, drawRange])

	const [autocorrelationData, setAutocorrelationData] = useState<{dx: number[], y: number[]} | undefined>()
	useEffect(() => {
		let canceled = false
		setAutocorrelationData(undefined)
		if (!sequenceData) return
		if (!drawRange) return
		;(async () => {
			const a = await computeAutocorrelationData(sequenceData, Math.min(100, (drawRange[1] - drawRange[0]) / 2))
			if (canceled) return
			setAutocorrelationData(a)
		})()
		return () => {canceled = true}
	}, [sequenceData, drawRange])
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

async function computeAutocorrelationData(sequenceData: number[], n: number) {
	const acor = autocorr(sequenceData, n)
	const dx: number[] = []
	const y: number[] = []
	for (let i = 0; i < n; i++) {
		dx.push(i)
		y.push(acor[i])
	}
	return {dx, y}
	// const v: number[] = []
	// for (let i = n; i < sequenceData.length - n; i++) {
	// 	v.push(sequenceData[i])
	// }
	// if (v.length < 2) return undefined
	// const mu = computeMean(v)
	// if (mu === undefined) return undefined
	// const normalizationFactor = v.map(v => (v - mu)).reduce((a, b) => (a + b * b))

	// const sequenceData2 = sequenceData.map(a => (a - mu))

	// const dx: number[] = []
	// const y: number[] = []
	// for (let dx0 = -n; dx0 <= n; dx0++) {
	// 	let y0 = 0
	// 	for (let i = n; i < sequenceData.length - n; i++) {
	// 		y0 += sequenceData2[i] * sequenceData2[i + dx0]
	// 	}
	// 	dx.push(dx0)
	// 	y.push(y0 / normalizationFactor)
	// }

	// return {dx, y}
}

export default AutocorrelationPlot
