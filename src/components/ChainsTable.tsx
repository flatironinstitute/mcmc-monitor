import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useMemo } from "react";
import { MCMCChain } from "../MCMCMonitorTypes";
import useRoute from "../useRoute";
import Hyperlink from "./Hyperlink";

type Props = {
	chains: MCMCChain[]
}

const ChainsTable: FunctionComponent<Props> = ({chains}) => {
	const { setRoute } = useRoute()

	const columns = useMemo(() => ([
		{ key: 'runId', label: 'Run' },
		{ key: 'chainId', label: 'Chain' },
		// { key: 'variableNames', label: 'Variables' }
	]), [])
	const rows = useMemo(() => (
		chains.map(chain => ({
			key: `${chain.chainId}`,
			runId: chain.runId,
			chainId: <Hyperlink onClick={() => setRoute({page: 'chain', runId: chain.runId, chainId: chain.chainId})}>{chain.chainId}</Hyperlink>,
			// variableNames: chain.variableNames.join(', ')
		} as { [key: string]: any }))
	), [chains, setRoute])
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
									<TableCell key={c.key}>{row[c.key]}</TableCell>
								))
							}
						</TableRow>
					))
				}
			</TableBody>
		</Table>
	)
}

export default ChainsTable
