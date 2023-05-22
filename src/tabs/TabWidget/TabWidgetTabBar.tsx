import { Tab, Tabs } from '@mui/material';
import { FunctionComponent } from 'react';

type Props = {
    tabs: {
        label: string
        closeable: boolean
    }[]
    currentTabIndex: number | undefined
    onCurrentTabIndexChanged: (i: number) => void
}

const TabWidgetTabBar: FunctionComponent<Props> = ({ tabs, currentTabIndex, onCurrentTabIndexChanged }) => {
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