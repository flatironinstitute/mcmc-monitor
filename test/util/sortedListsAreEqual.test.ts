import { describe, expect, test } from 'vitest'
import sortedListsAreEqual from '../../src/util/sortedListsAreEqual'

describe("Sorted list comparison function", () => {
    test("Returns false if list lengths differ", () => {
        const l1 = [1, 2, 3, 4, 5]
        const l2 = [1, 2, 3, 4]
        expect(sortedListsAreEqual(l1, l2)).toBeFalsy()
    })
    test("Returns false if lists contain a differing item", () => {
        const l1 = [1, 2, 3, 4, 5]
        const l2 = [1, 2, 3, 4, 6]
        expect(sortedListsAreEqual(l1, l2)).toBeFalsy()
    })
    test("Returns false if one list is unsorted", () => {
        // Note: if this starts failing, congratulations! The code works better than before
        const l1 = [1, 2, 3, 4, 5]
        const l2 = [5, 4, 3, 2, 1]
        expect(sortedListsAreEqual(l1, l2)).toBeFalsy()
    })
    test("Returns true if lists have the same items", () => {
        const l1 = [1, 2, 3, 4, 5]
        const l2 = [1, 2, 3, 4, 5]
        expect(sortedListsAreEqual(l1, l2)).toBeTruthy()
    })
})