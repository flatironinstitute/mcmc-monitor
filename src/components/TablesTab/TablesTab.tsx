import { createTheme, ThemeProvider } from "@mui/material";
import { FunctionComponent } from "react";
import { useMCMCMonitor } from "../../MCMCMonitorDataManager/useMCMCMonitor";
import MainTable from "./MainTable";
import VariableTable from "./VariableTable";

type Props = {
	width: number
	height: number
}

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

	return (
		<div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
			<ThemeProvider theme={theme}>
				{
					<span key={0}>
						<MainTable />
					</span>
				}
				{
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

export default TablesTab
