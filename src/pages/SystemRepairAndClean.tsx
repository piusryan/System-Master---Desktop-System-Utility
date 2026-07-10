import React, { useState } from 'react'
import {
  Shield,
  RefreshCw,
  Activity,
  Wrench,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
  Trash2,
  HardDrive,
  Store,
  Mail,
  MessageSquare,
  Image,
  FileText,
  Database,
  Eraser,
  LayoutGrid,
  History,
  MapPin
} from 'lucide-react'

interface FeatureOutput {
  id: string
  output: string
  isOpen: boolean
}

const SystemRepairAndClean: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [progressPercentages, setProgressPercentages] = useState<Record<string, number>>({})
  const [featureOutputs, setFeatureOutputs] = useState<Record<string, FeatureOutput>>({})

  const simulateProgress = (id: string) => {
    let progress = 0
    const interval = setInterval(() => {
      if (progress < 90) {
        progress += Math.floor(Math.random() * 6) + 1 // Faster at the start
      } else if (progress < 100) {
        // Slow down once we hit 90%, just tick 1% at a time to show activity
        progress += 1
      }
      // Don't let it go over 99% until the command actually finishes
      if (progress >= 99) {
        progress = 99
      }
      setProgressPercentages(prev => ({ ...prev, [id]: progress }))
    }, 500) // Update every 500ms
    return interval
  }

  const runCommand = async (id: string, commandName: string) => {
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
        case 'sfcScan':
          result = await window.electronAPI.sfcScan()
          break
        case 'dismCheckHealth':
          result = await window.electronAPI.dismCheckHealth()
          break
        case 'dismScanHealth':
          result = await window.electronAPI.dismScanHealth()
          break
        case 'dismRestoreHealth':
          result = await window.electronAPI.dismRestoreHealth()
          break
        case 'deleteRunHistory':
          result = await window.electronAPI.deleteRunHistory()
          break
        case 'deleteTempInternetFiles':
          result = await window.electronAPI.deleteTempInternetFiles()
          break
        case 'clearWindowsUpdateCache':
          result = await window.electronAPI.clearWindowsUpdateCache()
          break
        case 'clearThumbnailCache':
          result = await window.electronAPI.clearThumbnailCache()
          break
        case 'clearMicrosoftStoreCache':
          result = await window.electronAPI.clearMicrosoftStoreCache()
          break
        case 'clearOutlookCache':
          result = await window.electronAPI.clearOutlookCache()
          break
        case 'clearTeamsCache':
          result = await window.electronAPI.clearTeamsCache()
          break
        case 'clearRecycleBin':
          result = await window.electronAPI.clearRecycleBin()
          break
        case 'deleteOldWindows':
          result = await window.electronAPI.deleteOldWindows()
          break
        case 'defragmentDrive':
          result = await window.electronAPI.defragmentDrive()
          break
        case 'wipeFreeSpace':
          result = await window.electronAPI.wipeFreeSpace()
          break
        case 'manageDiskPartitions':
          result = await window.electronAPI.manageDiskPartitions()
          break
        case 'deleteRecentItems':
          result = await window.electronAPI.deleteRecentItems()
          break
        case 'deleteAddressBarHistory':
          result = await window.electronAPI.deleteAddressBarHistory()
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
      id: 'sfcScan',
      title: 'SFC Scan',
      description: 'System File Checker - scan and repair corrupted system files',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      terminalColor: 'border-blue-500/30 bg-blue-950/40',
      isDangerous: false,
      action: () => runCommand('sfcScan', 'sfcScan')
    },
    {
      id: 'dismCheckHealth',
      title: 'DISM Check Health',
      description: 'Check if the system image has any corruption',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      terminalColor: 'border-green-500/30 bg-green-950/40',
      isDangerous: false,
      action: () => runCommand('dismCheckHealth', 'dismCheckHealth')
    },
    {
      id: 'dismScanHealth',
      title: 'DISM Scan Health',
      description: 'Scan the system image for corruption (takes longer)',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      terminalColor: 'border-yellow-500/30 bg-yellow-950/40',
      isDangerous: false,
      action: () => runCommand('dismScanHealth', 'dismScanHealth')
    },
    {
      id: 'dismRestoreHealth',
      title: 'DISM Restore Health',
      description: 'Repair corrupted system image using Windows Update',
      icon: <Wrench className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      terminalColor: 'border-purple-500/30 bg-purple-950/40',
      isDangerous: false,
      action: () => runCommand('dismRestoreHealth', 'dismRestoreHealth')
    },
    {
      id: 'deleteRunHistory',
      title: 'Delete Run History',
      description: 'Clear the Run dialog command history',
      icon: <History className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      terminalColor: 'border-orange-500/30 bg-orange-950/40',
      isDangerous: false,
      action: () => runCommand('deleteRunHistory', 'deleteRunHistory')
    },
    {
      id: 'deleteTempInternetFiles',
      title: 'Delete Temporary Internet Files',
      description: 'Clear Internet Explorer and Edge temporary files',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-500',
      terminalColor: 'border-cyan-500/30 bg-cyan-950/40',
      isDangerous: false,
      action: () => runCommand('deleteTempInternetFiles', 'deleteTempInternetFiles')
    },
    {
      id: 'clearWindowsUpdateCache',
      title: 'Clear Windows Update Cache',
      description: 'Delete downloaded Windows Update files',
      icon: <Database className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      terminalColor: 'border-green-500/30 bg-green-950/40',
      isDangerous: false,
      action: () => runCommand('clearWindowsUpdateCache', 'clearWindowsUpdateCache')
    },
    {
      id: 'clearThumbnailCache',
      title: 'Clear Thumbnail Cache',
      description: 'Reset file and folder thumbnail previews',
      icon: <Image className="w-6 h-6" />,
      color: 'from-purple-500 to-indigo-500',
      terminalColor: 'border-purple-500/30 bg-purple-950/40',
      isDangerous: false,
      action: () => runCommand('clearThumbnailCache', 'clearThumbnailCache')
    },
    {
      id: 'clearMicrosoftStoreCache',
      title: 'Clear Microsoft Store Cache',
      description: 'Reset Microsoft Store and fix download issues',
      icon: <Store className="w-6 h-6" />,
      color: 'from-blue-600 to-indigo-600',
      terminalColor: 'border-blue-600/30 bg-blue-950/40',
      isDangerous: false,
      action: () => runCommand('clearMicrosoftStoreCache', 'clearMicrosoftStoreCache')
    },
    {
      id: 'clearOutlookCache',
      title: 'Clear Microsoft Outlook Cache',
      description: 'Clear Outlook cache to fix sync issues',
      icon: <Mail className="w-6 h-6" />,
      color: 'from-blue-500 to-purple-500',
      terminalColor: 'border-blue-500/30 bg-blue-950/40',
      isDangerous: false,
      action: () => runCommand('clearOutlookCache', 'clearOutlookCache')
    },
    {
      id: 'clearTeamsCache',
      title: 'Clear Microsoft Teams Cache',
      description: 'Clear Teams cache to fix issues',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'from-purple-600 to-pink-600',
      terminalColor: 'border-purple-600/30 bg-purple-950/40',
      isDangerous: false,
      action: () => runCommand('clearTeamsCache', 'clearTeamsCache')
    },
    {
      id: 'clearRecycleBin',
      title: 'Clear Recycle Bin',
      description: 'Permanently delete all files in Recycle Bin',
      icon: <Trash2 className="w-6 h-6" />,
      color: 'from-red-500 to-rose-600',
      terminalColor: 'border-red-500/30 bg-red-950/40',
      isDangerous: true,
      action: () => runCommand('clearRecycleBin', 'clearRecycleBin')
    },
    {
      id: 'deleteOldWindows',
      title: 'Delete Old Windows',
      description: 'Remove Windows.old folder (previous Windows installation)',
      icon: <HardDrive className="w-6 h-6" />,
      color: 'from-amber-500 to-red-600',
      terminalColor: 'border-amber-500/30 bg-amber-950/40',
      isDangerous: true,
      action: () => runCommand('deleteOldWindows', 'deleteOldWindows')
    },
    {
      id: 'defragmentDrive',
      title: 'Perform Defragmentation',
      description: 'Optimize drive performance by defragmenting',
      icon: <HardDrive className="w-6 h-6" />,
      color: 'from-emerald-500 to-green-600',
      terminalColor: 'border-emerald-500/30 bg-emerald-950/40',
      isDangerous: false,
      action: () => runCommand('defragmentDrive', 'defragmentDrive')
    },
    {
      id: 'wipeFreeSpace',
      title: 'Securely Wipe Free Space',
      description: 'Overwrite free space to prevent file recovery',
      icon: <Eraser className="w-6 h-6" />,
      color: 'from-red-600 to-rose-700',
      terminalColor: 'border-red-600/30 bg-red-950/40',
      isDangerous: true,
      action: () => runCommand('wipeFreeSpace', 'wipeFreeSpace')
    },
    {
      id: 'manageDiskPartitions',
      title: 'Manage Disk Partitions',
      description: 'Open Windows Disk Management',
      icon: <LayoutGrid className="w-6 h-6" />,
      color: 'from-indigo-500 to-violet-600',
      terminalColor: 'border-indigo-500/30 bg-indigo-950/40',
      isDangerous: false,
      action: () => runCommand('manageDiskPartitions', 'manageDiskPartitions')
    },
    {
      id: 'deleteRecentItems',
      title: 'Delete Recent Items History',
      description: 'Clear File Explorer recent items and jump lists',
      icon: <History className="w-6 h-6" />,
      color: 'from-slate-500 to-gray-600',
      terminalColor: 'border-slate-500/30 bg-slate-950/40',
      isDangerous: false,
      action: () => runCommand('deleteRecentItems', 'deleteRecentItems')
    },
    {
      id: 'deleteAddressBarHistory',
      title: 'Delete Address Bar History',
      description: 'Clear File Explorer and Run dialog address history',
      icon: <MapPin className="w-6 h-6" />,
      color: 'from-sky-500 to-blue-600',
      terminalColor: 'border-sky-500/30 bg-sky-950/40',
      isDangerous: false,
      action: () => runCommand('deleteAddressBarHistory', 'deleteAddressBarHistory')
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System repair and clean</h2>
        <p className="text-gray-400 mt-1">Scan, repair, and clean your system files and settings</p>
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

export default SystemRepairAndClean
