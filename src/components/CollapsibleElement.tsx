import { Grid } from "@mui/material";
import { FunctionComponent, PropsWithChildren } from "react";
import { CollapseControl, CollapsedVariablesAction } from "../tabs/TabsUtility";

export type CollapsibleElementProps = {
    variableName: string,
    isCollapsed: boolean,
    collapsedDispatch: (value: CollapsedVariablesAction) => void
}

const CollapsibleElement: FunctionComponent<PropsWithChildren<CollapsibleElementProps>> = (props) => {
    const { variableName, isCollapsed, collapsedDispatch, children } = props
    if (!children) return <div />
    return (
        <div key ={variableName}>
            <div style={{position: 'relative', border: 'solid 2px gray', paddingLeft: 12}}>
                <h2>
                    <CollapseControl collapsed={isCollapsed} onToggle={() => collapsedDispatch({type: 'toggle', variableName})} />
                    {variableName}
                </h2>
                {!isCollapsed && <Grid container spacing={3}>
                    {children}
                </Grid>}
            </div>
            <div>&nbsp;</div>
        </div>
    )
}

export default CollapsibleElement
