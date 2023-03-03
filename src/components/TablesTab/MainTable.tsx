import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../../util/useMCMCMonitor";

type Props = any

const MainTable: FunctionComponent<Props> = () => {
	const {variableStats, selectedRunId: runId, selectedVariableNames} = useMCMCMonitor()

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
			key: 'numSamples',
			label: 'Num. samples'
		},
		{
			key: 'ess',
			label: 'ESS'
		},
		{
			key: 'rhat',
			label: 'R-hat'
		}
	]), [])

	const rows = useMemo(() => {
		function getValuesForRow(variableName: string) {
			const k = `${runId}/${variableName}`
			// eslint-disable-next-line prefer-const
			let {mean, stdev, ess, rhat, count} = variableStats[k] || {}
			if (mean !== undefined) mean = parseFloat(mean.toPrecision(3))
			if (stdev !== undefined) stdev = parseFloat(stdev.toPrecision(3))
			if (ess !== undefined) ess = parseFloat(ess.toPrecision(3))
			if (rhat !== undefined) rhat = parseFloat(rhat.toPrecision(3))
			return {
				meanStdev: mean !== undefined ? `${mean} (${stdev})` : '',
				ess: ess !== undefined ? ess : '',
				rhat: rhat !== undefined ? rhat : '',
				numSamples: count !== undefined ? count : ''
			}
		}
		return selectedVariableNames.map(variableName => {
			return {
				key: variableName,
				values: {...getValuesForRow(variableName), variableName} as any
			}
		})
	}, [selectedVariableNames, runId, variableStats])

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

export default MainTable
