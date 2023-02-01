import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useCallback, useEffect, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { useSequenceHistogramIterationRange } from "./ConvergenceTab";
import { applyIterationRange } from "./SequenceHistogram";

type Props = {
	runId: string
	numIterationsForRun: number
	width: number
	height: number
}

const TablesTab: FunctionComponent<Props> = ({runId, numIterationsForRun}) => {
	const {selectedVariableNames, selectedChainIds, updateSequence, sequences} = useMCMCMonitor()

	const sequenceHistogramIterationRange = useSequenceHistogramIterationRange(numIterationsForRun)

	const columns = useMemo(() => ([
		{
			key: 'variableName',
			label: 'Variable'
		},
		...(
			selectedChainIds.map((chainId, ii) => ({
				key: chainId,
				label: ii + 1
			}))
		)
	]), [selectedChainIds])

	useEffect(() => {
		for (const chainId of selectedChainIds) {
			for (const variableName of selectedVariableNames) {
				updateSequence(runId, chainId, variableName)
			}
		}
	}, [runId, selectedChainIds, selectedVariableNames, updateSequence])

	const computeVariableMeanStdev = useCallback((variableName: string, chainId: string) => {
		const s = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
		if (s) {
			const dd = applyIterationRange(s.data, sequenceHistogramIterationRange)
			return {mean: computeMean(dd), stdev: computeStdev(dd)}
		}
		else return {mean: undefined, stdev: undefined}
	}, [sequences, runId, sequenceHistogramIterationRange])

	const rows = useMemo(() => {
		return selectedVariableNames.map(v => {
			const a = {
				key: v,
				values: {
					variableName: v
				} as {[key: string]: any}
			}
			selectedChainIds.forEach(chainId => {
				let {mean, stdev} = computeVariableMeanStdev(v, chainId)
				if (mean !== undefined) mean = parseFloat(mean.toPrecision(3))
				if (stdev !== undefined) stdev = parseFloat(stdev.toPrecision(3))
				a.values[chainId] = mean === undefined ? undefined : (
					`${mean} (${stdev})`
				)
			})
			return a
		})
	}, [selectedVariableNames, selectedChainIds, computeVariableMeanStdev])

	return (
		<Table>
			<TableHead>
				<TableRow>
					{
						columns.map(c => (
							<TableCell key={c.key}>{c.label}</TableCell>
						))
					}
				</TableRow>
			</TableHead>
			<TableBody>
				{
					rows.map((row) => (
						<TableRow key={row.key}>
							{
								columns.map(c => (
									<TableCell key={c.key}>{row.values[c.key]}</TableCell>
								))
							}
						</TableRow>
					))
				}
			</TableBody>
		</Table>
	)
}

function computeMean(d: number[]) {
	if (d.length === 0) return undefined
	return d.reduce((a, b) => (a + b), 0) / d.length
}

function computeStdev(d: number[]) {
	if (d.length <= 1) return undefined
	const sumsqr = d.reduce((a, b) => (a + b * b), 0)
	const m0 = computeMean(d)
	if (m0 === undefined) return undefined
	return Math.sqrt(sumsqr / d.length - m0 * m0)
}

export default TablesTab
