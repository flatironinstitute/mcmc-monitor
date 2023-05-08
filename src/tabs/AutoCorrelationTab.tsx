import { Grid } from "@mui/material";
import { Fragment, FunctionComponent, useMemo, useReducer, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import AutocorrelationPlot from "../components/AutocorrelationPlot";
import CollapsibleElement from "../components/CollapsibleElement";
import DiagnosticsTabFrame from "./DiagnosticsTabFrame";
import { CollapsibleContentTabProps, PlotSize, collapsedVariablesReducer, scaleForPlotSize, useSequenceDrawRange } from "./TabsUtility";

type AcfProps = CollapsibleContentTabProps & {
    selectedVariableName: string
    selectedChainIds: string[]
    samplesRange: [number, number]
    sizeScale: number
}

const AcfPlot: FunctionComponent<AcfProps> = (props) => {
    const { runId, selectedVariableName, selectedChainIds, samplesRange, sizeScale, width } = props

    return (
        <Fragment>
            {
                selectedChainIds.map(chainId => (
                        <Grid item key={chainId}>
                            <AutocorrelationPlot
                                runId={runId}
                                chainId={chainId}
                                variableName={selectedVariableName}
                                drawRange={samplesRange}
                                width={Math.min(width, 300 * sizeScale)}
                                height={450 * sizeScale}
                            />
                        </Grid>
                ))
            }
        </Fragment>
    )
}

const AutoCorrelationTab: FunctionComponent<CollapsibleContentTabProps> = (props) => {
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
                <AcfPlot
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

export default AutoCorrelationTab
