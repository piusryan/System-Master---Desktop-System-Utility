import React, { useState } from 'react'
import {
  HardDrive,
  Activity,
  Monitor,
  Smartphone,
  Speaker,
  Bluetooth,
  Camera,
  Wifi,
  Printer,
  Settings,
  Video,
  Disc,
  RefreshCw,
  Shield,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  X
} from 'lucide-react'

interface FeatureOutput {
  id: string
  output: string
  isOpen: boolean
}

const FixRepair: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [progressPercentages, setProgressPercentages] = useState<Record<string, number>>({})
  const [featureOutputs, setFeatureOutputs] = useState<Record<string, FeatureOutput>>({})

  const simulateProgress = (id: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 6) + 1
      if (progress >= 95) {
        progress = 95
        clearInterval(interval)
      }
      setProgressPercentages(prev => ({ ...prev, [id]: progress }))
    }, 500)
    return interval
  }

  const runCommand = async (id: string, commandName: string, action: () => Promise<string>) => {
    setLoadingStates(prev => ({ ...prev, [id]: true }))
    setProgressPercentages(prev => ({ ...prev, [id]: 0 }))
    const progressInterval = simulateProgress(id)
    
    setFeatureOutputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        output: `--- Running ${commandName} ---\n`,
        isOpen: true
      }
    }))
    try {
      const result = await action()
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
      id: 'check-disk',
      title: 'Check Disk',
      description: 'Scan and fix disk errors',
      icon: <HardDrive className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      terminalColor: 'border-blue-500/30 bg-blue-950/40',
      action: () => runCommand('check-disk', 'Check Disk', window.electronAPI.checkDisk)
    },
    {
      id: 'windows-memory-diagnostic',
      title: 'Windows Memory Diagnostic',
      description: 'Check for memory problems',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      terminalColor: 'border-green-500/30 bg-green-950/40',
      action: () => runCommand('windows-memory-diagnostic', 'Windows Memory Diagnostic', window.electronAPI.windowsMemoryDiagnostic)
    },
    {
      id: 'directx-diagnostic',
      title: 'DirectX Diagnostic Tool',
      description: 'Test DirectX functionality',
      icon: <Monitor className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      terminalColor: 'border-purple-500/30 bg-purple-950/40',
      action: () => runCommand('directx-diagnostic', 'DirectX Diagnostic Tool', window.electronAPI.directxDiagnostic)
    },
    {
      id: 'fix-windows-apps',
      title: 'Fix Windows Apps',
      description: 'Re-register and repair Windows apps',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      terminalColor: 'border-orange-500/30 bg-orange-950/40',
      action: () => runCommand('fix-windows-apps', 'Fix Windows Apps', window.electronAPI.fixWindowsApps)
    },
    {
      id: 'fix-bluetooth',
      title: 'Fix Bluetooth Issues',
      description: 'Restart Bluetooth services',
      icon: <Bluetooth className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-500',
      terminalColor: 'border-cyan-500/30 bg-cyan-950/40',
      action: () => runCommand('fix-bluetooth', 'Fix Bluetooth Issues', window.electronAPI.fixBluetooth)
    },
    {
      id: 'fix-audio',
      title: 'Fix Audio & Sound Issues',
      description: 'Restart audio services',
      icon: <Speaker className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      terminalColor: 'border-yellow-500/30 bg-yellow-950/40',
      action: () => runCommand('fix-audio', 'Fix Audio & Sound Issues', window.electronAPI.fixAudio)
    },
    {
      id: 'troubleshoot-bluetooth',
      title: 'Bluetooth Troubleshooter',
      description: 'Run Windows Bluetooth troubleshooter',
      icon: <Bluetooth className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      terminalColor: 'border-indigo-500/30 bg-indigo-950/40',
      action: () => runCommand('troubleshoot-bluetooth', 'Bluetooth Troubleshooter', window.electronAPI.troubleshootBluetooth)
    },
    {
      id: 'troubleshoot-camera',
      title: 'Camera Troubleshooter',
      description: 'Run Windows Camera troubleshooter',
      icon: <Camera className="w-6 h-6" />,
      color: 'from-pink-500 to-red-500',
      terminalColor: 'border-pink-500/30 bg-pink-950/40',
      action: () => runCommand('troubleshoot-camera', 'Camera Troubleshooter', window.electronAPI.troubleshootCamera)
    },
    {
      id: 'troubleshoot-network',
      title: 'Network & Internet Troubleshooter',
      description: 'Run Windows Network troubleshooter',
      icon: <Wifi className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      terminalColor: 'border-green-500/30 bg-green-950/40',
      action: () => runCommand('troubleshoot-network', 'Network Troubleshooter', window.electronAPI.troubleshootNetwork)
    },
    {
      id: 'troubleshoot-printer',
      title: 'Printer Troubleshooter',
      description: 'Run Windows Printer troubleshooter',
      icon: <Printer className="w-6 h-6" />,
      color: 'from-gray-500 to-gray-600',
      terminalColor: 'border-gray-500/30 bg-gray-950/40',
      action: () => runCommand('troubleshoot-printer', 'Printer Troubleshooter', window.electronAPI.troubleshootPrinter)
    },
    {
      id: 'troubleshoot-compatibility',
      title: 'Program Compatibility Troubleshooter',
      description: 'Run Windows Program Compatibility troubleshooter',
      icon: <Settings className="w-6 h-6" />,
      color: 'from-orange-500 to-amber-500',
      terminalColor: 'border-orange-500/30 bg-orange-950/40',
      action: () => runCommand('troubleshoot-compatibility', 'Compatibility Troubleshooter', window.electronAPI.troubleshootCompatibility)
    },
    {
      id: 'troubleshoot-video-playback',
      title: 'Video Playback Troubleshooter',
      description: 'Run Windows Video Playback troubleshooter',
      icon: <Video className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-500',
      terminalColor: 'border-purple-500/30 bg-purple-950/40',
      action: () => runCommand('troubleshoot-video-playback', 'Video Playback Troubleshooter', window.electronAPI.troubleshootVideoPlayback)
    },
    {
      id: 'troubleshoot-windows-media-player',
      title: 'Windows Media Player Troubleshooter',
      description: 'Run Windows Media Player troubleshooter',
      icon: <Disc className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-500',
      terminalColor: 'border-blue-500/30 bg-blue-950/40',
      action: () => runCommand('troubleshoot-windows-media-player', 'WMP Troubleshooter', window.electronAPI.troubleshootWindowsMediaPlayer)
    },
    {
      id: 'troubleshoot-windows-update',
      title: 'Windows Update Troubleshooter',
      description: 'Run Windows Update troubleshooter',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'from-green-500 to-cyan-500',
      terminalColor: 'border-green-500/30 bg-green-950/40',
      action: () => runCommand('troubleshoot-windows-update', 'Windows Update Troubleshooter', window.electronAPI.troubleshootWindowsUpdate)
    },
    {
      id: 'enable-quick-recovery',
      title: 'Enable Quick Machine Recovery',
      description: 'Enable boot status policy to ignore failures',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-emerald-500 to-green-600',
      terminalColor: 'border-emerald-500/30 bg-emerald-950/40',
      action: () => runCommand('enable-quick-recovery', 'Enable Quick Recovery', window.electronAPI.enableQuickRecovery)
    },
    {
      id: 'disable-quick-recovery',
      title: 'Disable Quick Machine Recovery',
      description: 'Disable quick recovery mode',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-red-500 to-rose-600',
      terminalColor: 'border-red-500/30 bg-red-950/40',
      action: () => runCommand('disable-quick-recovery', 'Disable Quick Recovery', window.electronAPI.disableQuickRecovery)
    },
    {
      id: 'activate-self-healing',
      title: 'Activate Self-Healing Mode',
      description: 'Enable NTFS self-healing',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      terminalColor: 'border-purple-500/30 bg-purple-950/40',
      action: () => runCommand('activate-self-healing', 'Activate Self-Healing', window.electronAPI.activateSelfHealing)
    },
    {
      id: 'generate-system-logs',
      title: 'Generate System Logs',
      description: 'Collect and save recent system event logs',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-600',
      terminalColor: 'border-blue-500/30 bg-blue-950/40',
      action: () => runCommand('generate-system-logs', 'Generate System Logs', window.electronAPI.generateSystemLogs)
    },
    {
      id: 'generate-application-logs',
      title: 'Generate Application Logs',
      description: 'Collect and save recent application event logs',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-orange-500 to-red-600',
      terminalColor: 'border-orange-500/30 bg-orange-950/40',
      action: () => runCommand('generate-application-logs', 'Generate Application Logs', window.electronAPI.generateApplicationLogs)
    },
    {
      id: 'generate-security-logs',
      title: 'Generate Security Logs',
      description: 'Collect and save recent security event logs',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'from-red-500 to-rose-600',
      terminalColor: 'border-red-500/30 bg-red-950/40',
      action: () => runCommand('generate-security-logs', 'Generate Security Logs', window.electronAPI.generateSecurityLogs)
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Fix & Repair</h2>
        <p className="text-gray-400 mt-1">Tools to diagnose and fix common Windows issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map(feature => (
          <div
            key={feature.id}
            className="glass rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary-500/50 transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{feature.description}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={feature.action}
                      disabled={loadingStates[feature.id]}
                      className="flex-1 px-4 py-2 bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
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
                          className="h-full transition-all duration-200 bg-gradient-to-r from-primary-500 to-accent-500"
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

export default FixRepair
