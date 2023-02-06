import { createTheme, FormControlLabel, Radio, ThemeProvider } from "@mui/material";
import { FunctionComponent, useState } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";
import ChainTable from "./ChainTable";
import VariableTable from "./VariableTable";

type Props = {
	width: number
	height: number
}

type GroupingMode = 'by-chain' | 'by-variable'

const theme = createTheme({
	components: {
		MuiTableCell: {
			styleOverrides: {
				root: {padding: 0}
			}
		}
	}
});

const TablesTab: FunctionComponent<Props> = ({width, height}) => {
	const {selectedVariableNames, selectedChainIds} = useMCMCMonitor()
	const [groupingMode, setGroupingMode] = useState<GroupingMode>('by-chain')

	return (
		<div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
			<ThemeProvider theme={theme}>
				<SelectGroupingMode groupingMode={groupingMode} setGroupingMode={setGroupingMode} />
				{
					groupingMode === 'by-chain' &&
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
				{
					groupingMode === 'by-variable' &&
					selectedVariableNames.map(variableName => (
						<span key={variableName}>
							<h3>Variable: {variableName}</h3>
							<VariableTable
								variableName={variableName}
								chainIds={selectedChainIds}
							/>
						</span>
					))
				}
			</ThemeProvider>
		</div>
	)
}

const SelectGroupingMode: FunctionComponent<{groupingMode: GroupingMode, setGroupingMode: (g: GroupingMode) => void}> = ({groupingMode, setGroupingMode}) => {
	return (
		<div>
			Group by:&nbsp;&nbsp;&nbsp;
			<FormControlLabel
				label="Chain"
				control={<Radio checked={groupingMode === 'by-chain'} />}
				onClick={() => setGroupingMode('by-chain')}
			/>
			<FormControlLabel
				label="Variable"
				control={<Radio checked={groupingMode === 'by-variable'} />}
				onClick={() => setGroupingMode('by-variable')}
			/>
		</div>
	)
}

export default TablesTab
