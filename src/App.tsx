import { useState } from 'react'
import { Zap, Wifi, Wrench, Hammer } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Network from './pages/Network'
import SystemRepairAndClean from './pages/SystemRepairAndClean'
import FixRepair from './pages/FixRepair'

type Page = 'dashboard' | 'network' | 'system-repair-and-clean' | 'fix-repair'

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  const navItems = [
    { id: 'dashboard', icon: <Zap className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'system-repair-and-clean', icon: <Wrench className="w-5 h-5" />, label: 'System repair and clean' },
    { id: 'fix-repair', icon: <Hammer className="w-5 h-5" />, label: 'Fix & Repair' },
    { id: 'network', icon: <Wifi className="w-5 h-5" />, label: 'Network & Connectivity' },
  ]

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage as any} />
      case 'system-repair-and-clean':
        return <SystemRepairAndClean />
      case 'fix-repair':
        return <FixRepair />
      case 'network':
        return <Network />
      default:
        return <Dashboard setActivePage={setActivePage as any} />
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Sidebar
        navItems={navItems}
        activePage={activePage}
        setActivePage={setActivePage as any}
      />
      <main className="flex-1 overflow-auto p-6">{renderPage()}</main>
    </div>
  )
}

export default App
