import React, { FunctionComponent, Suspense, useMemo } from "react";
import { SequenceHistogramOpts } from "./SequenceHistogram";

export type PlotSequence = {
	label: string
	data: number[]
}

type Props = {
	plotSequences: PlotSequence[]
	variableName: string
	highlightIterationRange?: [number, number]
	width: number
	height: number
}

const Plot = React.lazy(() => (import('react-plotly.js')))

const SequencePlotWidget: FunctionComponent<Props> = ({ plotSequences, variableName, highlightIterationRange, width, height }) => {
	const shapes = useMemo(() => (
		(highlightIterationRange ? (
			[{type: 'rect', x0: highlightIterationRange[0], x1: highlightIterationRange[1], y0: 0, y1: 1, yref: 'paper', fillcolor: 'yellow', opacity: 0.1}]
		) : []) as any
	), [highlightIterationRange])
	return (
		<div style={{ position: 'relative', width, height }}>
			<Suspense fallback={<div>Loading plotly</div>}>
				<Plot
					data={
						plotSequences.map(ps => (
							{
								x: [...new Array(ps.data.length).keys()].map(i => (i + 1)),
								y: ps.data,
								type: 'scatter',
								mode: 'lines+markers',
								// marker: {color: 'black'},
							}
						))
					}
					layout={{
						width: width,
						height,
						title: '',
						yaxis: {title: variableName},
						xaxis: {title: 'Iteration'},
						shapes,
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

export default SequencePlotWidget
