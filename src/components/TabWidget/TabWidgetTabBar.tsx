import { IconButton, Tab, Tabs } from '@mui/material';
import { default as React, FunctionComponent, useCallback, useEffect, useMemo } from 'react';
import {CheckBoxOutlineBlank, Close} from '@mui/icons-material'

type Props = {
    tabs: {
        label: string
        closeable: boolean
    }[]
    currentTabIndex: number | undefined
    onCurrentTabIndexChanged: (i: number) => void
    onTabClosed: (i: number) => void
}

const TabWidgetTabBar: FunctionComponent<Props> = ({ tabs, currentTabIndex, onCurrentTabIndexChanged, onTabClosed }) => {
    useEffect(() => {
        if (currentTabIndex === undefined) {
            if (tabs.length > 0) {
                onCurrentTabIndexChanged(0)
            }
        }
    }, [currentTabIndex, onCurrentTabIndexChanged, tabs.length])
    const handleClickTab = useCallback((index: number) => {
        onCurrentTabIndexChanged(index)
    }, [onCurrentTabIndexChanged])
    const classes = ['ViewContainerTabBar']
    const opts = useMemo(() => (
        tabs.map((tab, i) => (
            {selected: (i === currentTabIndex)}
        ))
    ), [tabs, currentTabIndex])
    return (
        <Tabs
            value={currentTabIndex || 0}
            scrollButtons="auto"
            variant="scrollable"
            className={classes.join(' ')}
        >
            {tabs.map((tab, i) => (
                <TabWidgetTab
                    key={i}
                    tab={tab}
                    tabIndex={i}
                    onClick={handleClickTab}
                    onClose={tab.closeable ? onTabClosed : undefined}
                    opts={opts[i]}
                />
            ))}
        </Tabs>
    )
}

type TabProps = {
    tab: {label: string}
    tabIndex: number
    onClose?: (i: number) => void
    opts: {selected?: boolean}
    onClick: (i: number) => void
}

const TabWidgetTab: FunctionComponent<TabProps> = ({tab, onClose, opts, onClick, tabIndex}) => {
    // thanks: https://stackoverflow.com/questions/63265780/react-material-ui-tabs-close/63277341#63277341
    // thanks also: https://www.freecodecamp.org/news/reactjs-implement-drag-and-drop-feature-without-using-external-libraries-ad8994429f1a/
    const icon = useMemo(() => (<CheckBoxOutlineBlank />), [])
    const handleClick = useCallback(() => {
        onClick(tabIndex)
    }, [onClick, tabIndex])
    const label = (
        <div
            style={{whiteSpace: 'nowrap'}}
            // draggable
            // onDragStart={(e) => {e.dataTransfer.setData('viewId', view.viewId);}}
            onClick={handleClick}
        >
            {<icon.type {...icon.props} style={{paddingRight: 5, paddingLeft: 3, paddingTop: 0, width: 20, height: 20, display: 'inline', verticalAlign: 'middle'}} />}
            <span style={{display: 'inline', verticalAlign: 'middle'}}>{tab.label}</span>
            <span>&nbsp;</span>
            {
                onClose && (
                    <IconButton
                        component="div"
                        onClick={() => onClose(tabIndex)}
                        className="CloseButton"
                        style={{padding: 0}}
                    >
                        <Close
                            style={{
                                display: 'inline',
                                verticalAlign: 'middle',
                                fontSize: 20
                            }}
                        />
                    </IconButton>
                )
            }
        </div>
    )
    const style: React.CSSProperties = useMemo(() => (opts.selected ? {color: 'black', fontWeight: 'bold'} : {color: 'gray'}), [opts.selected])
    return (
        <Tab key={tabIndex} label={label} className="Tab" style={style} />
    )
}

export default TabWidgetTabBar