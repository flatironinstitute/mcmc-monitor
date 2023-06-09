// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { FunctionComponent } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import useRoute, { Route } from '../../src/util/useRoute'

type ConsumerProps = {
    location: string
    navigationTarget?: string
}

const InnerConsumer: FunctionComponent<ConsumerProps> = (props: ConsumerProps) => {
    const { navigationTarget } = props
    const { route, setRoute } = useRoute()
    const splitTarget = navigationTarget?.split('/') || ["", "", "", ""]
    const routeTarget = {
        page: splitTarget[1],
        runId: splitTarget[2],
        projectId: splitTarget[2],
        fileName: splitTarget[3]
    } as unknown as Route

    return (
        <div>
            <div>page: {route.page}</div>
            <div>run id: {(route as unknown as {page: 'run', runId: string}).runId ?? '' }</div>
            <div>project id: {(route as unknown as {page: 'spa', projectId: string}).projectId ?? ''}</div>
            <div>file name: {(route as unknown as {page: 'spa', fileName: string}).fileName ?? ''}</div>
            <button onClick={() => setRoute(routeTarget)}></button>
        </div>
    )

}

const Consumer: FunctionComponent<ConsumerProps> = (props: ConsumerProps) => {
    const { location } = props
    return (
        <MemoryRouter initialEntries={[location]}>
            <InnerConsumer {...props} />
        </MemoryRouter>
    )
}

describe("Navigation hook ", () => {
    afterEach(() => {
        cleanup()
    })
    test("Interprets route as home page if pathname does not begin with run or spa", () => {
        render(<Consumer location="/not-run/" />)
        const pageInfo = screen.getByText(/page/).textContent ?? ''
        expect(pageInfo.includes('home')).toBeTruthy()
    })
    test("Interprets route as run page if pathname begins with run", () => {
        render(<Consumer location="/run/15" />)
        const pageTxt = screen.getByText(/page/).textContent ?? ''
        const runIdTxt = screen.getByText(/run id/).textContent ?? ''
        expect(pageTxt.includes('run')).toBeTruthy()
        expect(runIdTxt.includes('15')).toBeTruthy()
    })
    test("Inteprets route as stan-playground if pathname begins with spa", () => {
        render(<Consumer location="/spa/p10/f10" />)
        const pageTxt = screen.getByText(/page/).textContent ?? ''
        const projectTxt = screen.getByText(/project id/).textContent ?? ''
        const fileTxt = screen.getByText(/file name/).textContent ?? ''
        expect(pageTxt.includes('spa')).toBeTruthy()
        expect(projectTxt.includes('p10')).toBeTruthy()
        expect(fileTxt.includes('f10')).toBeTruthy()
    })
})

// Okay, in this case, with using hoisting to do this once for the whole file
// (as we don't need to change anything about the mocking between tests)
// Note the use of importActual, the way to use the 'real' underlying module in vi
// equivalent to jest's requireActual
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const router = await vi.importActual('react-router-dom') as unknown as object
    return { ...router, useNavigate: () => mockNavigate }
})

describe("Navigation hook--route-setting callback", () => {
    let user
    afterEach(() => cleanup())
    beforeEach(() => {
        vi.resetAllMocks()
        user = userEvent.setup()
    })
    test("Navigates to empty path if route page is home", async () => {
        render(<Consumer location="/not-run/" navigationTarget='/home/123' />)
        await user.click(screen.getByRole('button'))
        expect(mockNavigate).toHaveBeenCalledOnce()
        const lastCall = mockNavigate.mock.lastCall[0]
        expect(lastCall.pathname).toEqual('')
    })
    test("Navigates to run page if route page is run", async () => {
        render(<Consumer location="/not-run/" navigationTarget='/run/123' />)
        await user.click(screen.getByRole('button'))
        expect(mockNavigate).toHaveBeenCalledOnce()
        const lastCall = mockNavigate.mock.lastCall[0]
        expect(lastCall.pathname).toEqual('/run/123')
    })
    test("Navigates to spa page if route page is spa", async () => {
        const navTarget = '/spa/p10/f10'
        render(<Consumer location="/not-run/" navigationTarget={navTarget} />)
        await user.click(screen.getByRole('button'))
        expect(mockNavigate).toHaveBeenCalledOnce()
        const lastCall = mockNavigate.mock.lastCall[0]
        expect(lastCall.pathname).toEqual(navTarget)
    })
    test("Does nothing if route page is something else", async () => {
        render(<Consumer location="/not-run/" navigationTarget='/bad-address/123' />)
        await user.click(screen.getByRole('button'))
        expect(mockNavigate).toHaveBeenCalledTimes(0)
    })
})
