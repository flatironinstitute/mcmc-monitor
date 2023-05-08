import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { FunctionComponent } from "react";


export type CollapsibleContentTabProps = {
    runId: string
    numDrawsForRun: number
    chainColors: {[chainId: string]: string}
    width: number
    height: number
}

export type CollapsedVariablesState = {[variableName: string]: boolean}

export type CollapsedVariablesAction = {
    type: 'toggle'
    variableName: string
}

type CollapseControlProps = {
    collapsed: boolean,
    onToggle: () => void
}


export const CollapseControl: FunctionComponent<CollapseControlProps> = ({collapsed, onToggle}) => {
    return <IconButton onClick={onToggle}>
        { collapsed ? <KeyboardArrowRight /> : <KeyboardArrowDown /> }
    </IconButton>
}

export const collapsedVariablesReducer = (s: CollapsedVariablesState, a: CollapsedVariablesAction): CollapsedVariablesState => {
    if (a.type === 'toggle') {
        return {
            ...s,
            [a.variableName]: s[a.variableName] ? false : true
        }
    }
    else return s
}


