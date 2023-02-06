import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FunctionComponent, useCallback, useMemo } from "react";
import { useMCMCMonitor } from "../../useMCMCMonitor";
import ChainOrVariableTable from "./ChainOrVariableTable";

type Props = {
	chainId: string
	variableNames: string[]
}

const ChainTable: FunctionComponent<Props> = ({chainId, variableNames}) => {
	return (
		<ChainOrVariableTable
			chainId={chainId}
			variableNames={variableNames}
		/>
	)
}

export default ChainTable
