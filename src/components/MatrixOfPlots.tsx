import { Grid } from "@mui/material";
import { FunctionComponent, PropsWithChildren, ReactElement, useMemo } from "react";

type Props = {
	numColumns: number
	width: number
}

const MatrixOfPlots: FunctionComponent<PropsWithChildren<Props>> = ({numColumns, children, width}) => {
	const childList = useMemo(() => (Array.isArray(children) ? children as ReactElement[] : [children] as ReactElement[]), [children])
	const numRows = Math.ceil(childList.length / (numColumns || 1))
	const rowNumbers = [...Array(numRows).keys()]
	const columnNumbers = [...Array(numColumns).keys()]
	const plotWidth = (width - 10) / numColumns
	const plotHeight = plotWidth
	const plotElements = useMemo(() => (
		childList.map((ch, i) => (
			<ch.type key={i} {...ch.props} width={plotWidth} height={plotHeight} />
		))
	), [childList, plotWidth, plotHeight])
	if (numRows === 0) {
		return <div />
	}
	return (
		<Grid container spacing={0}>
			{
				rowNumbers.map(r => (
					<Grid container key={r} spacing={0}>
						{
							columnNumbers.map(c => (
								<Grid item key={c}>
									{
										plotElements[c + r * numColumns]
									}
								</Grid>
							))
						}
					</Grid>
				))
			}
		</Grid>
	)
}

export default MatrixOfPlots
