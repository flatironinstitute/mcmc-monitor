import { FunctionComponent, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";
import useRoute from "../useRoute";
import ChainsSelector from "./ChainsSelector";
import GeneralOptsControl from "./GeneralOptsControl";
import Hyperlink from "./Hyperlink";
import VariablesSelector from "./VariablesSelector";

type Props = {
	numDrawsForRun: number
	chainColors: {[chainId: string]: string}
}

const RunControlPanel: FunctionComponent<Props> = ({numDrawsForRun, chainColors}) => {
	const {chains, setSelectedVariableNames, selectedRunId: runId} = useMCMCMonitor()
	const {setRoute} = useRoute()
	const chainsForRun = useMemo(() => (chains.filter(c => (c.runId === runId))), [chains, runId])

	const allVariableNames = useMemo(() => {
		const s = new Set<string>()
		for (const c of chainsForRun) {
			for (const v of c.variableNames) {
				s.add(v)
			}
		}
		return [...s].sort().sort((v1, v2) => {
			if ((v1.includes('__')) && (!v2.includes('__'))) return -1
			if ((!v1.includes('__')) && (v2.includes('__'))) return 1
			return 0
		})
	}, [chainsForRun])

	const numParameters = useMemo(() => (allVariableNames.filter(v => (!v.includes('__'))).length), [allVariableNames])

	useEffect(() => {
		// start with just lp__ selected
		if (allVariableNames.includes('lp__')) {
			setSelectedVariableNames(['lp__'])
		}
	}, [runId, setSelectedVariableNames, allVariableNames])

	return (
		<div style={{fontSize: 14}}>
			<Hyperlink onClick={() => setRoute({page: 'home'})}>Back to home</Hyperlink>
			<h2>Run: {runId}</h2>
			<p>{numDrawsForRun} draws | {numParameters} parameters | {chainsForRun.length} chains</p>

			<h3>Chains</h3>
			<div style={{position: 'relative', maxHeight: 200, overflowY: 'auto'}}>
				<ChainsSelector chains={chainsForRun} allChainIds={chainsForRun.map(c => (c.chainId))} chainColors={chainColors} />
			</div>
			<h3>Variables</h3>
			<div style={{position: 'relative', maxHeight: 200, overflowY: 'auto'}}>
				<VariablesSelector variableNames={allVariableNames} />
			</div>
			<h3>Options</h3>
			<GeneralOptsControl />
		</div>
	)
}

export default RunControlPanel
