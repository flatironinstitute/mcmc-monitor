import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../../MCMCMonitorDataManager/useMCMCMonitor";

type Props = {
	variableName: string
	chainIds: string[]
}

const VariableTable: FunctionComponent<Props> = ({variableName, chainIds}) => {
	const {sequenceStats, selectedRunId: runId} = useMCMCMonitor()

	const columns = useMemo(() => ([
		{
			key: 'chainId',
			label: 'Chain'
		},
		{
			key: 'meanStdev',
			label: 'Mean (st.dev)'
		},
		{
			key: 'numSamples',
			label: 'Num. samples'
		},
		{
			key: 'ess',
			label: 'ESS'
		}
	]), [])

	const rows = useMemo(() => {
		function getValuesForRow(chainId: string, variableName: string) {
			const k = `${runId}/${chainId}/${variableName}`
			// eslint-disable-next-line prefer-const
			let {mean, stdev, ess, count} = sequenceStats[k] || {}
			if (mean !== undefined) mean = parseFloat(mean.toPrecision(3))
			if (stdev !== undefined) stdev = parseFloat(stdev.toPrecision(3))
			if (ess !== undefined) ess = parseFloat(ess.toPrecision(3))
			return {
				meanStdev: mean !== undefined ? `${mean} (${stdev})` : '',
				ess: ess !== undefined ? ess : '',
				numSamples: count !== undefined ? count : ''
			}
		}
		return chainIds.map(ch => {
			return {
				key: ch,
				values: {...getValuesForRow(ch, variableName), chainId: ch} as any
			}
		})
	}, [variableName, chainIds, runId, sequenceStats])

	return (
		<Table style={{maxWidth: 600}}>
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
									<TableCell key={c.key}>{`${row.values[c.key]}`}</TableCell>
								))
							}
						</TableRow>
					))
				}
			</TableBody>
		</Table>
	)
}

export default VariableTable
