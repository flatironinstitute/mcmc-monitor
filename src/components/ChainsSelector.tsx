import { Checkbox, FormControlLabel } from "@mui/material";
import { FunctionComponent } from "react";
import { MCMCChain } from "../../service/src/types/MCMCMonitorTypes";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";

type Props = {
	chains: MCMCChain[]
	allChainIds: string[]
	chainColors: {[chainId: string]: string}
}

const ChainsSelector: FunctionComponent<Props> = ({chains, allChainIds, chainColors}) => {
	const {selectedChainIds, setSelectedChainIds} = useMCMCMonitor()
	return (
		<div>
			<button onClick={() => setSelectedChainIds([])}>clear</button>
			&nbsp;
			<button onClick={() => setSelectedChainIds(allChainIds)}>select all</button>
			<div style={{paddingLeft: 8}}>
				{
					chains.map(c => (
						<span key={c.chainId}>
							<FormControlLabel
								control={
									<Checkbox
										style={{padding: 1, transform: 'scale(0.8)'}}
										onClick={() => setSelectedChainIds(toggle(selectedChainIds, c.chainId))}
										checked={selectedChainIds.includes(c.chainId)} />
								}
								label={<span><span style={{color: chainColors[c.chainId] || 'black'}}>&#9632;</span> {c.chainId}</span>}
							/>
							<br />
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

export default ChainsSelector
