// @vitest-environment jsdom

import { rgbToHex } from '@mui/material'
import matchers from '@testing-library/jest-dom/matchers'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MCMCChain } from '../../service/src/types'
import ChainsSelector from '../../src/components/ChainsSelector'

expect.extend(matchers)
const SOLID_SQUARE = "\u25A0"

const chainColorsBase = ['#ff0000', '#00ff00', '#0000ff']

const makeChain = (id: string): MCMCChain => {
    const runId = 'unimportant'
    const variableNames = ['var1', 'var2', 'var3']
    return { runId, variableNames, chainId: id } as unknown as MCMCChain
}


describe("Chain selection component", () => {
    const chains = ['chain1', 'chain2', 'chain3'].map(c => makeChain(c))
    const allChainIds = chains.map(c => c.chainId)
    const chainColors = {}
    allChainIds.forEach((id, idx) => chainColors[id] = chainColorsBase[idx])
    let mockSelectedChainIds
    let mockSetSelectedChainIds: Mock
    let mockUseMCMCMonitor

    afterEach(() => {
        cleanup()
    })

    beforeEach(() => {
        vi.resetModules()
        mockSetSelectedChainIds = vi.fn()
        mockSelectedChainIds = [allChainIds[0], allChainIds[2]]
        mockUseMCMCMonitor = vi.fn().mockImplementation(() => {
            return {
                setSelectedChainIds: mockSetSelectedChainIds,
                selectedChainIds: mockSelectedChainIds
            }
        })
    
        vi.doMock('../../src/MCMCMonitorDataManager/useMCMCMonitor', () => {
            return {
                __esModule: true,
                useMCMCMonitor: mockUseMCMCMonitor
            }
        })
    })

    test("Renders one checkbox per chain", () => {
        render(<ChainsSelector chains={chains} allChainIds={allChainIds} chainColors={chainColors} />)
        const boxes = screen.getAllByText("chain", {exact: false})
        expect(boxes).not.toBeNull()
        expect(boxes.length).toEqual(chains.length)
    })
    test("Renders color swatches in appropriate colors", () => {
        render(<ChainsSelector chains={chains} allChainIds={allChainIds} chainColors={chainColors} />)
        const squareSpans = screen.getAllByText(SOLID_SQUARE, {exact: false})
        expect(squareSpans.length).toEqual(chains.length)
        const colorSets = squareSpans.map(s => s.style.color)
        expect(colorSets.length).toEqual(chains.length)
        colorSets.forEach(cs => expect(chainColorsBase.includes(rgbToHex(cs))).toBeTruthy())
    })
    test("Sets checkbox state to match selected chain ID state", async () => {
        const localImport = (await import('../../src/components/ChainsSelector'))
        const sut = localImport.default
        render(sut({chains, allChainIds, chainColors}) as any)
        // screen.debug()
        const shouldBeChecked = [screen.getByLabelText(mockSelectedChainIds[0], {exact: false}), screen.getByLabelText(mockSelectedChainIds[1], {exact: false})]
        const shouldBeUnchecked = screen.getByLabelText(allChainIds[1], {exact: false})
        expect(shouldBeUnchecked).not.toBeChecked()
        shouldBeChecked.forEach(cb => expect(cb).toBeChecked())
    })
    // NOTE: In future, consider wiring that avoids the need to mock the state management & instead assert on checkbox state?
    test("Clear button deselcts all chains", async () => {
        const localImport = (await import('../../src/components/ChainsSelector'))
        const sut = localImport.default
        render(sut({chains, allChainIds, chainColors}) as any)
        const shouldBeChecked = [screen.getByLabelText(mockSelectedChainIds[0], {exact: false}), screen.getByLabelText(mockSelectedChainIds[1], {exact: false})]
        shouldBeChecked.forEach(cb => expect(cb).toBeChecked())

        // click the deselect button
        const deselectButton = screen.getByText('clear')
        await userEvent.click(deselectButton)
        expect(mockSetSelectedChainIds).toHaveBeenCalledOnce()
        const call = mockSetSelectedChainIds.mock.lastCall[0]
        expect(call).toEqual([])
    })
    test("Select-all button selects all chains", async () => {
        const localImport = (await import('../../src/components/ChainsSelector'))
        const sut = localImport.default
        render(sut({chains, allChainIds, chainColors}) as any)
        const shouldBeChecked = [screen.getByLabelText(mockSelectedChainIds[0], {exact: false}), screen.getByLabelText(mockSelectedChainIds[1], {exact: false})]
        shouldBeChecked.forEach(cb => expect(cb).toBeChecked())

        // click the select-all button
        const selectAllButton = screen.getByText('select all')
        await userEvent.click(selectAllButton)
        expect(mockSetSelectedChainIds).toHaveBeenCalledOnce()
        const call = mockSetSelectedChainIds.mock.lastCall[0]
        expect(call).toEqual(allChainIds)
    })
    test("Clicking a checkbox toggles the chain's selection state", async () => {
        const localImport = (await import('../../src/components/ChainsSelector'))
        const sut = localImport.default
        render(sut({chains, allChainIds, chainColors}) as any)
        const shouldBeChecked = [screen.getByLabelText(mockSelectedChainIds[0], {exact: false}), screen.getByLabelText(mockSelectedChainIds[1], {exact: false})]
        shouldBeChecked.forEach(cb => expect(cb).toBeChecked())

        // click to toggle the unselected chain
        const chainCheckbox = screen.getByLabelText(allChainIds[1], {exact: false})
        await userEvent.click(chainCheckbox)
        expect(mockSetSelectedChainIds).toHaveBeenCalledOnce()
        const call = mockSetSelectedChainIds.mock.lastCall[0]
        const newSet = new Set(call)
        expect(call.length).toBe(mockSelectedChainIds.length + 1)
        expect(newSet.has(allChainIds[1])).toBeTruthy()
    })
})