import { FormControl, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";

type Props = {
	runId: string
}

const GeneralOptsControl: FunctionComponent<Props> = ({runId}) => {
	const { generalOpts, setGeneralOpts, updateExistingSequences } = useMCMCMonitor()
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
			Data update mode
			<FormControl fullWidth size="small">
				<Select
					value={generalOpts.updateMode}
					onChange={(evt: SelectChangeEvent<string>) => {setGeneralOpts({...generalOpts, updateMode: evt.target.value as ('auto' | 'manual')})}}
				>
					<MenuItem key={'manual'} value={'manual'}>Manual</MenuItem>
					<MenuItem key={'auto'} value={'auto'}>Auto</MenuItem>
				</Select>
			</FormControl>
			<div>&nbsp;</div>
			{
				generalOpts.updateMode === 'manual' && (
					<span style={{fontSize: 16}}>
						<button onClick={() => {updateExistingSequences(runId)}}>update data</button>
					</span>
				)
			}
		</div>
	)
}

export default GeneralOptsControl
