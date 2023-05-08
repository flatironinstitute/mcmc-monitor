import { Grid } from "@mui/material";
import { Fragment, FunctionComponent, useMemo, useReducer, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import CollapsibleElement from "../components/CollapsibleElement";
import SequenceHistogram from "../components/SequenceHistogram";
import DiagnosticsTabFrame from "./DiagnosticsTabFrame";
import { CollapsibleContentTabProps, PlotSize, collapsedVariablesReducer, scaleForPlotSize, useSequenceDrawRange } from "./TabsUtility";

type HistogramProps = CollapsibleContentTabProps & {
    samplesRange: [number, number]
    selectedVariableName: string
    selectedChainIds: string[]
    sizeScale: number
}

const HistogramPlot: FunctionComponent<HistogramProps> = (props) => {
    const { selectedChainIds, samplesRange, width, sizeScale, runId, selectedVariableName } = props
    // memoize this?
    return (
        <Fragment>
            {
                // histograms for individual chains
                selectedChainIds.map(chainId => (
                    <Grid item key={chainId}>
                        <SequenceHistogram
                            runId={runId}
                            chainId={chainId}
                            title={chainId}
                            variableName={selectedVariableName}
                            drawRange={samplesRange}
                            width={Math.min(width, 300 * sizeScale)}
                            height={450 * sizeScale}
                        />
                    </Grid>
                ))
            }
            {
                // histogram for all chains
                <Grid item key={"___all_chains"}>
                    <SequenceHistogram
                        runId={runId}
                        chainId={selectedChainIds}
                        title="All selected chains"
                        variableName={selectedVariableName}
                        drawRange={samplesRange}
                        width={Math.min(width, 300 * sizeScale)}
                        height={450 * sizeScale}
                    />
                </Grid>
            }
        </Fragment>
    )
}

const HistogramTab: FunctionComponent<CollapsibleContentTabProps> = (props) => {
    const { numDrawsForRun, width, height } = props
    const { selectedVariableNames, selectedChainIds, effectiveInitialDrawsToExclude } = useMCMCMonitor()
    const [collapsedVariables, collapsedVariablesDispatch] = useReducer(collapsedVariablesReducer, {})
    const samplesRange = useSequenceDrawRange(numDrawsForRun, effectiveInitialDrawsToExclude)
    const [plotSize, setPlotSize] = useState<PlotSize>('medium')
    const sizeScale = useMemo(() => scaleForPlotSize(plotSize), [plotSize])

    const plots = selectedVariableNames.map(v => {
        return (
            <CollapsibleElement
                key={v}
                variableName={v}
                isCollapsed={collapsedVariables[v]}
                collapsedDispatch={collapsedVariablesDispatch}
            >
                <HistogramPlot
                    {...props}
                    selectedVariableName={v}
                    selectedChainIds={selectedChainIds}
                    sizeScale={sizeScale}
                    samplesRange={samplesRange}
                />
            </CollapsibleElement>
        )
    })

    return (
        <DiagnosticsTabFrame
            width={width}
            height={height}
            plotSize={plotSize}
            setPlotSize={setPlotSize}
        >
            {plots}
        </DiagnosticsTabFrame>
    )
}

export default HistogramTab
