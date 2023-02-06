import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useCallback, useMemo } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";
import ChainOrVariableTable from "./ChainOrVariableTable";

type Props = {
	chainIds: string[]
	variableName: string
}

const VariableTable: FunctionComponent<Props> = ({chainIds, variableName}) => {
	return (
		<ChainOrVariableTable
			chainIds={chainIds}
			variableName={variableName}
		/>
	)
}

export default VariableTable
