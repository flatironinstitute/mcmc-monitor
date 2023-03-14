import { useState } from 'react'
import { HashRouter } from 'react-router-dom'
import './App.css'
import MCMCDataManager from './MCMCMonitorDataManager/MCMCMonitorDataManager'
import MainWindow from './MainWindow'
import SetupMCMCMonitor from './SetupMCMCMonitor'

function App() {
    const [dataManager, setDataManager] = useState<MCMCDataManager | undefined>()
  return (
    <HashRouter>
      <SetupMCMCMonitor dataManager={dataManager} setDataManager={setDataManager}>
        <MainWindow dataManager={dataManager} />
      </SetupMCMCMonitor>
    </HashRouter>
  )
}

export default App
