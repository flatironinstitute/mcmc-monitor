import { FunctionComponent, useEffect, useMemo } from "react";
import ChainsTable from "../components/ChainsTable";
import SequencePlot from "../components/SequencePlot";
import Splitter from "../components/Splitter";
import VariablesSelector from "../components/VariablesSelector";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { MCMCChain, MCMCRun } from "../MCMCMonitorTypes";
import useWindowDimensions from "../useWindowDimensions";

type Props = {
	runId: string
}

const RunPage: FunctionComponent<Props> = ({runId}) => {
	const {runs, chains, updateChainsForRun} = useMCMCMonitor()

	useEffect(() => {
		updateChainsForRun(runId)
	}, [runId, updateChainsForRun])

	const run: MCMCRun | undefined = useMemo(() => (runs.filter(r => (r.runId === runId))[0]), [runs, runId])

	const chainsForRun = useMemo(() => (chains.filter(c => (c.runId === runId))), [chains, runId])

	const allVariableNames = useMemo(() => {
		const s = new Set<string>()
		for (const c of chainsForRun) {
			for (const v of c.variableNames) {
				s.add(v)
			}
		}
		return [...s].sort()
	}, [chainsForRun])

	const {width, height} = useWindowDimensions()

	if (!run) return <span>Run not found: {runId}</span>
	return (
		<Splitter
			width={width}
			height={height}
			initialPosition={500}
		>
			<div>
				<h3>Run: {runId}</h3>
				<ChainsTable
					chains={chainsForRun}
				/>
				<VariablesSelector variableNames={allVariableNames} />
			</div>
			<RightContent
				width={0}
				height={0}
				runId={runId}
				chainsForRun={chainsForRun}
				allVariableNames={allVariableNames}
			/>
		</Splitter>
	)
}

type RightContentProps = {
	runId: string
	chainsForRun: MCMCChain[]
	allVariableNames: string[]
	width: number
	height: number
}

const RightContent: FunctionComponent<RightContentProps> = ({width, runId, chainsForRun, allVariableNames}) => {
	const {selectedVariableNames} = useMCMCMonitor()
	return (
		<div>
			{
				selectedVariableNames.filter(v => (allVariableNames.includes(v))).map(v => (
					<SequencePlot
						key={v}
						runId={runId}
						chainIds={chainsForRun.map(c => (c.chainId))}
						variableName={v}
						width={width}
						height={500}
					/>
				))
			}
		</div>
	)
}

export default RunPage
