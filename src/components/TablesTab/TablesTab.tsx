import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../../MCMCMonitorData";
import { useSequenceHistogramIterationRange } from "../DiagnosticsTab";
import MeanStdevTable from "./MeanStdevTable";
import { applyIterationRange } from "../SequenceHistogram";
import ESSTable from "./ESSTable";

type Props = {
	runId: string
	numIterationsForRun: number
	width: number
	height: number
}

const TablesTab: FunctionComponent<Props> = ({runId, numIterationsForRun}) => {
	const {selectedVariableNames, selectedChainIds, updateSequence, sequences} = useMCMCMonitor()

	const sequenceHistogramIterationRange = useSequenceHistogramIterationRange(numIterationsForRun)

	useEffect(() => {
		for (const chainId of selectedChainIds) {
			for (const variableName of selectedVariableNames) {
				updateSequence(runId, chainId, variableName)
			}
		}
	}, [runId, selectedChainIds, selectedVariableNames, updateSequence])

	const filteredSequenceData: {[chainVariableCode: string]: number[]} = useMemo(() => {
		const ret: {[chainVariableCode: string]: number[]} = {}
		for (const chainId of selectedChainIds) {
			for (const variableName of selectedVariableNames) {
				const s = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
				if (s) {
					const cc = `${chainId}:${variableName}`
					ret[cc] = applyIterationRange(s.data, sequenceHistogramIterationRange)
				}
			}
		}
		return ret
	}, [selectedChainIds, selectedVariableNames, sequenceHistogramIterationRange, runId, sequences])

	return (
		<div>
			<h3>Mean (Std.Dev)</h3>
			<MeanStdevTable
				chainIds={selectedChainIds}
				variableNames={selectedVariableNames}
				sequenceData={filteredSequenceData}
			/>
			<h3>Estimated sample size (ESS)</h3>
			<ESSTable
				chainIds={selectedChainIds}
				variableNames={selectedVariableNames}
				sequenceData={filteredSequenceData}
			/>
		</div>
	)
}

export default TablesTab
