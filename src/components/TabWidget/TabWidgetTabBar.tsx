import { Tab, Tabs } from '@mui/material';
import { FunctionComponent, useEffect } from 'react';

type Props = {
    tabs: {
        label: string
        closeable: boolean
    }[]
    currentTabIndex: number | undefined
    onCurrentTabIndexChanged: (i: number) => void
}

const TabWidgetTabBar: FunctionComponent<Props> = ({ tabs, currentTabIndex, onCurrentTabIndexChanged }) => {
    useEffect(() => {
        if (currentTabIndex === undefined) {
            if (tabs.length > 0) {
                onCurrentTabIndexChanged(0)
            }
        }
    }, [currentTabIndex, onCurrentTabIndexChanged, tabs.length])
    const classes = ['ViewContainerTabBar']
    return (
        <Tabs
            value={currentTabIndex || 0}
            scrollButtons="auto"
            variant="scrollable"
            className={classes.join(' ')}
            onChange={(e, value) => {onCurrentTabIndexChanged(value)}}
        >
            {tabs.map((tab, i) => (
                <Tab key={i} label={tab.label} />
            ))}
        </Tabs>
    )
}

export default TabWidgetTabBar