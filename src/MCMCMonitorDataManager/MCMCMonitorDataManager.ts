import { initialMCMCMonitorData } from "./MCMCMonitorData";
import { MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorDataTypes";
import updateSequences from "./updateSequences";
import updateSequenceStats from "./updateSequenceStats";
import updateVariableStats from "./updateVariableStats";

class MCMCDataManager {
    #data: MCMCMonitorData = initialMCMCMonitorData
    #stopped = false
    constructor(private dispatch: (a: MCMCMonitorAction) => void) {
    }
    setData(data: MCMCMonitorData) {
        this.#data = data
    }
    async start() {
        this.#stopped = false
        while (true) {
            if (this.#stopped) return
            await this._iterate()
            await sleepMsec(1000)
        }
    }
    stop() {
        this.#stopped = true
    }
    async _iterate() {
        try {
            await updateSequences(this.#data, this.dispatch)
            await sleepMsec(10) // allow the new data to be set onto this.#data
            await updateSequenceStats(this.#data, this.dispatch)
            await sleepMsec(10)
            await updateVariableStats(this.#data, this.dispatch)
        }
        catch(err) {
            console.error('Error in data manager iteration.')
            console.error(err)
        }
    }
}

async function sleepMsec(msec: number) {
    return new Promise<void>(resolve => setTimeout(resolve, msec))
}

export default MCMCDataManager