import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useCallback, useMemo } from "react";

type Props = {
	chainIds: string[]
    variableNames: string[]
    sequenceData: {[chainVariableCode: string]: number[]}
}

const MeanStdevTable: FunctionComponent<Props> = ({chainIds, variableNames, sequenceData}) => {
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

	const computeVariableMeanStdev = useCallback((variableName: string, chainId: string) => {
		const cc = `${chainId}:${variableName}`
		const sData = sequenceData[cc]
		if (sData) {
			return {mean: computeMean(sData), stdev: computeStdev(sData)}
		}
		else return {mean: undefined, stdev: undefined}
	}, [sequenceData])

	const rows = useMemo(() => {
		return variableNames.map(v => {
			const a = {
				key: v,
				values: {
					variableName: v
				} as {[key: string]: any}
			}
			chainIds.forEach(chainId => {
				let {mean, stdev} = computeVariableMeanStdev(v, chainId)
				if (mean !== undefined) mean = parseFloat(mean.toPrecision(3))
				if (stdev !== undefined) stdev = parseFloat(stdev.toPrecision(3))
				a.values[chainId] = mean === undefined ? undefined : (
					`${mean} (${stdev})`
				)
			})
			return a
		})
	}, [variableNames, chainIds, computeVariableMeanStdev])

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

export function computeMean(d: number[]) {
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

export default MeanStdevTable
