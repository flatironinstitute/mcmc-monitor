import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";

type Props = {
	chainId?: string
	variableName?: string
	chainIds?: string[]
	variableNames?: string[]
}

const ChainOrVariableTable: FunctionComponent<Props> = ({chainId, variableName, variableNames, chainIds}) => {
	const {sequenceStats, selectedRunId: runId} = useMCMCMonitor()

	const mode = chainId ? 'by-chain' : 'by-variable'

	const columns = useMemo(() => ([
		{
			key: mode === 'by-chain' ? 'variableName' : 'chainId',
			label: mode === 'by-chain' ? 'Variable' : 'Chain'
		},
		{
			key: 'meanStdev',
			label: 'Mean (st.dev)'
		},
		{
			key: 'ess',
			label: 'ESS'
		}
	]), [mode])

	const rows = useMemo(() => {
		function getValuesForRow(chainId: string, variableName: string) {
			const k = `${runId}/${chainId}/${variableName}`
			let {mean, stdev, ess} = sequenceStats[k] || {}
			if (mean !== undefined) mean = parseFloat(mean.toPrecision(3))
			if (stdev !== undefined) stdev = parseFloat(stdev.toPrecision(3))
			if (ess !== undefined) ess = parseFloat(ess.toPrecision(3))
			return {
				meanStdev: mean !== undefined ? `${mean} (${stdev})` : '',
				ess: ess !== undefined ? ess : ''
			}
		}
		if (mode === 'by-chain') {
			if ((!chainId) || (!variableNames)) throw Error('Unexpected')
			return variableNames.map(v => {
				return {
					key: v,
					values: {...getValuesForRow(chainId, v), variableName: v} as any
				}
			})
		}
		else {
			if ((!variableName) || (!chainIds)) throw Error('Unexpected')
			return chainIds.map(ch => {
				return {
					key: ch,
					values: {...getValuesForRow(ch, variableName), chainId: ch} as any
				}
			})
		}
	}, [variableName, chainId, variableNames, chainIds, mode, runId, sequenceStats])

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

export default ChainOrVariableTable
