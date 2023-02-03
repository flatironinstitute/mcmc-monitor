import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";
import ChainTable from "./ChainTable";

type Props = {
	width: number
	height: number
}

const TablesTab: FunctionComponent<Props> = ({width, height}) => {
	const {selectedVariableNames, selectedChainIds} = useMCMCMonitor()

	return (
		<div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
			{
				selectedChainIds.map(chainId => (
					<span key={chainId}>
						<h3>Chain: {chainId}</h3>
						<ChainTable
							chainId={chainId}
							variableNames={selectedVariableNames}
						/>
					</span>
				))
			}
		</div>
	)
}

export default TablesTab
