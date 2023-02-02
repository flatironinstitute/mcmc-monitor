import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { MCMCSequence } from "../MCMCMonitorTypes";
import AutocorrelationPlotWidget from "./AutocorrelationPlotWidget";
import { applyIterationRange } from "./SequenceHistogram";
import { computeMean } from "./TablesTab";

type Props = {
	runId: string
	chainId: string
	variableName: string
	iterationRange: [number, number] | undefined
	width: number
	height: number
}

export type SequenceHistogramOpts = {
	numIterations: number
}

const AutocorrelationPlot: FunctionComponent<Props> = ({runId, chainId, variableName, iterationRange, width, height}) => {
	const {sequences, updateSequence} = useMCMCMonitor()
	useEffect(() => {
		if (sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName)).length === 0) {
			updateSequence(runId, chainId, variableName)
		}
	}, [sequences, runId, chainId, updateSequence, variableName])

	// important to do it this way so we don't recalculate every time any of the sequences change
	const sequence: MCMCSequence | undefined = useMemo(() => (
		sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
	), [chainId, runId, sequences, variableName])

	const sequenceData = useMemo(() => (
		sequence ? applyIterationRange(sequence.data, iterationRange) : undefined
	), [sequence, iterationRange])

	const [autocorrelationData, setAutocorrelationData] = useState<{dx: number[], y: number[]} | undefined>()
	useEffect(() => {
		let canceled = false
		setAutocorrelationData(undefined)
		if (!sequenceData) return
		if (!iterationRange) return
		;(async () => {
			const a = await computeAutocorrelationData(sequenceData, Math.min(50, (iterationRange[1] - iterationRange[0]) / 5))
			if (canceled) return
			setAutocorrelationData(a)
		})()
		return () => {canceled = true}
	}, [sequenceData, iterationRange])
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
	const v: number[] = []
	for (let i = n; i < sequenceData.length - n; i++) {
		v.push(sequenceData[i])
	}
	if (v.length < 2) return undefined
	const mu = computeMean(v)
	if (mu === undefined) return undefined
	const normalizationFactor = v.map(v => (v - mu)).reduce((a, b) => (a + b * b))

	const sequenceData2 = sequenceData.map(a => (a - mu))

	const dx: number[] = []
	const y: number[] = []
	for (let dx0 = -n; dx0 <= n; dx0++) {
		let y0 = 0
		for (let i = n; i < sequenceData.length - n; i++) {
			y0 += sequenceData2[i] * sequenceData2[i + dx0]
		}
		dx.push(dx0)
		y.push(y0 / normalizationFactor)
	}

	return {dx, y}
}

export default AutocorrelationPlot
