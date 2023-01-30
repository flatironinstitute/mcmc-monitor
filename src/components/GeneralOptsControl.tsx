import { FormControl, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";

type Props = {
	runId: string
}

const GeneralOptsControl: FunctionComponent<Props> = ({runId}) => {
	const { generalOpts, setGeneralOpts, updateExistingSequences } = useMCMCMonitor()
	return (
		<div>
			Update mode
			<FormControl fullWidth>
				<Select
					value={generalOpts.updateMode}
					onChange={(evt: SelectChangeEvent<string>) => {setGeneralOpts({...generalOpts, updateMode: evt.target.value as ('auto' | 'manual')})}}
				>
					<MenuItem key={'manual'} value={'manual'}>Manual</MenuItem>
					<MenuItem key={'auto'} value={'auto'}>Auto</MenuItem>
				</Select>
			</FormControl>
			{
				generalOpts.updateMode === 'manual' && (
					<button onClick={() => {updateExistingSequences(runId)}}>Update</button>
				)
			}
		</div>
	)
}

export default GeneralOptsControl
