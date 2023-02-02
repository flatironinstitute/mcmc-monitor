import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useCallback, useMemo } from "react";
import { ess } from "../stats/ess";

type Props = {
	chainIds: string[]
    variableNames: string[]
    sequenceData: {[chainVariableCode: string]: number[]}
}

const ESSTable: FunctionComponent<Props> = ({chainIds, variableNames, sequenceData}) => {
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

	const computeESS = useCallback((variableName: string, chainId: string) => {
		const cc = `${chainId}:${variableName}`
		const sData = sequenceData[cc]
		if (sData) {
			return {ess: ess(sData)}
		}
		else return {ess: undefined}
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
				let {ess} = computeESS(v, chainId)
				if (ess !== undefined) ess = parseFloat(ess.toPrecision(3))
				a.values[chainId] = ess === undefined ? undefined : (
					`${ess}`
				)
			})
			return a
		})
	}, [variableNames, chainIds, computeESS])

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

export default ESSTable
