import React from 'react'
import { Cpu, HardDrive, Activity, Zap, ArrowRight, Wrench, Hammer, Trash2 } from 'lucide-react'

interface DashboardProps {
  setActivePage: (page: string) => void
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
  const features = [
    {
      title: 'System repair and clean',
      description: 'Scan, repair, and clean your system files and settings',
      icon: <Wrench className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-600',
      page: 'system-repair-and-clean',
    },
    {
      title: 'Fix & Repair',
      description: 'Diagnose and fix common Windows issues',
      icon: <Hammer className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-600',
      page: 'fix-repair',
    },
    {
      title: 'Network & Connectivity',
      description: 'Manage network connections and troubleshoot',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-600',
      page: 'network',
    },
    {
      title: 'Complete Uninstaller',
      description: 'Remove leftover files and registry entries from uninstalled programs',
      icon: <Trash2 className="w-6 h-6" />,
      color: 'from-red-500 to-red-600',
      page: 'complete-uninstaller',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Welcome to System Master
        </h2>
        <p className="text-gray-400 mt-2">
          Your all-in-one system utility for Windows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'CPU', value: '52%', icon: <Cpu className="w-5 h-5" />, color: 'from-blue-500 to-blue-600' },
          { title: 'Memory', value: '16 GB', icon: <Activity className="w-5 h-5" />, color: 'from-green-500 to-emerald-600' },
          { title: 'Storage', value: '477 GB', icon: <HardDrive className="w-5 h-5" />, color: 'from-purple-500 to-pink-600' },
          { title: 'Processes', value: '234', icon: <Zap className="w-5 h-5" />, color: 'from-orange-500 to-red-600' },
        ].map((stat, idx) => (
          <div key={idx} className="glass rounded-2xl p-6 gradient-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, idx) => (
          <div
            key={idx}
            onClick={() => setActivePage(feature.page)}
            className="glass rounded-2xl p-6 hover:border-primary-500/50 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mt-1">{feature.description}</p>
                <button className="mt-4 flex items-center gap-2 text-primary-400 font-medium hover:text-primary-300 transition-colors">
                  Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
