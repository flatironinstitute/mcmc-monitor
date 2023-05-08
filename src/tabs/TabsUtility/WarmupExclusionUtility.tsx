import { Checkbox, FormControlLabel } from "@mui/material";
import { FunctionComponent, useMemo } from "react";


export type ExcludeWarmups = {
    excludeWarmups: boolean
}

export type SetExcludeWarmups = (a: ExcludeWarmups) => void

type SelectorProps = {
    excludeWarmups: ExcludeWarmups,
    setExcludeWarmups: SetExcludeWarmups
}

export const useSequenceDrawRange = (numDrawsForRun: number, effectiveInitialDrawsToExclude: number): [number, number] => {
    const sequenceDrawRange: [number, number] = useMemo(() => {
        return [Math.min(effectiveInitialDrawsToExclude, numDrawsForRun), numDrawsForRun]
    }, [numDrawsForRun, effectiveInitialDrawsToExclude])

    return sequenceDrawRange
}

export const initialWarmupInclusionSelection: ExcludeWarmups = {
    excludeWarmups: false,
}

export const selectorItems = [
    {
        key: 'excludeWarmups',
        label: 'exclude warmup iterations from plots'
    },
]

export const ExcludeWarmupsSelector: FunctionComponent<SelectorProps> = (props: SelectorProps) => {
    const { excludeWarmups, setExcludeWarmups } = props
    return <div />
    // Note: setting as no-op until warmup inclusion toggle is implemented
    return (
        <div>
            {
                selectorItems.map(item => (
                    <FormControlLabel
                        key={item.key}
                        control={
                            <Checkbox
                                checked={(excludeWarmups as any)[item.key]}
                                onClick={() => setExcludeWarmups({...excludeWarmups, [item.key]: !(excludeWarmups as any)[item.key]})}
                            />
                        }
                        label={item.label}
                    />
                ))
            }
        </div>
    )
}