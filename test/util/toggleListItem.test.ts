import { beforeEach, describe, expect, test } from 'vitest'
import toggleListItem from '../../src/util/toggleListItem'


describe("List item toggle function", () => {
    let myList

    beforeEach(() => {
        myList = ["item1", "item2", "item3", "item4"]
    })

    test("Absent item is added once", () => {
        const newItem = "item 5"
        expect(myList.includes(newItem)).toBeFalsy()
        const originalLength = myList.length
        const newList = toggleListItem(myList, newItem)
        expect(newList.length).toBe(originalLength + 1)
        expect(newList.includes(newItem)).toBeTruthy()
    })
    test("Present item is removed all times, no other changes", () => {
        const itemToRemove = myList[0]
        expect(myList.includes(itemToRemove)).toBeTruthy()
        const originalLength = myList.length
        const newList = toggleListItem(myList, itemToRemove)
        expect(newList.length).toBe(originalLength - 1)
        expect(newList.includes(itemToRemove)).toBeFalsy()
        const doubledList = [...myList, itemToRemove]
        expect(doubledList.length).toBe(originalLength + 1)
        expect(doubledList.includes(itemToRemove)).toBeTruthy()
        const toggledDoubleList = toggleListItem(doubledList, itemToRemove)
        expect(toggledDoubleList.includes(itemToRemove)).toBeFalsy()
        expect(toggledDoubleList.length).toBe(newList.length)
    })
})
