import React, { FunctionComponent, Suspense } from "react";

export type Scatterplot3DSequence = {
	label: string
	xData: number[]
	yData: number[]
	zData: number[]
	color: string
}

type Props = {
	scatterplot3DSequences: Scatterplot3DSequence[]
	xVariableName: string
	yVariableName: string
	zVariableName: string
	width: number
	height: number
}

const Plot = React.lazy(() => (import('react-plotly.js')))

const SequenceScatterplot3DWidget: FunctionComponent<Props> = ({ scatterplot3DSequences, xVariableName, yVariableName, zVariableName, width, height }) => {
	return (
		<div style={{ position: 'relative', width, height }}>
			<Suspense fallback={<div>Loading plotly</div>}>
				<Plot
					data={
						scatterplot3DSequences.map(ss => (
							{
								x: ss.xData,
								y: ss.yData,
								z: ss.zData,
								type: 'scatter3d',
								mode: 'markers',
								marker: {size: 3, color: ss.color}
							}
						))
					}
					layout={{
						width,
						height,
						title: '',
						scene: {
							xaxis: {title: xVariableName},
							yaxis: {title: yVariableName},
							zaxis: {title: zVariableName}
						},
						showlegend: false
					}}
				/>
			</Suspense>
		</div>
	)
}

export default SequenceScatterplot3DWidget
