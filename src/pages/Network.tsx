import React, { useState, useRef, useEffect } from 'react'
import {
  Wifi,
  Server,
  RefreshCw,
  Trash2,
  Globe,
  Terminal,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
  Lock,
  Unlock,
  Square
} from 'lucide-react'
import { useTaskManager } from '../contexts/TaskManagerContext'

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  terminalColor: string
  isDangerous?: boolean
  hasInput?: boolean
  inputPlaceholder?: string
  inputValue?: string
  setInputValue?: (val: string) => void
  commandName: string
  action: () => Promise<string>
}

interface Category {
  title: string
  description: string
  features: Feature[]
  defaultOpen?: boolean
}

const Network: React.FC = () => {
  const [pingHost, setPingHost] = useState('google.com')
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'category-0': true,
    'category-1': false,
    'category-2': false
  })

  const {
    startTask,
    updateTaskProgress,
    updateTaskOutput,
    stopTask,
    toggleTaskOutput,
    clearTaskOutput,
    isTaskRunning,
    getTaskProgress,
    getTaskOutput,
    isTaskOutputOpen,
  } = useTaskManager()

  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({})

  const simulateProgress = (id: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 2
      if (progress >= 95) {
        progress = 95
      }
      updateTaskProgress(id, progress)
    }, 200)
    intervalRefs.current[id] = interval
    return interval
  }

  const stopProgressSimulation = (id: string) => {
    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id])
      delete intervalRefs.current[id]
    }
  }

  const handleRunCommand = async (feature: Feature) => {
    const id = feature.id
    if (isTaskRunning(id)) {
      return
    }

    startTask(id)
    updateTaskOutput(id, `--- Running ${feature.commandName} ---\n`, false)
    const progressInterval = simulateProgress(id)

    try {
      const result = await feature.action()
      updateTaskOutput(id, result, true)
    } catch (error) {
      updateTaskOutput(id, `Error: ${error}`, true)
    } finally {
      clearInterval(progressInterval)
      stopProgressSimulation(id)
      updateTaskProgress(id, 100)
      stopTask(id)
    }
  }

  const handleStopTask = (id: string) => {
    stopProgressSimulation(id)
    updateTaskOutput(id, '\n--- Task stopped by user ---\n', true)
    updateTaskProgress(id, 100)
    stopTask(id)
  }

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const handleReleaseRenew = async () => {
    // First release
    const taskId = 'release-renew'
    if (isTaskRunning(taskId)) return

    startTask(taskId)
    updateTaskOutput(taskId, '--- Releasing IP Address ---\n', false)
    const progressInterval = simulateProgress(taskId)

    try {
      const result = await window.electronAPI.networkReleaseIp()
      updateTaskOutput(taskId, result, true)
      updateTaskOutput(taskId, '\n--- Renewing IP Address ---\n', true)
      const renewResult = await window.electronAPI.networkRenewIp()
      updateTaskOutput(taskId, renewResult, true)
    } catch (error) {
      updateTaskOutput(taskId, `Error: ${error}`, true)
    } finally {
      clearInterval(progressInterval)
      stopProgressSimulation(taskId)
      updateTaskProgress(taskId, 100)
      stopTask(taskId)
    }
  }

  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval)
    }
  }, [])

  const categories: Category[] = [
    {
      title: 'Network Diagnostics',
      description: 'Test and check your network connection',
      defaultOpen: true,
      features: [
        {
          id: 'ping',
          title: 'Test Connection',
          description: 'Ping a server to test connectivity',
          icon: <Server className="w-6 h-6" />,
          color: 'from-blue-500 to-cyan-500',
          terminalColor: 'border-blue-500/30 bg-blue-950/40',
          hasInput: true,
          inputPlaceholder: 'Hostname or IP (e.g. google.com)',
          inputValue: pingHost,
          setInputValue: setPingHost,
          commandName: 'Ping',
          action: () => window.electronAPI.networkPing(pingHost)
        },
        {
          id: 'ipconfig',
          title: 'IP Configuration',
          description: 'View detailed network information',
          icon: <Wifi className="w-6 h-6" />,
          color: 'from-green-500 to-emerald-500',
          terminalColor: 'border-green-500/30 bg-green-950/40',
          commandName: 'IP Configuration',
          action: window.electronAPI.networkIpConfig
        },
        {
          id: 'flush-dns',
          title: 'Flush DNS',
          description: 'Clear DNS resolver cache',
          icon: <RefreshCw className="w-6 h-6" />,
          color: 'from-purple-500 to-pink-500',
          terminalColor: 'border-purple-500/30 bg-purple-950/40',
          commandName: 'Flush DNS',
          action: window.electronAPI.networkFlushDns
        },
        {
          id: 'release-renew',
          title: 'Release & Renew IP',
          description: 'Get a new IP address from your router',
          icon: <Activity className="w-6 h-6" />,
          color: 'from-indigo-500 to-purple-500',
          terminalColor: 'border-indigo-500/30 bg-indigo-950/40',
          commandName: 'Release & Renew IP',
          action: async () => {
            // This is handled specially in handleReleaseRenew, but keep for interface
            return ''
          }
        }
      ]
    },
    {
      title: 'Network Repair',
      description: 'Fix common network issues',
      features: [
        {
          id: 'reset-network',
          title: 'Reset TCP/IP',
          description: 'Reset your network stack (requires admin)',
          icon: <Zap className="w-6 h-6" />,
          color: 'from-yellow-500 to-orange-500',
          terminalColor: 'border-yellow-500/30 bg-yellow-950/40',
          isDangerous: true,
          commandName: 'Reset TCP/IP',
          action: window.electronAPI.networkReset
        },
        {
          id: 'winsock-reset',
          title: 'Winsock Reset',
          description: 'Reset Windows network services',
          icon: <Terminal className="w-6 h-6" />,
          color: 'from-cyan-500 to-blue-500',
          terminalColor: 'border-cyan-500/30 bg-cyan-950/40',
          isDangerous: true,
          commandName: 'Winsock Reset',
          action: window.electronAPI.networkWinsockReset
        },
        {
          id: 'reset-all',
          title: 'Full Network Reset',
          description: 'Reset all network settings (requires admin)',
          icon: <Trash2 className="w-6 h-6" />,
          color: 'from-red-500 to-pink-500',
          terminalColor: 'border-red-500/30 bg-red-950/40',
          isDangerous: true,
          commandName: 'Full Network Reset',
          action: window.electronAPI.networkWinsockReset
        }
      ]
    },
    {
      title: 'Network Tools',
      description: 'Additional network utilities',
      features: [
        {
          id: 'remote-desktop',
          title: 'Remote Desktop',
          description: 'Connect to another computer',
          icon: <Globe className="w-6 h-6" />,
          color: 'from-orange-500 to-red-500',
          terminalColor: 'border-orange-500/30 bg-orange-950/40',
          commandName: 'Remote Desktop',
          action: async () => {
            await window.electronAPI.networkRemoteDesktop()
            return 'Remote Desktop launched!'
          }
        },
        {
          id: 'enable-telnet',
          title: 'Enable Telnet',
          description: 'Turn on Windows Telnet client',
          icon: <Unlock className="w-6 h-6" />,
          color: 'from-green-500 to-emerald-500',
          terminalColor: 'border-green-500/30 bg-green-950/40',
          isDangerous: false,
          commandName: 'Enable Telnet',
          action: window.electronAPI.networkEnableTelnet
        },
        {
          id: 'disable-telnet',
          title: 'Disable Telnet',
          description: 'Turn off Windows Telnet client',
          icon: <Lock className="w-6 h-6" />,
          color: 'from-red-500 to-rose-500',
          terminalColor: 'border-red-500/30 bg-red-950/40',
          isDangerous: false,
          commandName: 'Disable Telnet',
          action: window.electronAPI.networkDisableTelnet
        }
      ]
    }
  ]

  const renderFeatureCard = (feature: Feature) => {
    const taskId = feature.id
    const isRunning = isTaskRunning(taskId)
    const progress = getTaskProgress(taskId)
    const output = getTaskOutput(taskId)
    const outputOpen = isTaskOutputOpen(taskId)

    // Handle special cases
    const handleFeatureClick = () => {
      if (feature.id === 'release-renew') {
        handleReleaseRenew()
      } else if (feature.id === 'reset-all') {
        if (confirm('This will reset all network settings. Continue?')) {
          handleRunCommand(feature)
        }
      } else {
        handleRunCommand(feature)
      }
    }

    return (
      <div
        key={taskId}
        className={`glass rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
          feature.isDangerous ? 'border-red-500/30 hover:border-red-500/50' : 'border-transparent hover:border-primary-500/50'
        }`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
              {feature.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-semibold ${feature.isDangerous ? 'text-red-300' : 'text-white'}`}>
                {feature.title}
              </h3>
              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{feature.description}</p>
              {feature.hasInput && feature.setInputValue && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={feature.inputValue}
                    onChange={(e) => feature.setInputValue!(e.target.value)}
                    placeholder={feature.inputPlaceholder}
                    className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                {isRunning ? (
                  <button
                    onClick={() => handleStopTask(taskId)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={handleFeatureClick}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      feature.isDangerous
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                        : 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
                    }`}
                  >
                    Run
                  </button>
                )}
                {output && (
                  <button
                    onClick={() => toggleTaskOutput(taskId)}
                    className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    {outputOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {isRunning && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        feature.isDangerous ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {output && outputOpen && (
          <div className={`border-t ${feature.terminalColor} p-3`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] text-gray-400 font-mono">output</span>
              </div>
              <div className="flex gap-0.5">
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="p-1 hover:bg-dark-700 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => clearTaskOutput(taskId)}
                  className="p-1 hover:bg-dark-700 rounded transition-colors"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <pre className="bg-dark-950/50 rounded-lg p-2.5 text-xs text-gray-200 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
              {output}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Network & Connectivity</h2>
        <p className="text-gray-400 mt-1">Manage and troubleshoot your network</p>
      </div>

      <div className="space-y-4">
        {categories.map((category, index) => {
          const categoryId = `category-${index}`
          return (
            <div key={categoryId} className="glass rounded-2xl overflow-hidden border border-dark-600">
              <button
                onClick={() => toggleCategory(categoryId)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-dark-750/50 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{category.description}</p>
                </div>
                {openCategories[categoryId] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {openCategories[categoryId] && (
                <div className="border-t border-dark-600 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.features.map(renderFeatureCard)}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Network
