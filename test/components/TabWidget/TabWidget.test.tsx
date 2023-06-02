// @vitest-environment jsdom

// import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import matchers from '@testing-library/jest-dom/matchers'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { FunctionComponent } from 'react'
import TabWidget from '../../../src/tabs/TabWidget/TabWidget'

expect.extend(matchers)

const myTabs = [
    { label: "tab1", closeable: false },
    { label: "tab2", closeable: true },
    { label: "tab3", closeable: false }
]

const ChildA: FunctionComponent<{msg: string}> = (props: {msg: string}) => {
    return (
        <div>
            <span>Child A</span>
            {props.msg}
        </div>
    )
}

const ChildB: FunctionComponent<{msg: string}> = (props: {msg: string}) => {
    return (
        <div>
            <span>Child B</span>
            {props.msg}
        </div>
    )
}

const myChildren = [
    <ChildA key="foo" msg={"hello world"} />,
    <ChildB key="bar" msg={"goodbye"} />,
    <ChildA key="baz" msg={"in a bottle"} />
]

describe("Tab widget", () =>{
    afterEach(() => {
        cleanup()
    })

    beforeEach(() => {

    })

    test("Throws when child count exceeds tab count", () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => {
            render(<TabWidget tabs={[myTabs[0]]} width={300} height={300}>
                {...myChildren}
            </TabWidget>)
        }).toThrow(/incorrect number of tabs/)
        vi.spyOn(console, 'error').mockRestore()
    })

    test("Throws when tab count exceeds child count", () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => {
            render(<TabWidget tabs={myTabs} width={300} height={300}>
                {myChildren[0]}
            </TabWidget>)
        }).toThrow(/incorrect number of tabs/)
        vi.spyOn(console, 'error').mockRestore()
    })

    test("Throws error on no children", () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => render(<TabWidget tabs={[myTabs[0]]} width={300} height={300} />)).toThrow(/null or undefined children/)
        vi.spyOn(console, 'error').mockRestore()
    })

    test("Renders children per their types", () => {
        render(<TabWidget tabs={myTabs} width={300} height={300}>
            {...myChildren}
        </TabWidget>)
        const rendered = screen.queryByText(/Child A/)
        expect(rendered).toBeTruthy()
    })

    test("Renders new child when tab index changes", async () => {
        render(<TabWidget tabs={myTabs} width={300} height={300}>
            {...myChildren}
        </TabWidget>)
        const rendered = screen.queryByText(/Child A/)
        expect(rendered).toBeTruthy()
        const tab2Button = screen.getByText("tab2")
        await userEvent.click(tab2Button)
        const newRendered = screen.queryByText(/Child B/)
        expect(newRendered).toBeTruthy()
    })
})