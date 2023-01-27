import { HashRouter } from 'react-router-dom'
import './App.css'
import MainWindow from './MainWindow'
import SetupMCMCMonitor from './SetupMCMCMonitor'

function App() {
  return (
    <HashRouter>
      <SetupMCMCMonitor>
        <MainWindow />
      </SetupMCMCMonitor>
    </HashRouter>
  )
}

export default App
