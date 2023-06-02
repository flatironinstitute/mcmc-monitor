import InfoIcon from '@mui/icons-material/Info';
import { Button, FormControl, Grid, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import Popover from '@mui/material/Popover';
import { FunctionComponent, useMemo, useState } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";
import MatrixOfPlots from "../components/MatrixOfPlots";
import SequenceScatterplot from "../components/SequenceScatterplot";
import SequenceScatterplot3D from "../components/SequenceScatterplot3D";
import { PlotSize, PlotSizeSelector, sizeForPlotSize, sizeForPlotSize3d, useSequenceDrawRange } from "./TabsUtility";


type Props = {
    runId: string
    numDrawsForRun: number
    chainColors: {[chainId: string]: string}
    width: number
    height: number
}

type Mode = '2d-matrix' | '2d' | '3d'

const MAX_2D_PLOTS = 20
const MAX_2D_MATRIX_VARIABLES = 5
const MAX_3D_PLOTS = 10

const InfoPopoverContent = () => (
    <div style={{width: '300px', paddingLeft: '15px', paddingRight: '15px'}}>
        <p>
            2D Matrix will display scatterplots in a right upper matrix with
            the same x-axis variable for each row and the same y-axis variable for each column. 2D and 3D display
            the plots in a less structured grid.
        </p>
        <p>
            2D Matrix view is limited to {MAX_2D_MATRIX_VARIABLES} variables
            ({MAX_2D_MATRIX_VARIABLES * (MAX_2D_MATRIX_VARIABLES - 1) /2} plots),
            while 2D is limited to {MAX_2D_PLOTS} plots and 3D is limited to {MAX_3D_PLOTS} plots.
        </p>
    </div>
)

const InfoPopover = () => {
    const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null)
    const openPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElement(event.currentTarget)
    }
    const closePopover = () => {
        setAnchorElement(null)
    }

    const popoverIsOpen = Boolean(anchorElement)

    return <span>
        <Popover
            id="matrixExplainer"
            open={popoverIsOpen}
            anchorEl={anchorElement}
            onClose={closePopover}
            anchorOrigin={{vertical: "bottom", horizontal: "center"}}
        >
            <InfoPopoverContent />
        </Popover>
        <Button
            style={{paddingTop: '9px', marginRight: '5px'}}
            aria-describedby={popoverIsOpen ? "matrixExplainer" : undefined}
            onClick={openPopover}
            title={"Click for more information about scatterplot options."}
        >
            <InfoIcon />
        </Button>
    </span>
}

