// @vitest-environment jsdom

import matchers from '@testing-library/jest-dom/matchers'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import TabWidgetTabBar from '../../../src/tabs/TabWidget/TabWidgetTabBar'

expect.extend(matchers)

describe("Tab Bar component", () => {
    // Note, the "closeable" property doesn't seem to have any behavior implemented for it currently here
    // May have been deleted in the code getting ported over
    const myTabs = [
        { label: "tab0", closeable: false },
        { label: "tab1", closeable: true },
        { label: "tab2", closeable: false }
    ]

    afterEach(() => cleanup())

    beforeEach(() => {
        vi.resetModules()
    })

    test("Renders input tabs with correct current tab selected", () => {
        render(<TabWidgetTabBar tabs={myTabs} currentTabIndex={0} onCurrentTabIndexChanged={() => {}} />)
        const tabs = screen.queryAllByRole("tab")
        expect(tabs.length).toBe(3)
        expect(tabs[0].getAttribute("aria-selected")).toBe("true")
        const unselected = tabs.filter(b => b.getAttribute("aria-selected") === 'false')
        expect(unselected.length).toBe(2)
    })
    
    test("Calls callback when tab changes", async () => {
        const mockCallback = vi.fn()
        render(<TabWidgetTabBar tabs={myTabs} currentTabIndex={1} onCurrentTabIndexChanged={mockCallback} />)
        const selectedTab = screen.getByText("tab1")
        expect(selectedTab.getAttribute("aria-selected")).toBe("true")
        await userEvent.click(selectedTab)  // no change, so shouldn't trigger event
        expect(mockCallback).toHaveBeenCalledTimes(0)
        const lastTab = screen.getByText("tab2")
        expect(lastTab.getAttribute("aria-selected")).toBe("false")
        await userEvent.click(lastTab)
        expect(mockCallback).toHaveBeenCalledOnce()
        expect(mockCallback.mock.lastCall[0]).toBe(2)
    })
})