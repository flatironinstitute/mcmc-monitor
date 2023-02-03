import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";
import MeanStdevTable from "./MeanStdevTable";
import { applyDrawRange } from "../SequenceHistogram";
import ESSTable from "./ESSTable";
import { useSequenceDrawRange } from "../DiagnosticsTab";

type Props = {
	runId: string
	numDrawsForRun: number
	width: number
	height: number
}

const TablesTab: FunctionComponent<Props> = ({runId, numDrawsForRun}) => {
	const {selectedVariableNames, selectedChainIds, updateSequence, sequences} = useMCMCMonitor()

	const sequenceDrawRange = useSequenceDrawRange(numDrawsForRun)

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
					ret[cc] = applyDrawRange(s.data, sequenceDrawRange)
				}
			}
		}
		return ret
	}, [selectedChainIds, selectedVariableNames, sequenceDrawRange, runId, sequences])

	return (
		<div>
			<h3>Mean (Std.Dev)</h3>
			<MeanStdevTable
				chainIds={selectedChainIds}
				variableNames={selectedVariableNames}
				sequenceData={filteredSequenceData}
			/>
			<h3>Effective sample size (ESS)</h3>
			<ESSTable
				chainIds={selectedChainIds}
				variableNames={selectedVariableNames}
				sequenceData={filteredSequenceData}
			/>
		</div>
	)
}

export default TablesTab
