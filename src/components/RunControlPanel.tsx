import { FunctionComponent, useEffect, useMemo, useState } from "react";
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
	const {chains, setSelectedVariableNames, selectedRunId: runId, initialDrawExclusionOptions} = useMCMCMonitor()
	const {setRoute} = useRoute()
	const chainsForRun = useMemo(() => (chains.filter(c => (c.runId === runId))), [chains, runId])
    const { warmupOptions, detectedInitialDrawExclusion } = initialDrawExclusionOptions
    const [ knownVariableNames, setKnownVariableNames ] = useState<string[]>([])

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

	const allVariablePrefixesExcluded = useMemo(() => {
		const s = new Set<string>()
		for (const c of chainsForRun) {
			for (const v of (c.variablePrefixesExcluded || [])) {
				s.add(v)
			}
		}
		return [...s].sort()
	}, [chainsForRun])

    useEffect(() => {
        const known = new Set(knownVariableNames)
        if (knownVariableNames.length !== allVariableNames.length || allVariableNames.some(n => !known.has(n))) {
            setKnownVariableNames(allVariableNames)
        }
    }, [knownVariableNames, allVariableNames])

	useEffect(() => {
		// start with just lp__ selected
        if (knownVariableNames.includes('lp__')) {
            setSelectedVariableNames(['lp__'])
        } else {
            setSelectedVariableNames([])
        }
	}, [runId, setSelectedVariableNames, knownVariableNames])

	return (
		<div style={{fontSize: 14}}>
			<Hyperlink onClick={() => setRoute({page: 'home'})}>Back to home</Hyperlink>
			<h2>Run: {runId}</h2>
			<p>{numDrawsForRun} draws | {chainsForRun.length} chains</p>

			<h3>Chains</h3>
			<div style={{position: 'relative', maxHeight: 200, overflowY: 'auto'}}>
				<ChainsSelector chains={chainsForRun} allChainIds={chainsForRun.map(c => (c.chainId))} chainColors={chainColors} />
			</div>
			<h3>Variables</h3>
			<div style={{position: 'relative', maxHeight: 200, overflowY: 'auto'}}>
				<VariablesSelector variableNames={knownVariableNames} variablePrefixesExcluded={allVariablePrefixesExcluded} />
			</div>
			<h3>Options</h3>
			<GeneralOptsControl warmupOptions={warmupOptions} detectedInitialDrawExclusion={detectedInitialDrawExclusion} />
		</div>
	)
}

export default RunControlPanel
