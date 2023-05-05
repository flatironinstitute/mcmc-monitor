import { useState } from 'react'
import ReactGA from 'react-ga4'
import { HashRouter } from 'react-router-dom'
import './App.css'
import MCMCDataManager from './MCMCMonitorDataManager/MCMCMonitorDataManager'
import SetupMCMCMonitor from './MCMCMonitorDataManager/SetupMCMCMonitor'
import CookieBanner from './components/CookieLogic'
import MainWindow from './pages/MainWindow'


function App() {
    const [dataManager, setDataManager] = useState<MCMCDataManager | undefined>()
    ReactGA.send('pageview')
  return (
    <HashRouter>
      <SetupMCMCMonitor dataManager={dataManager} setDataManager={setDataManager}>
        <MainWindow dataManager={dataManager} />
        <CookieBanner />
      </SetupMCMCMonitor>
    </HashRouter>
  )
}

export default App
