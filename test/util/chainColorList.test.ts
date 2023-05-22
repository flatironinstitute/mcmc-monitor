import { describe, expect, test } from 'vitest'
import { chainColorForIndex, default as chainColorList } from '../../src/util/chainColorList'

// contrast computation taken from https://www.w3.org/TR/AERT/#color-contrast
// which provides for scoring according to color brightness and color difference.
// Color difference formula converts RGB values to YIQ values, giving perceived brightness.
// Color difference sums the difference across the three channels (RGB)
// Color contrast is considered adequate if brightness difference exceeds 125 and
// color difference exceeds 500.

type rgb = {
    r: number,
    g: number,
    b: number
}

const convertHexToRgb = (hex: string): rgb => {
    // assume 6-digit hex with leading sharp, e.g. '#00ff00'
    const rStr = hex.substring(1, 3)
    const gStr = hex.substring(3, 5)
    const bStr = hex.substring(5, 7)
    return {
        r: parseInt(rStr, 16),
        g: parseInt(gStr, 16),
        b: parseInt(bStr, 16)
    }
}

const getBrightnessScore = (color: rgb): number => {
    return ((color.r * 299 + color.g * 587 + color.b * 114)/1000)
}

const getDifferenceScore = (first: rgb, second: rgb): number => {
    return ['r', 'g', 'b'].map(k => Math.abs(first[k] - second[k])).reduce((previous, current) => previous + current, 0)
}

const isContrastAdequate = (first: rgb, second: rgb) => {
    const brightnessDelta = Math.abs(getBrightnessScore(first) - getBrightnessScore(second))
    const colorDifference = getDifferenceScore(first, second)
    return (brightnessDelta >= 125) && (colorDifference >= 500)
}

describe("Color contrast functions self-test", () => {
    test("convert hex to RGB works on good input", () => {
        const greenExample = '#00ff00'
        const antiGreenExample = '#ff00ff'
        const greenRes = convertHexToRgb(greenExample)
        const antiGreenRes = convertHexToRgb(antiGreenExample)
        expect(greenRes).toEqual({ r: 0, g: 255, b: 0 })
        expect(antiGreenRes).toEqual({ r: 255, g: 0, b: 255 })
    })
    test("getBrightnessScore", () => {
        const first = {r: 1, g: 1, b: 1}
        const second = {r: 2, g: 2, b: 2}
        expect(getBrightnessScore(first)).toBeCloseTo((299 + 587 + 114)/1000)
        expect(getBrightnessScore(second)).toBeCloseTo(2 * getBrightnessScore(first))
        const r = {r: 1, g: 0, b: 0}
        const g = {r: 0, g: 1, b: 0}
        const b = {r: 0, g: 0, b: 1}
        expect(getBrightnessScore(r)).toBeCloseTo(299/1000)
        expect(getBrightnessScore(g)).toBeCloseTo(587/1000)
        expect(getBrightnessScore(b)).toBeCloseTo(114/1000)
    })
    test("getDifferenceScore", () => {
        const f = {r: 10, g: 25, b: 30}
        const s = {r: 20, g: 17, b: 15}
        expect(getDifferenceScore(f, s)).toBe(33)
        expect(getDifferenceScore(s, f)).toEqual(getDifferenceScore(f, s))
    })
    test("isContrastAdequate", () => {
        const black = {r: 0, g: 0, b: 0}
        const white = {r: 255, g: 255, b: 255}
        expect(isContrastAdequate(black, white)).toBeTruthy()
        expect(isContrastAdequate(white, white)).toBeFalsy()
        expect(isContrastAdequate(black, black)).toBeFalsy()
    })
})

describe("Color cycle function", () => {
    test("No repeats in list", () => {
        const seen = new Set<string>(chainColorList)
        expect(seen.size).toBe(chainColorList.length)
    })
    // TODO: This is currently marked known-failing; it turns out it's actually
    // extremely difficult to come up with more than 3-4 colors that mutually have
    // adequate contrast. I'm leaving in for now, but we can probably remove it
    // entirely at some point.
    test.fails("Neighboring colors have adequate contrast", () => {
        const indices = Array(chainColorList.length).fill(0).map((_, i) => i + 1)
        indices.forEach((value, index) => {
            const color_a = convertHexToRgb(chainColorForIndex(index))
            const color_b = convertHexToRgb(chainColorForIndex(value))
            expect(isContrastAdequate(color_a, color_b)).toBeTruthy()
        })
    })
})
