import { FunctionComponent, useEffect, useMemo } from "react";
import { chainColorForIndex } from "../chainColorList";
import ConvergenceTab from "../components/ConvergenceTab";
import RunControlPanel from "../components/RunControlPanel";
import RunInfoTab from "../components/RunInfoTab";
import ScatterplotsTab from "../components/ScatterplotsTab";
import Splitter from "../components/Splitter";
import TabWidget from "../components/TabWidget/TabWidget";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { MCMCChain, MCMCRun } from "../MCMCMonitorTypes";
import useWindowDimensions from "../useWindowDimensions";

type Props = {
	runId: string
}

const RunPage: FunctionComponent<Props> = ({runId}) => {
	const {runs, chains, sequences, updateChainsForRun, setSelectedChainIds, generalOpts, updateExistingSequences} = useMCMCMonitor()

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

	const chainColors = useMemo(() => {
		const ret: {[chainId: string]: string} = {}
		for (let i = 0; i < chainsForRun.length; i++) {
			ret[chainsForRun[i].chainId] = chainColorForIndex(i)
		}
		return ret
	}, [chainsForRun])

	useEffect(() => {
		// start with all chains selected
		setSelectedChainIds(chainsForRun.map(c => (c.chainId)))
	}, [runId, setSelectedChainIds, chainsForRun])

	const {width, height} = useWindowDimensions()

	if (!run) return <span>Run not found: {runId}</span>
	return (
		<div style={{position: 'absolute', width: width - 40, height: height - 40, margin: 20, overflow: 'hidden'}}>
			<Splitter
				width={width - 30}
				height={height}
				initialPosition={500}
			>
				<RunControlPanel
					runId={runId}
					numIterationsForRun={numIterationsForRun}
					chainColors={chainColors}
				/>
				<RightContent
					width={0}
					height={0}
					runId={runId}
					chainsForRun={chainsForRun}
					chainColors={chainColors}
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
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

const tabs = [
	{label: 'Convergence', closeable: false},
	{label: 'Run Info', closeable: false},
	{label: 'Scatterplots', closeable: false}
]

const RightContent: FunctionComponent<RightContentProps> = ({width, height, runId, numIterationsForRun, chainColors}) => {
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
				chainColors={chainColors}
				numIterationsForRun={numIterationsForRun}
			/>
			<RunInfoTab
				width={0}
				height={0}
				runId={runId}
			/>
			<ScatterplotsTab
				width={0}
				height={0}
				runId={runId}
				numIterationsForRun={numIterationsForRun}
				chainColors={chainColors}
			/>
		</TabWidget>
	)
}

export default RunPage
