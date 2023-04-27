import { describe, expect, test } from 'vitest'
import { TEST_isComment, TEST_isEmptyComment } from '../../src/logic/ChainFile'

describe("Comment detection function", () => {
    test("Identifies lines beginning with # as comments", () => {
        expect(TEST_isComment("#comment line")).toBeTruthy()
    })
    test("Identifies lines not beginning with # as non-comments", () => {
        expect(TEST_isComment("/*Comment line*/")).toBeFalsy()
    })
})

describe("Empty-comment detection function", () => {
    test("Identifies lines containing only space as empty comments", () => {
        expect(TEST_isEmptyComment("#        ")).toBeTruthy()
    })
    test("Identifies lines with only tabs as empty comments", () => {
        expect(TEST_isEmptyComment("#\t")).toBeTruthy()
    })
    test("Identifies lines with visible characters as non-empty", () => {
        expect(TEST_isEmptyComment("# Some content")).toBeFalsy()
    })
})
