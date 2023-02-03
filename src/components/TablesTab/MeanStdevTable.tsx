import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useCallback, useMemo } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";

type Props = {
	chainIds: string[]
    variableNames: string[]
}

const MeanStdevTable: FunctionComponent<Props> = ({chainIds, variableNames}) => {
	const {sequenceStats, selectedRunId: runId} = useMCMCMonitor()

	const columns = useMemo(() => ([
		{
			key: 'variableName',
			label: 'Variable'
		},
		...(
			chainIds.map((chainId, ii) => ({
				key: chainId,
				label: ii + 1
			}))
		)
	]), [chainIds])

	const rows = useMemo(() => {
		return variableNames.map(v => {
			const a = {
				key: v,
				values: {
					variableName: v
				} as {[key: string]: any}
			}
			chainIds.forEach(chainId => {
				const k = `${runId}/${chainId}/${v}`
				// let {mean, stdev} = computeVariableMeanStdev(v, chainId)
				let {mean, stdev} = sequenceStats[k] || {}
				if (mean !== undefined) mean = parseFloat(mean.toPrecision(3))
				if (stdev !== undefined) stdev = parseFloat(stdev.toPrecision(3))
				a.values[chainId] = mean === undefined ? undefined : (
					`${mean} (${stdev})`
				)
			})
			return a
		})
	}, [variableNames, chainIds, runId, sequenceStats])

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

export default MeanStdevTable
