import React, { useState } from 'react'
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
  Unlock
} from 'lucide-react'

interface FeatureOutput {
  id: string
  output: string
  isOpen: boolean
}

const Network: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [progressPercentages, setProgressPercentages] = useState<Record<string, number>>({})
  const [featureOutputs, setFeatureOutputs] = useState<Record<string, FeatureOutput>>({})
  const [pingHost, setPingHost] = useState('google.com')

  const simulateProgress = (id: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 2 // Random progress between 2-10%
      if (progress >= 95) {
        progress = 95 // Cap at 95% until command completes
        clearInterval(interval)
      }
      setProgressPercentages(prev => ({ ...prev, [id]: progress }))
    }, 200) // Update every 200ms
    return interval
  }

  const runCommand = async (id: string, commandName: string, args?: any) => {
    setLoadingStates(prev => ({ ...prev, [id]: true }))
    setProgressPercentages(prev => ({ ...prev, [id]: 0 }))
    const progressInterval = simulateProgress(id)
    
    setFeatureOutputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        output: `--- Running ${commandName} --- \n`,
        isOpen: true
      }
    }))
    try {
      let result: string
      switch (commandName) {
        case 'ping':
          result = await window.electronAPI.networkPing(args.host)
          break
        case 'ipconfig':
          result = await window.electronAPI.networkIpConfig()
          break
        case 'flushDns':
          result = await window.electronAPI.networkFlushDns()
          break
        case 'releaseIp':
          result = await window.electronAPI.networkReleaseIp()
          break
        case 'renewIp':
          result = await window.electronAPI.networkRenewIp()
          break
        case 'resetNetwork':
          result = await window.electronAPI.networkReset()
          break
        case 'winsockReset':
          result = await window.electronAPI.networkWinsockReset()
          break
        case 'remoteDesktop':
          await window.electronAPI.networkRemoteDesktop()
          result = 'Remote Desktop launched!'
          break
        case 'enableTelnet':
          result = await window.electronAPI.networkEnableTelnet()
          break
        case 'disableTelnet':
          result = await window.electronAPI.networkDisableTelnet()
          break
        default:
          result = 'Unknown command'
      }
      setFeatureOutputs(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          output: prev[id].output + result
        }
      }))
    } catch (error) {
      setFeatureOutputs(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          output: prev[id].output + `Error: ${error}`
        }
      }))
    } finally {
      clearInterval(progressInterval)
      setProgressPercentages(prev => ({ ...prev, [id]: 100 }))
      setLoadingStates(prev => ({ ...prev, [id]: false }))
    }
  }

  const toggleOutput = (id: string) => {
    setFeatureOutputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        output: prev[id]?.output || '',
        isOpen: !prev[id]?.isOpen
      }
    }))
  }

  const copyOutput = async (id: string) => {
    const output = featureOutputs[id]?.output
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const clearOutput = (id: string) => {
    setFeatureOutputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        output: ''
      }
    }))
  }

  const features = [
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
      action: () => runCommand('ping', 'ping', { host: pingHost })
    },
    {
      id: 'ipconfig',
      title: 'IP Configuration',
      description: 'View detailed network configuration',
      icon: <Wifi className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      terminalColor: 'border-green-500/30 bg-green-950/40',
      action: () => runCommand('ipconfig', 'ipconfig')
    },
    {
      id: 'flushDns',
      title: 'Flush DNS',
      description: 'Clear DNS resolver cache',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      terminalColor: 'border-purple-500/30 bg-purple-950/40',
      action: () => runCommand('flushDns', 'flushDns')
    },
    {
      id: 'remoteDesktop',
      title: 'Remote Desktop Connection',
      description: 'Launch Remote Desktop client',
      icon: <Globe className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      terminalColor: 'border-orange-500/30 bg-orange-950/40',
      action: () => runCommand('remoteDesktop', 'remoteDesktop')
    },
    {
      id: 'resetNetwork',
      title: 'Reset TCP/IP',
      description: 'Reset TCP/IP stack (requires admin)',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      terminalColor: 'border-yellow-500/30 bg-yellow-950/40',
      isDangerous: true,
      action: () => runCommand('resetNetwork', 'resetNetwork')
    },
    {
      id: 'releaseRenew',
      title: 'Release & Renew IP',
      description: 'Release and renew your IP address',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      terminalColor: 'border-indigo-500/30 bg-indigo-950/40',
      action: async () => {
        await runCommand('releaseRenew', 'releaseIp')
        setTimeout(async () => {
          await runCommand('releaseRenew', 'renewIp')
        }, 2000)
      }
    },
    {
      id: 'resetAll',
      title: 'Reset Network Configurations',
      description: 'Full network reset (requires admin)',
      icon: <Trash2 className="w-6 h-6" />,
      color: 'from-red-500 to-pink-500',
      terminalColor: 'border-red-500/30 bg-red-950/40',
      isDangerous: true,
      action: () => {
        if (confirm('This will reset all network settings. Continue?')) {
          runCommand('resetAll', 'winsockReset')
        }
      }
    },
    {
      id: 'winsock',
      title: 'Winsock Reset',
      description: 'Reset Winsock catalog',
      icon: <Terminal className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-500',
      terminalColor: 'border-cyan-500/30 bg-cyan-950/40',
      isDangerous: true,
      action: () => runCommand('winsock', 'winsockReset')
    },
    {
      id: 'enableTelnet',
      title: 'Enable Telnet Client',
      description: 'Enable Windows Telnet Client feature',
      icon: <Unlock className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      terminalColor: 'border-green-500/30 bg-green-950/40',
      isDangerous: false,
      action: () => runCommand('enableTelnet', 'enableTelnet')
    },
    {
      id: 'disableTelnet',
      title: 'Disable Telnet Client',
      description: 'Disable Windows Telnet Client feature',
      icon: <Lock className="w-6 h-6" />,
      color: 'from-red-500 to-rose-500',
      terminalColor: 'border-red-500/30 bg-red-950/40',
      isDangerous: false,
      action: () => runCommand('disableTelnet', 'disableTelnet')
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Network & Connectivity</h2>
        <p className="text-gray-400 mt-1">Manage your network connections and troubleshoot issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map(feature => (
          <div
            key={feature.id}
            className={`glass rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
              feature.isDangerous ? 'border-red-500/30 hover:border-red-500/50' : 'border-transparent hover:border-primary-500/50'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${feature.isDangerous ? 'text-red-300' : 'text-white'}`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">{feature.description}</p>
                  {feature.hasInput && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={feature.inputValue}
                        onChange={(e) => feature.setInputValue(e.target.value)}
                        placeholder={feature.inputPlaceholder}
                        className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={feature.action}
                      disabled={loadingStates[feature.id]}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        feature.isDangerous
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loadingStates[feature.id] ? `Running... ${progressPercentages[feature.id] || 0}%` : 'Run'}
                    </button>
                    {featureOutputs[feature.id]?.output && (
                      <button
                        onClick={() => toggleOutput(feature.id)}
                        className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                      >
                        {featureOutputs[feature.id].isOpen ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  {loadingStates[feature.id] && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{progressPercentages[feature.id] || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${
                            feature.isDangerous ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'
                          }`}
                          style={{ width: `${progressPercentages[feature.id] || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {featureOutputs[feature.id]?.output && featureOutputs[feature.id].isOpen && (
              <div className={`border-t ${feature.terminalColor} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-xs text-gray-400 font-mono">cmd.exe</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyOutput(feature.id)}
                      className="p-1 hover:bg-dark-700 rounded transition-colors"
                      title="Copy output"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => clearOutput(feature.id)}
                      className="p-1 hover:bg-dark-700 rounded transition-colors"
                      title="Clear output"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <pre className="bg-dark-950/50 rounded-lg p-3 text-sm text-gray-200 overflow-auto max-h-64 whitespace-pre-wrap font-mono">
                  {featureOutputs[feature.id].output}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Network
