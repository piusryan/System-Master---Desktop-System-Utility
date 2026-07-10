import React from 'react'
import { Shield } from 'lucide-react'

interface NavItem {
  id: string
  icon: React.ReactNode
  label: string
}

interface SidebarProps {
  navItems: NavItem[]
  activePage: string
  setActivePage: (page: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ navItems, activePage, setActivePage }) => {
  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col">
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-float">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              SYSTEM
            </h1>
            <p className="text-xs text-gray-400">Master Suite</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            activePage === item.id
              ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
      </nav>

      <div className="p-4 border-t border-dark-600">
        <div className="glass rounded-xl p-4 bg-gradient-to-br from-danger-500/10 to-danger-600/5 border-danger-500/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-danger-400" />
            <div>
              <p className="text-sm font-medium text-danger-300">Admin Mode</p>
              <p className="text-xs text-gray-400">Required for full access</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
