import { FunctionComponent, useEffect, useMemo } from "react";
import ChainsSelector from "../components/ChainsSelector";
import ConvergenceTab from "../components/ConvergenceTab";
import GeneralOptsControl from "../components/GeneralOptsControl";
import Hyperlink from "../components/Hyperlink";
import RunInfoTab from "../components/RunInfoTab";
import SequenceHistogramOptsControl from "../components/SequenceHistogramOptsControl";
import Splitter from "../components/Splitter";
import TabWidget from "../components/TabWidget/TabWidget";
import VariablesSelector from "../components/VariablesSelector";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { MCMCChain, MCMCRun } from "../MCMCMonitorTypes";
import useRoute from "../useRoute";
import useWindowDimensions from "../useWindowDimensions";

type Props = {
	runId: string
}

const RunPage: FunctionComponent<Props> = ({runId}) => {
	const {runs, chains, sequences, updateChainsForRun, setSelectedVariableNames, setSelectedChainIds, generalOpts, updateExistingSequences} = useMCMCMonitor()

	useEffect(() => {
		let canceled = false
		function update() {
			if (canceled) return
			setTimeout(() => {
				if (generalOpts.updateMode === 'auto') {
					updateExistingSequences(runId)
				}
				update()
			}, 5000)
		}
		update()
		return () => {canceled = true}
	}, [runId, generalOpts.updateMode, updateExistingSequences])

	useEffect(() => {
		updateChainsForRun(runId)
	}, [runId, updateChainsForRun])

	const numIterationsForRun: number = useMemo(() => {
		const a = sequences.filter(s => (s.runId === runId)).map(s => (
			s.data.length
		))
		if (a.length === 0) return 0
		return Math.max(...a)
	}, [sequences, runId])

	const run: MCMCRun | undefined = useMemo(() => (runs.filter(r => (r.runId === runId))[0]), [runs, runId])

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

	useEffect(() => {
		// start with just lp__ selected
		if (allVariableNames.includes('lp__')) {
			setSelectedVariableNames(['lp__'])
		}
	}, [runId, setSelectedVariableNames, allVariableNames])

	useEffect(() => {
		// start with all chains selected
		setSelectedChainIds(chainsForRun.map(c => (c.chainId)))
	}, [runId, setSelectedChainIds, chainsForRun])

	const {width, height} = useWindowDimensions()

	const {setRoute} = useRoute()

	if (!run) return <span>Run not found: {runId}</span>
	return (
		<div style={{position: 'absolute', width: width - 40, height: height - 40, margin: 20, overflow: 'hidden'}}>
			<Splitter
				width={width - 60}
				height={height}
				initialPosition={500}
			>
				<div>
					<Hyperlink onClick={() => setRoute({page: 'home'})}>Back to home</Hyperlink>
					<h2>Run: {runId}</h2>
					<p>Num. iterations: {numIterationsForRun}</p>
					<h3>Chains</h3>
					<ChainsSelector chains={chainsForRun} />
					<h3>Variables</h3>
					<div style={{position: 'relative', height: 300, overflowY: 'auto'}}>
						<VariablesSelector variableNames={allVariableNames} />
					</div>
					<h3>Options</h3>
					<SequenceHistogramOptsControl />
					<div>&nbsp;</div>
					<GeneralOptsControl runId={runId} />
				</div>
				<RightContent
					width={0}
					height={0}
					runId={runId}
					chainsForRun={chainsForRun}
					numIterationsForRun={numIterationsForRun}
				/>
			</Splitter>
		</div>
	)
}

type RightContentProps = {
	runId: string
	chainsForRun: MCMCChain[]
	numIterationsForRun: number
	width: number
	height: number
}

const tabs = [
	{label: 'Convergence', closeable: false},
	{label: 'Run Info', closeable: false}
]

const RightContent: FunctionComponent<RightContentProps> = ({width, height, runId, numIterationsForRun}) => {
	return (
		<TabWidget
			tabs={tabs}
			width={width}
			height={height}
		>
			<ConvergenceTab
				width={0}
				height={0}
				runId={runId}
				numIterationsForRun={numIterationsForRun}
			/>
			<RunInfoTab
				width={0}
				height={0}
				runId={runId}
			/>
		</TabWidget>
	)
}

export default RunPage
