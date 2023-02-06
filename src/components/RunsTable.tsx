import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";
import useRoute from "../useRoute";
import Hyperlink from "./Hyperlink";

type Props = any

const RunsTable: FunctionComponent<Props> = () => {
	const { runs } = useMCMCMonitor()
	const { setRoute } = useRoute()

	const columns = useMemo(() => ([
		{ key: 'runId', label: 'Run' }
	]), [])
	const rows = useMemo(() => (
		runs.map(run => ({
			key: `${run.runId}`,
			runId: <Hyperlink onClick={() => setRoute({page: 'run', runId: run.runId})}>{run.runId}</Hyperlink>
		} as { [key: string]: any }))
	), [runs, setRoute])
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

export default RunsTable
