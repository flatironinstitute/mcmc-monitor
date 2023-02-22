import { FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";

type Props = {
    warmupOptions: number[],
    detectedInitialDrawExclusion?: number
}

const GeneralOptsControl: FunctionComponent<Props> = (props: Props) => {
    const { warmupOptions, detectedInitialDrawExclusion } = props
	const { generalOpts, setGeneralOpts, updateKnownData, selectedRunId: runId } = useMCMCMonitor()
	if (!runId) return <div>No runId</div>
	return (
		<div>
			Exclude draws
			<FormControl fullWidth size="small">
				<Select
					value={generalOpts.requestedInitialDrawsToExclude}
					onChange={(evt: SelectChangeEvent<number>) => {setGeneralOpts({...generalOpts, requestedInitialDrawsToExclude: evt.target.value as number})}}
				>
                    {getReadFromFileOptionText(detectedInitialDrawExclusion)}
					<MenuItem key={0} value={0}>None</MenuItem>
					{getWarmupCountList(warmupOptions)}
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
				// generalOpts.dataRefreshMode === 'manual' && (
				<span style={{fontSize: 16}}>
					<button onClick={() => {updateKnownData(runId)}}>refresh data</button>
				</span>
				// )
			}
		</div>
	)
}


const getReadFromFileOptionText = (detectedInitialDrawExclusion: number | undefined) => {
    const value = detectedInitialDrawExclusion === undefined ? "" : ` (${detectedInitialDrawExclusion})`
    const text = `Read from file${value}`
    return <MenuItem key={-1} value={-1}>{text}</MenuItem>
}


const getWarmupCountList = (warmupOptions: number[]) => {
    return warmupOptions.map(n => (
        <MenuItem key={n} value={n}>First {n}</MenuItem>
    ))
}

export default GeneralOptsControl
