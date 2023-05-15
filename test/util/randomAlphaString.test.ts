import { describe, expect, test } from 'vitest'
import randomAlphaString from '../../src/util/randomAlphaString'

describe("Random alpha string generator", () => {
    test("Generates string of requested length", () => {
        const len = 15
        const txt = randomAlphaString(len)
        expect(txt.length).toBe(len)
    })
    test("Throws on requested zero- or negative-length string", () => {
        expect(() => randomAlphaString(0)).toThrow(/num_chars needs to be a positive integer/)
        expect(() => randomAlphaString(-5)).toThrow(/num_chars needs to be a positive integer/)
    })
    test("Generates roughly even distribution of letters", () => {
        const len = 10000
        const txt = randomAlphaString(len)
        const counts: Map<string, number> = new Map()
        for (const char of txt) {
            const current = counts.get(char) ?? 0
            counts.set(char, current + 1)
        }
        const vals = [...counts.values()]
        const mean = vals.reduce((a, v) => a + v, 0)/vals.length
        expect(mean).toBeCloseTo(len / 52)
    })
    test("Generates different strings when called repeatedly", () => {
        const len = 15
        const txt1 = randomAlphaString(len)
        const txt2 = randomAlphaString(len)
        expect(txt1).not.toEqual(txt2)
    })
})
