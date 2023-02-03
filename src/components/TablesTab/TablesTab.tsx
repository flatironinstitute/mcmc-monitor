import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";
import { useSequenceDrawRange } from "../DiagnosticsTab";
import { applyDrawRange } from "../SequenceHistogram";
import ESSTable from "./ESSTable";
import MeanStdevTable from "./MeanStdevTable";

type Props = {
	runId: string
	numDrawsForRun: number
	width: number
	height: number
}

const TablesTab: FunctionComponent<Props> = ({runId, numDrawsForRun}) => {
	const {selectedVariableNames, selectedChainIds} = useMCMCMonitor()

	return (
		<div>
			<h3>Mean (Std.Dev)</h3>
			<MeanStdevTable
				chainIds={selectedChainIds}
				variableNames={selectedVariableNames}
			/>
			<h3>Effective sample size (ESS)</h3>
			<ESSTable
				chainIds={selectedChainIds}
				variableNames={selectedVariableNames}
			/>
		</div>
	)
}

export default TablesTab