const ScatterplotsTab: FunctionComponent<Props> = ({ runId, numDrawsForRun, chainColors, width, height }) => {
    const { selectedVariableNames, selectedChainIds, effectiveInitialDrawsToExclude } = useMCMCMonitor()

    const [mode, setMode] = useState<Mode>('2d-matrix')
    const [plotSize, setPlotSize] = useState<PlotSize>('medium')
    const [tooMany, setTooMany] = useState(false)
    const [tooMany3D, setTooMany3D] = useState(false)

    const sequenceHistogramDrawRange = useSequenceDrawRange(numDrawsForRun, effectiveInitialDrawsToExclude)

    const variablePairs = useMemo(() => {
        let ret: { v1: string, v2: string, show: boolean }[] = []
        const vnames = mode === '2d-matrix' ? selectedVariableNames.slice(0, MAX_2D_MATRIX_VARIABLES) : selectedVariableNames
        if (mode === '2d-matrix') {
            if (vnames.length > 1) {
                for (let i = 0; i < vnames.length - 1; i++) {
                    for (let j = 1; j < vnames.length; j++) {
                        ret.push({ v1: selectedVariableNames[j], v2: selectedVariableNames[i], show: j > i })
                    }
                }
            }
        }
        else if (mode === '2d') {
            for (let i = 0; i < vnames.length; i++) {
                for (let j = i + 1; j < vnames.length; j++) {
                    ret.push({ v1: selectedVariableNames[j], v2: selectedVariableNames[i], show: true })
                }
            }
        }

        if (mode === '2d-matrix') {
            if (selectedVariableNames.length > MAX_2D_MATRIX_VARIABLES) {
                setTooMany(true)	
            } else {
                setTooMany(false)
            }
        }
        else if (ret.length > MAX_2D_PLOTS) {
            ret = ret.slice(0, MAX_2D_PLOTS)
            setTooMany(true)
        }
        else setTooMany(false)
        return ret
    }, [selectedVariableNames, mode])

    const variableTriplets = useMemo(() => {
        let ret: { v1: string, v2: string, v3: string }[] = []
        for (let i = 0; i < selectedVariableNames.length; i++) {
            for (let j = i + 1; j < selectedVariableNames.length; j++) {
                for (let k = j + 1; k < selectedVariableNames.length; k++) {
                    ret.push({ v1: selectedVariableNames[i], v2: selectedVariableNames[j], v3: selectedVariableNames[k] })
                }
            }
        }
        if (ret.length > MAX_3D_PLOTS) {
            ret = ret.slice(0, MAX_3D_PLOTS)
            setTooMany3D(true)
        }
        else setTooMany3D(false)
        return ret
    }, [selectedVariableNames])

    return (
        <div style={{ position: 'absolute', width, height }}>
            &nbsp;
            <Grid container>
                <InfoPopover />
                <ModeSelector mode={mode} setMode={setMode} />
                &nbsp;
                {mode !== '2d-matrix' && <PlotSizeSelector plotSize={plotSize} setPlotSize={setPlotSize} />}
            </Grid>
            <div style={{ position: 'absolute', top: 70, width, height: height - 100, overflowY: 'auto' }}>
                {
                    tooMany && (mode === '2d') && (
                        <div>Too many variables selected, only showing first {MAX_2D_PLOTS} plots.</div>
                    )
                }
                {
                    tooMany && (mode === '2d-matrix') && (
                        <div>Too many variables selected, only showing first {MAX_2D_MATRIX_VARIABLES} variables.</div>
                    )
                }
                {
                    tooMany3D && (mode === '3d') && (
                        <div>Too many variables selected, only showing first {MAX_3D_PLOTS} 3D plots.</div>
                    )
                }
                {
                    (['2d', '2d-matrix'].includes(mode)) && (variablePairs.length === 0) ? (
                        <div>Select 2 or more variables to view scatterplots</div>
                    ) : ((mode === '3d') && (variableTriplets.length === 0)) ? (
                        <div>Select 3 or more variables to view 3D scatterplots</div>
                    ) : (
                        <Grid container spacing={3} style={{zIndex: 0}}>
                            {
                                ['2d-matrix'].includes(mode) &&
                                <div style={{paddingTop: 24}}>
                                    <MatrixOfPlots
                                        numColumns={Math.min(MAX_2D_MATRIX_VARIABLES, selectedVariableNames.length) - 1}
                                        width={width}
                                    >
                                        {
                                            variablePairs.map(({ v1, v2, show }, ii) => (
                                                show ? (
                                                        <SequenceScatterplot
                                                            key={ii}
                                                            runId={runId}
                                                            chainIds={selectedChainIds}
                                                            xVariableName={v1}
                                                            yVariableName={v2}
                                                            highlightDrawRange={sequenceHistogramDrawRange}
                                                            chainColors={chainColors}
                                                            width={0}
                                                            height={0}
                                                        />
                                                    )
                                                : (
                                                    <EmptyPlotItem
                                                        key={ii}
                                                        width={0}
                                                        height={0}
                                                    />
                                                )
                                            ))
                                        }
                                    </MatrixOfPlots>
                                </div>
                            }
                            {
                                ['2d'].includes(mode) && variablePairs.map(({ v1, v2 }, ii) => (
                                    <Grid item key={ii}>
                                        <SequenceScatterplot
                                            runId={runId}
                                            chainIds={selectedChainIds}
                                            xVariableName={v1}
                                            yVariableName={v2}
                                            highlightDrawRange={sequenceHistogramDrawRange}
                                            chainColors={chainColors}
                                            {...sizeForPlotSize(plotSize)}
                                        />

                                    </Grid>
                                ))
                            }
                            {
                                ['3d'].includes(mode) && variableTriplets.map(({ v1, v2, v3 }, ii) => (
                                    <Grid item key={ii}>
                                        <SequenceScatterplot3D
                                            runId={runId}
                                            chainIds={selectedChainIds}
                                            xVariableName={v1}
                                            yVariableName={v2}
                                            zVariableName={v3}
                                            highlightDrawRange={sequenceHistogramDrawRange}
                                            chainColors={chainColors}
                                            {...sizeForPlotSize3d(plotSize)}
                                        />
                                    </Grid>
                                ))
                            }
                        </Grid>
                    )
                }
                <div>&nbsp;</div>
                <div>&nbsp;</div>
                <div>&nbsp;</div>
            </div>
        </div>
    )
}

const EmptyPlotItem: FunctionComponent<{width: number, height: number}> = ({width, height}) => {
    return (
        <div
            style={{position: 'relative', width, height}}
        />
    )
}

const ModeSelector: FunctionComponent<{ mode: Mode, setMode: (m: Mode) => void }> = ({ mode, setMode }) => {
    return (
        <FormControl size="small">
            <Select
                value={mode}
                onChange={(evt: SelectChangeEvent<string>) => { setMode(evt.target.value as Mode) }}
            >
                <MenuItem key="2d-matrix" value={'2d-matrix'}>2D scatterplots matrix</MenuItem>
                <MenuItem key="2d" value={'2d'}>2D scatterplots</MenuItem>
                <MenuItem key="3d" value={'3d'}>3D scatterplots</MenuItem>
            </Select>
        </FormControl>
    )
}

export default ScatterplotsTab
