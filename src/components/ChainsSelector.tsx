import { Checkbox } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../MCMCMonitorData";
import { MCMCChain } from "../MCMCMonitorTypes";

type Props = {
	chains: MCMCChain[]
}

const ChainsSelector: FunctionComponent<Props> = ({chains}) => {
	const {selectedChainIds, setSelectedChainIds} = useMCMCMonitor()
	return (
		<div>
			{
				chains.map(c => (
					<span key={c.chainId}>
						<span><Checkbox onClick={() => setSelectedChainIds(toggle(selectedChainIds, c.chainId))} checked={selectedChainIds.includes(c.chainId)} /><span>{c.chainId}</span></span>
						<br />
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

export default ChainsSelector
