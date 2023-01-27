import React, { FunctionComponent, Suspense } from "react";

export type PlotSequence = {
	label: string
	data: number[]
}

type Props = {
	plotSequences: PlotSequence[]
	width: number
	height: number
}

const Plot = React.lazy(() => (import('react-plotly.js')))

const SequencePlotWidget: FunctionComponent<Props> = ({ plotSequences, width, height }) => {
	return (
		<div style={{ position: 'relative', width, height }}>
			<Suspense fallback={<div>Loading plotly</div>}>
				<Plot
					data={
						plotSequences.map(ps => (
							{
								x: [...new Array(ps.data.length).keys()],
								y: ps.data,
								type: 'scatter',
								mode: 'lines+markers',
								// marker: {color: 'black'},
							}
						))
					}
					layout={{ width: width - 50, height, title: '' }}
				/>
			</Suspense>
		</div>
	)
}

export default SequencePlotWidget
