import { initialMCMCMonitorData, MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorData";
import updateSequences from "./updateSequences";
import updateSequenceStats from "./updateSequenceStats";

class MCMCDataManager {
    #data: MCMCMonitorData = initialMCMCMonitorData
    #stopped = false
    constructor(private dispatch: (a: MCMCMonitorAction) => void) {
    }
    setData(data: MCMCMonitorData) {
        this.#data = data
    }
    async start() {
        // eslint-disable-next-line no-constant-condition
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
            await updateSequenceStats(this.#data, this.dispatch)
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