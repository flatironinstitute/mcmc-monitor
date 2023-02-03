import { initialMCMCMonitorData, MCMCMonitorAction, MCMCMonitorData } from "./MCMCMonitorData";

class MCMCDataManager {
    data: MCMCMonitorData = initialMCMCMonitorData
    constructor(private dispatch: (a: MCMCMonitorAction) => void) {
    }
    setData(data: MCMCMonitorData) {
        this.data = data
    }
    iterate() {
        
    }
}

export default MCMCDataManager