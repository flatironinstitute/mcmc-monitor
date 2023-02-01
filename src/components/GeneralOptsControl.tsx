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