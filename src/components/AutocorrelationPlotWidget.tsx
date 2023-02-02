import React, { FunctionComponent, Suspense, useMemo } from "react";

type Props = {
	autocorrelationData: {dx: number[], y: number[]} | undefined
	title: string
	variableName: string
	width: number
	height: number
}

const Plot = React.lazy(() => (import('react-plotly.js')))

const AutocorrelationPlotWidget: FunctionComponent<Props> = ({ autocorrelationData, title, width, height, variableName }) => {
	const data = useMemo(() => (
		autocorrelationData ? {
			x: autocorrelationData.dx,
			y: autocorrelationData.y,
			type: 'bar',
			marker: {color: '#506050'}
		} as any : undefined
	), [autocorrelationData])
	return (
		<div style={{ position: 'relative', width, height }}>
			<Suspense fallback={<div>Loading plotly</div>}>
				<Plot
					data={data ? [data] : []}
					layout={{
						width,
						height,
						title: {text: title, font: {size: 12}},
						xaxis: {title: variableName + ' ACF'},
						// yaxis: {title: 'Count'},
						margin: {r: 0}
					}}
				/>
			</Suspense>
		</div>
	)
}

export default AutocorrelationPlotWidget
