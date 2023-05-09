import { Grid } from "@mui/material";
import { Dispatch, FunctionComponent, PropsWithChildren, SetStateAction, useState } from "react";
import { ExcludeWarmups, ExcludeWarmupsSelector, PlotSize, PlotSizeSelector, initialWarmupInclusionSelection } from "./TabsUtility";

type DiagnosticsTabFrameProps = {
    width: number,
    height: number,
    plotSize: PlotSize,
    setPlotSize: Dispatch<SetStateAction<PlotSize>>
}

const DiagnosticsTabFrame: FunctionComponent<PropsWithChildren<DiagnosticsTabFrameProps>> = (props) => {
    const {width, height, plotSize, setPlotSize, children} = props
    // The exclude-warmups state will probably also move up in a future iteration
    const [excludeWarmups, setExcludeWarmups] = useState<ExcludeWarmups>(initialWarmupInclusionSelection)

    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <Grid container>
                <ExcludeWarmupsSelector excludeWarmups={excludeWarmups} setExcludeWarmups={setExcludeWarmups} />
                <PlotSizeSelector plotSize={plotSize} setPlotSize={setPlotSize} />
            </Grid>
                {children}
            <div>&nbsp;</div>
        </div>
    )
}

export default DiagnosticsTabFrame
