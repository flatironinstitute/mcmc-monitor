// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import React, { FunctionComponent } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import useWindowDimensions from '../../src/util/useWindowDimensions'

const Consumer: FunctionComponent = () => {
    const { width, height } = useWindowDimensions()
    return (
        <div>
            <div>Width: {width}</div>
            <div>Height: {height}</div>
        </div>
    )
}

describe("Window dimensions hook", () => {
    const myWidth = 200
    const myHeight = 500
    const myNewWidth = 400
    const myNewHeight = 800

    afterEach(() => cleanup())

    beforeEach(() => {
        global.window.innerWidth = myWidth
        global.window.innerHeight = myHeight
    })

    test("Begins with dimensions of surrounding window", () => {
        render(<Consumer />)
        const widthContext = screen.getByText(/Width/).textContent ?? ''
        const heightContext = screen.getByText(/Height/).textContent ?? ''
        expect(widthContext.includes(myWidth.toString())).toBeTruthy()
        expect(heightContext.includes(myHeight.toString())).toBeTruthy()
    })
    test("Updates dimensions when window resizes", async () => {
        render(<Consumer />)
        
        global.window.innerWidth = myNewWidth
        global.window.innerHeight = myNewHeight
        let widthContext = (await screen.findByText(/Width/)).textContent ?? ''
        let heightContext = (await screen.findByText(/Height/)).textContent ?? ''
        expect(widthContext.includes(myWidth.toString())).toBeTruthy()
        expect(heightContext.includes(myHeight.toString())).toBeTruthy()

        global.window.dispatchEvent(new Event('resize'))
        widthContext = (await screen.findByText(/Width/)).textContent ?? ''
        heightContext = (await screen.findByText(/Height/)).textContent ?? ''
        expect(widthContext.includes(myNewWidth.toString())).toBeTruthy()
        expect(heightContext.includes(myNewHeight.toString())).toBeTruthy()
    })
    test("Leaves no event listeners after component unmounts", async () => {
        global.window.addEventListener = vi.fn()
        global.window.removeEventListener = vi.fn()
        render(<Consumer />)
        expect(global.window.addEventListener).toHaveBeenCalledOnce()
        expect(global.window.removeEventListener).toBeCalledTimes(0)
        cleanup()
        expect(global.window.removeEventListener).toHaveBeenCalledOnce()
    })
})
