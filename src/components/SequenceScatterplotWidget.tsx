import React, { FunctionComponent, Suspense } from "react";

export type ScatterplotSequence = {
	label: string
	xData: number[]
	yData: number[]
}

type Props = {
	scatterplotSequences: ScatterplotSequence[]
	xVariableName: string
	yVariableName: string
	width: number
	height: number
}

const Plot = React.lazy(() => (import('react-plotly.js')))

const SequenceScatterplotWidget: FunctionComponent<Props> = ({ scatterplotSequences, xVariableName, yVariableName, width, height }) => {
	return (
		<div style={{ position: 'relative', width, height }}>
			<Suspense fallback={<div>Loading plotly</div>}>
				<Plot
					data={
						scatterplotSequences.map(ss => (
							{
								x: ss.xData,
								y: ss.yData,
								type: 'scatter',
								mode: 'markers',
								// marker: {color: 'black'},
							}
						))
					}
					layout={{
						width,
						height,
						title: '',
						yaxis: {title: yVariableName},
						xaxis: {title: xVariableName},
						margin: {
							t: 30, b: 40, r: 0
						},
						showlegend: false
					}}
				/>
			</Suspense>
		</div>
	)
}

export default SequenceScatterplotWidget
