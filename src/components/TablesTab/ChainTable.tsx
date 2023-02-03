import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useCallback, useMemo } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";

type Props = {
	chainId: string
	variableNames: string[]
}

const ChainTable: FunctionComponent<Props> = ({chainId, variableNames}) => {
	const {sequenceStats, selectedRunId: runId} = useMCMCMonitor()

	const columns = useMemo(() => ([
		{
			key: 'variableName',
			label: 'Variable'
		},
		{
			key: 'meanStdev',
			label: 'Mean (st.dev)'
		},
		{
			key: 'ess',
			label: 'ESS'
		}
	]), [])

	const rows = useMemo(() => {
		return variableNames.map(v => {
			const k = `${runId}/${chainId}/${v}`
			let {mean, stdev, ess} = sequenceStats[k] || {}
			if (mean !== undefined) mean = parseFloat(mean.toPrecision(3))
			if (stdev !== undefined) stdev = parseFloat(stdev.toPrecision(3))
			if (ess !== undefined) ess = parseFloat(ess.toPrecision(3))
			const a = {
				key: v,
				values: {
					variableName: v,
					meanStdev: mean !== undefined ? `${mean} (${stdev})` : '',
					ess: ess !== undefined ? ess : ''
				} as {[key: string]: any}
			}
			return a
		})
	}, [variableNames, chainId, runId, sequenceStats])

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

export default ChainTable
