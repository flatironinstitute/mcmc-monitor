import { FunctionComponent, PropsWithChildren, useMemo, useState } from "react";
import TabWidgetTabBar from "./TabWidgetTabBar";

type Props = {
    tabs: {
        label: string
        closeable: boolean
    }[]
    width: number
    height: number
}

// needs to correspond to css (not best system)
const tabBarHeight = 30 + 25

const TabWidget: FunctionComponent<PropsWithChildren<Props>> = ({children, tabs, width, height}) => {
    const [currentTabIndex, setCurrentTabIndex] = useState<number>(0)

    const tabViews = useMemo(() => (Array.isArray(children) ? (children) : ([children])), [children]) as React.ReactElement[]
    if (tabViews.length !== tabs.length) {
        throw Error(`TabWidget: incorrect number of tabs ${tabViews.length} <> ${tabs.length}`)
    }
    if (tabViews.some(v => v == null)) {
        // Double-equals catches both null and undefined in this context.
        // This probably can't happen--I've only seen a null in tabViews when there aren't actually any children.
        // And even then it'd probably get caught by the length comparison. But just in case:
        throw Error("TabWidget: null or undefined children detected")
    }

    const hMargin = 8
    const vMargin = 8
    // const W = (width || 300) - hMargin * 2
    const W = width - hMargin * 2
    const H = height - vMargin * 2

    // TODO: attach this styling into a class rather than hard-coding?
    const renderedViews = useMemo(() => 
        tabViews.map((c, i) => {
            return (
                <div
                    className="tab-widget-child"
                    key={`child-${i}`}
                    style={{overflowY: 'hidden', overflowX: 'hidden', position: 'absolute', left: 0, top: tabBarHeight, width: W, height: H - tabBarHeight}}
                >
                    <c.type {...c.props} width={W}  height={H - tabBarHeight} key={`child-${i}`}/>
                </div>
            )
        }),
        [tabViews, H, W]
    )

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
            {renderedViews[currentTabIndex]}
        </div>
    )
}

export default TabWidget