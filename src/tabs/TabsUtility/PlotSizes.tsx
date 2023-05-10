import { FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { FunctionComponent } from "react";

export type PlotSize = 'small' | 'medium' | 'large' | 'xlarge'

export const scaleForPlotSize = (size: PlotSize | undefined): number => {
    switch (size) {
        case 'small':
            return 0.7
        case 'medium':
        default:
            return 1
        case 'large':
            return 1.3
        case 'xlarge':
            return 1.6
    }
}

export type PlotDimensions = {
    width: number,
    height: number
}

export const sizeForPlotSize = (size: PlotSize | undefined): PlotDimensions => {
    switch (size) {
        case 'small':
            return { width: 200, height: 200 }
        case 'medium':
        default:
            return { width: 400, height: 400 }
        case 'large':
            return { width: 700, height: 700 }
        case 'xlarge':
            return { width: 1000, height: 1000 }
    }
}

export const sizeForPlotSize3d = (size: PlotSize | undefined): PlotDimensions => {
    switch (size) {
        case 'small':
            return { width: 300, height: 300 }
        case 'medium':
        default:
            return { width: 600, height: 600 }
        case 'large':
            return { width: 1000, height: 1000 }
        case 'xlarge':
            return { width: 1500, height: 1500 }
    }
}

export const PlotSizeSelector: FunctionComponent<{ plotSize: PlotSize, setPlotSize: (ps: PlotSize) => void }> = ({ plotSize, setPlotSize }) => {
	return (
		<FormControl size="small">
			<Select
				value={plotSize}
				onChange={(evt: SelectChangeEvent<string>) => { setPlotSize(evt.target.value as PlotSize) }}
			>
				<MenuItem key="small" value={'small'}>Small</MenuItem>
				<MenuItem key="medium" value={'medium'}>Medium</MenuItem>
				<MenuItem key="large" value={'large'}>Large</MenuItem>
				<MenuItem key="xlarge" value={'xlarge'}>Extra large</MenuItem>
			</Select>
		</FormControl>
	)
}
