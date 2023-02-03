import { initialMCMCMonitorData, MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorData";
import updateSequences from "./updateSequences";
import updateSequenceStats from "./updateSequenceStats";

class MCMCDataManager {
    data: MCMCMonitorData = initialMCMCMonitorData
    inIterate = false
    constructor(private dispatch: (a: MCMCMonitorAction) => void) {
    }
    setData(data: MCMCMonitorData) {
        this.data = data
    }
    async iterate() {
        if (this.inIterate) return
        this.inIterate = true
        try {
            await updateSequences(this.data, this.dispatch)
            await updateSequenceStats(this.data, this.dispatch)
        }
        catch(err) {
            console.error('Error in data manager iteration.')
            console.error(err)
        }
        finally {
            this.inIterate = false
        }
    }
}

export default MCMCDataManager