import { Checkbox } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";

type Props = {
	variableNames: string[]
}

const VariablesSelector: FunctionComponent<Props> = ({variableNames}) => {
	const {selectedVariableNames, setSelectedVariableNames} = useMCMCMonitor()
	return (
		<div>
			{
				variableNames.map(v => (
					<span key={v}>
						<Checkbox style={{padding: 1, transform: 'scale(0.9)'}} onClick={() => setSelectedVariableNames(toggle(selectedVariableNames, v))} checked={selectedVariableNames.includes(v)} />
						<span>{v}</span>
						&nbsp;&nbsp;
					</span>
				))
			}
		</div>
	)
}

function toggle(x: string[], y: string) {
	if (x.includes(y)) return x.filter(a => (a !== y))
	else return [...x, y]
}

export default VariablesSelector
