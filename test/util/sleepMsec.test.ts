import { describe, expect, test, vi } from 'vitest'
import sleepMsec from '../../src/util/sleepMsec'



describe("Promise-oriented timeout function", () => {
    test("Resolves to void", async () => {
        const res = await sleepMsec(0)
        expect(res).toBeTypeOf("undefined")
    })
    test("Calls resolve callback", async () => {
        const myfn = vi.fn()
        await sleepMsec(1).then(() => myfn())
        expect(myfn).toHaveBeenCalledOnce()
    })
    test("Sleeps the input number of milliseconds", async () => {
        const mockTimeout = vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {callback(); return {hasRef: () => false} as NodeJS.Timeout})

        const duration = 15
        expect(mockTimeout).toHaveBeenCalledTimes(0)
        await sleepMsec(duration)
        expect(mockTimeout).toHaveBeenCalledOnce()
        const observed = (mockTimeout.mock.lastCall ?? [0, 0])[1]
        expect(observed).toEqual(duration)
    })
})
