import { FormControl, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";

type Props = any

const SequenceHistogramOptsControl: FunctionComponent<Props> = () => {
	const { sequenceHistogramOpts, setSequenceHistogramOpts } = useMCMCMonitor()
	return (
		<div>
			Iterations to use for histograms
			<FormControl fullWidth>
				<Select
					value={sequenceHistogramOpts.numIterations}
					onChange={(evt: SelectChangeEvent<number>) => {setSequenceHistogramOpts({...sequenceHistogramOpts, numIterations: evt.target.value as number})}}
				>
					<MenuItem key={-1} value={-1}>All</MenuItem>
					{
						[10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000].map(n => (
							<MenuItem key={n} value={n}>Last {n}</MenuItem>
						))
					}
				</Select>
			</FormControl>
		</div>
	)
}

export default SequenceHistogramOptsControl
