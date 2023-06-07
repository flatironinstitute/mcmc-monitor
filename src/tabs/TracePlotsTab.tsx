import { Grid } from "@mui/material";
import { FunctionComponent, useMemo, useReducer, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import CollapsibleElement from '../components/CollapsibleElement';
import SequencePlot from "../components/SequencePlot";
import CollapsibleTabFrame from "./CollapsibleTabFrame";
import { CollapsibleContentTabProps, PlotSize, collapsedVariablesReducer, scaleForPlotSize, useSequenceDrawRange } from "./TabsUtility";


type TimeSeriesPlotProps = CollapsibleContentTabProps & {
    sizeScale: number
    selectedVariableName: string
}

const TracePlot: FunctionComponent<TimeSeriesPlotProps> = (props) => {
    const { runId, chainColors, numDrawsForRun, sizeScale, selectedVariableName, width } = props
    const { selectedChainIds, effectiveInitialDrawsToExclude } = useMCMCMonitor()
    const samplesRange = useSequenceDrawRange(numDrawsForRun, effectiveInitialDrawsToExclude)

    return (
        <Grid item key="sequence-plot">
            <SequencePlot
                runId={runId}
                chainIds={selectedChainIds}
                chainColors={chainColors}
                variableName={selectedVariableName}
                highlightDrawRange={samplesRange}
                width={Math.min(width, 700 * sizeScale)}
                height={450 * sizeScale}
            />
        </Grid>
    )
}

const TracePlotsTab: FunctionComponent<CollapsibleContentTabProps> = (props) => {
    const { width, height } = props
    const {selectedVariableNames } = useMCMCMonitor()
    const [collapsedVariables, collapsedVariablesDispatch] = useReducer(collapsedVariablesReducer, {})
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
                <TracePlot
                    {...props}
                    selectedVariableName={v}
                    sizeScale={sizeScale}
                />
            </CollapsibleElement>)
    })

    return (
        <CollapsibleTabFrame
            width={width}
            height={height}
            plotSize={plotSize}
            setPlotSize={setPlotSize}
        >
            {plots}
        </CollapsibleTabFrame>
    )
}

export default TracePlotsTab
