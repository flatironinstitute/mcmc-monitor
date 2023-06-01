import { describe, expect, test } from 'vitest'
import { constructSpaRunId, isSpaRunId, parseSpaRunId } from '../../src/spaInterface/util'

describe("Stan-playground run identifier utility function", () => {
    test("Returns true for correct initial string", () => {
        const goodString = "spa|my_stuff"
        expect(isSpaRunId(goodString)).toBeTruthy()
    })

    test("Returns false for bad initial string", () => {
        const badString = "not-spa|"
        expect(isSpaRunId(badString)).toBeFalsy()
    })
})

describe("Stan-playground run construction/destruction functions", () => {
    const myProj = "proj1"
    const myFile = "file1"
    test("construct returns a spaRunId", () => {
        const constructedRunId = constructSpaRunId(myProj, myFile)
        expect(isSpaRunId(constructedRunId)).toBeTruthy()
    })
    test("construct-parse successfully round-trips", () => {
        const constructedRunId = constructSpaRunId(myProj, myFile)
        const { projectId, fileName } = parseSpaRunId(constructedRunId)
        expect(projectId).toEqual(myProj)
        expect(fileName).toEqual(myFile)
    })
    test("parse throws on too few delimiters", () => {
        const badId = "spa|project1"
        expect(() => parseSpaRunId(badId)).toThrow(/wrong number/)
    })
    test("parse throws on too many delimiters", () => {
        const badId = "spa|project|file|bonus"
        expect(() => parseSpaRunId(badId)).toThrow(/wrong number/)
    })
    test("parse throws on bad first identifier", () => {
        const badId = "not-spa|proj1|file1"
        expect(() => parseSpaRunId(badId)).toThrow(/initial/)
    })
})