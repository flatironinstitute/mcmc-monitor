import { Checkbox, FormControlLabel } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../useMCMCMonitor";

type Props = {
	variableNames: string[]
}

const VariablesSelector: FunctionComponent<Props> = ({variableNames}) => {
	const {selectedVariableNames, setSelectedVariableNames} = useMCMCMonitor()
	return (
		<div>
			<button onClick={() => setSelectedVariableNames([])}>clear</button>
			<div style={{paddingLeft: 8}}>
				{
					variableNames.map(v => (
						<span key={v}>
							<FormControlLabel
								control={<Checkbox style={{padding: 1, transform: 'scale(0.8)'}} onClick={() => setSelectedVariableNames(toggle(selectedVariableNames, v))} checked={selectedVariableNames.includes(v)} />}
								label={v}
							/>
						</span>
					))
				}
			</div>
		</div>
	)
}

function toggle(x: string[], y: string) {
	if (x.includes(y)) return x.filter(a => (a !== y))
	else return [...x, y]
}

export default VariablesSelector
