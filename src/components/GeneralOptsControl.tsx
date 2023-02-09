import { FormControl, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";

type Props = any

const GeneralOptsControl: FunctionComponent<Props> = () => {
	const { generalOpts, setGeneralOpts, updateExistingSequences, selectedRunId: runId } = useMCMCMonitor()
	if (!runId) return <div>No runId</div>
	return (
		<div>
			Exclude draws
			<FormControl fullWidth size="small">
				<Select
					value={generalOpts.excludeInitialDraws}
					onChange={(evt: SelectChangeEvent<number>) => {setGeneralOpts({...generalOpts, excludeInitialDraws: evt.target.value as number})}}
				>
					<MenuItem key={0} value={0}>None</MenuItem>
					{
						[10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000].map(n => (
							<MenuItem key={n} value={n}>First {n}</MenuItem>
						))
					}
				</Select>
			</FormControl>
			<div>&nbsp;</div>
			Data refresh
			<FormControl fullWidth size="small">
				<Select
					value={generalOpts.dataRefreshMode}
					onChange={(evt: SelectChangeEvent<string>) => {setGeneralOpts({...generalOpts, dataRefreshMode: evt.target.value as ('auto' | 'manual')})}}
				>
					<MenuItem key={'manual'} value={'manual'}>Manual</MenuItem>
					<MenuItem key={'auto'} value={'auto'}>Auto</MenuItem>
				</Select>
			</FormControl>
			{
				generalOpts.dataRefreshMode === 'auto' && (
					<span>
						<div>&nbsp;</div>
						Refresh interval
						<FormControl fullWidth size="small">
							<Select
								value={generalOpts.dataRefreshIntervalSec}
								onChange={(evt: SelectChangeEvent<number>) => {setGeneralOpts({...generalOpts, dataRefreshIntervalSec: evt.target.value as number})}}
							>
								{
									[2, 5, 10, 30, 60, 120, 300].map(n => (
										<MenuItem key={n} value={n}>{n} sec</MenuItem>
									))
								}
							</Select>
						</FormControl>
					</span>
				)
			}
			<div>&nbsp;</div>
			{
				generalOpts.dataRefreshMode === 'manual' && (
					<span style={{fontSize: 16}}>
						<button onClick={() => {updateExistingSequences(runId)}}>update data</button>
					</span>
				)
			}
		</div>
	)
}

export default GeneralOptsControl
