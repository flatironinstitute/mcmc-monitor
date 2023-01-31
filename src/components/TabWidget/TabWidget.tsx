import { FunctionComponent, PropsWithChildren, useEffect, useState } from "react";
import TabWidgetTabBar from "./TabWidgetTabBar";

type Props = {
    tabs: {
        label: string
        closeable: boolean
    }[]
    width: number
    height: number
}

// needs to correspond to css (not best system) - see mountainview.css
const tabBarHeight = 30 + 25

const TabWidget: FunctionComponent<PropsWithChildren<Props>> = ({children, tabs, width, height}) => {
    const [currentTabIndex, setCurrentTabIndex] = useState<number | undefined>(undefined)
    const children2 = Array.isArray(children) ? (children as React.ReactElement[]) : ([children] as React.ReactElement[])
    if ((children2 || []).length !== tabs.length) {
        throw Error(`TabWidget: incorrect number of tabs ${(children2 || []).length} <> ${tabs.length}`)
    }
    const hMargin = 8
    const vMargin = 8
    const W = (width || 300) - hMargin * 2
    const H = height - vMargin * 2
    const [hasBeenVisible, setHasBeenVisible] = useState<number[]>([])
    useEffect(() => {
        if (currentTabIndex === undefined) return
        if (!hasBeenVisible.includes(currentTabIndex)) {
            setHasBeenVisible([...hasBeenVisible, currentTabIndex])
        }
    }, [currentTabIndex, hasBeenVisible])
    return (
        <div
            style={{position: 'absolute', left: hMargin, top: vMargin, width: W, height: H, overflow: 'hidden'}}
            className="TabWidget"
        >
            <div key="tabwidget-bar" style={{position: 'absolute', left: 0, top: 0, width: W, height: tabBarHeight }}>
                <TabWidgetTabBar
                    tabs={tabs}
                    currentTabIndex={currentTabIndex}
                    onCurrentTabIndexChanged={setCurrentTabIndex}
                />
            </div>
            {
                children2.map((c, i) => {
                    const visible = i === currentTabIndex
                    return (
                        <div key={`child-${i}`} style={{visibility: visible ? 'visible' : 'hidden', overflowY: 'hidden', overflowX: 'hidden', position: 'absolute', left: 0, top: tabBarHeight, width: W, height: H}}>
                            {(visible || hasBeenVisible.includes(i)) && (
                                <c.type {...c.props} width={W} height={H - tabBarHeight}/>
                            )}
                        </div>
                    )
                })
            }
        </div>
    )
}

export default TabWidget