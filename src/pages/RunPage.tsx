import { FunctionComponent, useEffect, useMemo } from "react";
import { chainColorForIndex } from "../chainColorList";
import Diagnostics from "../components/DiagnosticsTab";
import RunControlPanel from "../components/RunControlPanel";
import RunInfoTab from "../components/RunInfoTab";
import ScatterplotsTab from "../components/ScatterplotsTab";
import Splitter from "../components/Splitter";
import TablesTab from "../components/TablesTab/TablesTab";
import TabWidget from "../components/TabWidget/TabWidget";
import { useMCMCMonitor } from "../useMCMCMonitor";
import { MCMCChain, MCMCRun } from "../MCMCMonitorDataManager/MCMCMonitorTypes";
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

	const numDrawsForRun: number = useMemo(() => {
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
		// start with 5 chains selected
		setSelectedChainIds(chainsForRun.slice(0, 5).map(c => (c.chainId)))
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
					numDrawsForRun={numDrawsForRun}
					chainColors={chainColors}
				/>
				<RightContent
					width={0}
					height={0}
					runId={runId}
					chainsForRun={chainsForRun}
					chainColors={chainColors}
					numDrawsForRun={numDrawsForRun}
				/>
			</Splitter>
		</div>
	)
}

type RightContentProps = {
	runId: string
	chainsForRun: MCMCChain[]
	numDrawsForRun: number
	chainColors: {[chainId: string]: string}
	width: number
	height: number
}

const tabs = [
	{label: 'Diagnostics', closeable: false},
	{label: 'Tables', closeable: false},
	{label: 'Run Info', closeable: false},
	{label: 'Scatterplots', closeable: false}
]

const RightContent: FunctionComponent<RightContentProps> = ({width, height, runId, numDrawsForRun, chainColors}) => {
	return (
		<TabWidget
			tabs={tabs}
			width={width}
			height={height}
		>
			<Diagnostics
				width={0}
				height={0}
				runId={runId}
				chainColors={chainColors}
				numDrawsForRun={numDrawsForRun}
			/>
			<TablesTab
				width={0}
				height={0}
				runId={runId}
				numDrawsForRun={numDrawsForRun}
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
				numDrawsForRun={numDrawsForRun}
				chainColors={chainColors}
			/>
		</TabWidget>
	)
}

export default RunPage
