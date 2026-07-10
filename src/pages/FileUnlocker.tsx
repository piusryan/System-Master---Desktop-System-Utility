import React, { useState, useEffect } from 'react'
import {
  Unlock,
  Lock,
  File,
  Folder,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Move,
  Copy,
  Terminal,
  Activity,
  Info
} from 'lucide-react'

interface ProcessInfo {
  pid: number
  name: string
  path: string
}

type EngineType = 'iobit' | 'native'
type ActionType = 'unlock' | 'delete' | 'rename' | 'move' | 'copy'

const FileUnlocker: React.FC = () => {
  const [filePath, setFilePath] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [isIobitInstalled, setIsIobitInstalled] = useState<boolean>(false)
  const [engine, setEngine] = useState<EngineType>('native')
  const [isForcedMode, setIsForcedMode] = useState<boolean>(true)
  const [lockingProcesses, setLockingProcesses] = useState<ProcessInfo[]>([])
  const [isLoadingLocks, setIsLoadingLocks] = useState<boolean>(false)
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false)
  
  // Action state popups
  const [activeDialog, setActiveDialog] = useState<'rename' | 'move' | 'copy' | null>(null)
  const [renameValue, setRenameValue] = useState<string>('')
  const [destinationPath, setDestinationPath] = useState<string>('')

  // Log/Console Output
  const [terminalOutput, setTerminalOutput] = useState<string>('')
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false)

  useEffect(() => {
    // Check if IObit Unlocker is installed on component mount
    const checkIobit = async () => {
      try {
        const installed = await window.electronAPI.checkIobitInstalled()
        setIsIobitInstalled(installed)
        if (installed) {
          setEngine('iobit') // Default to IObit if available
        }
      } catch (err) {
        console.error('Error checking IObit installation:', err)
      }
    }
    checkIobit()
  }, [])

  // Scan file for locks
  const scanForLocks = async (pathToCheck: string) => {
    if (!pathToCheck) return
    setIsLoadingLocks(true)
    setTerminalOutput(prev => prev + `Scanning path for locks: "${pathToCheck}"...\n`)
    try {
      const processes = await window.electronAPI.getFileLockingProcesses(pathToCheck)
      setLockingProcesses(processes)
      if (processes.length > 0) {
        setTerminalOutput(prev => prev + `Found ${processes.length} locking process(es).\n`)
      } else {
        setTerminalOutput(prev => prev + `No locking processes found. File is accessible.\n`)
      }
    } catch (err: any) {
      setTerminalOutput(prev => prev + `Error scanning locks: ${err.message || err}\n`)
    } finally {
      setIsLoadingLocks(false)
    }
  }

  // Handle file path changes
  const handlePathChange = (val: string) => {
    setFilePath(val)
    if (val) {
      scanForLocks(val)
    } else {
      setLockingProcesses([])
    }
  }

  // Browse dialogs
  const handleSelectFile = async () => {
    try {
      const path = await window.electronAPI.selectFileDialog()
      if (path) {
        handlePathChange(path)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectFolder = async () => {
    try {
      const path = await window.electronAPI.selectFolderDialog()
      if (path) {
        handlePathChange(path)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectDestination = async () => {
    try {
      const path = await window.electronAPI.selectFolderDialog()
      if (path) {
        setDestinationPath(path)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      // In Electron, file.path contains the absolute local OS path
      if ((file as any).path) {
        handlePathChange((file as any).path)
      }
    }
  }

  // Kill single process
  const killProcess = async (pid: number, name: string) => {
    if (window.confirm(`Are you sure you want to terminate process "${name}" (PID: ${pid})?`)) {
      setTerminalOutput(prev => prev + `Killing process ${name} (PID: ${pid})...\n`)
      try {
        const result = await window.electronAPI.unlockFileNative(filePath, 'unlock', { pid })
        setTerminalOutput(prev => prev + `${result.killSummary}\n`)
        // Rescan
        scanForLocks(filePath)
      } catch (err: any) {
        setTerminalOutput(prev => prev + `Error killing process: ${err.message || err}\n`)
      }
    }
  }

  // Execute general unlock action
  const executeUnlockAction = async (action: ActionType, extraArgs?: any) => {
    if (!filePath) return
    setIsExecutingAction(true)
    setIsTerminalOpen(true)
    setTerminalOutput(prev => prev + `\n--- Executing ${action.toUpperCase()} action on "${filePath}" ---\n`)

    try {
      if (engine === 'iobit') {
        setTerminalOutput(prev => prev + `Using IObit Unlocker Engine (Forced Mode: ${isForcedMode ? 'On' : 'Off'})...\n`)
        const modifier = isForcedMode ? 'advanced' : 'normal'
        const result = await window.electronAPI.unlockFileIobit(filePath, action, modifier, extraArgs)
        
        if (result.success) {
          setTerminalOutput(prev => prev + `IObit command executed: ${result.commandRun}\n`)
          setTerminalOutput(prev => prev + `Operation successfully queued. IObit driver handles this asynchronously.\n`)
          // Small delay before scan to allow operations to take place
          setTimeout(() => scanForLocks(filePath), 1500)
        } else {
          setTerminalOutput(prev => prev + `IObit Error: ${result.error || 'Operation failed.'}\n`)
        }
      } else {
        setTerminalOutput(prev => prev + `Using Native Windows Engine (PowerShell & Restart Manager)...\n`)
        const result = await window.electronAPI.unlockFileNative(filePath, action, extraArgs)
        
        setTerminalOutput(prev => prev + `${result.killSummary}\n`)
        setTerminalOutput(prev => prev + `${result.actionSummary}\n`)
        
        if (result.success && action !== 'delete' && action !== 'move') {
          scanForLocks(filePath)
        } else if (result.success) {
          // File deleted or moved
          setFilePath('')
          setLockingProcesses([])
        }
      }
    } catch (err: any) {
      setTerminalOutput(prev => prev + `Action Failed: ${err.message || err}\n`)
    } finally {
      setIsExecutingAction(false)
      setActiveDialog(null)
      setRenameValue('')
      setDestinationPath('')
    }
  }

  const handleActionClick = (action: ActionType) => {
    if (action === 'rename') {
      const fileName = filePath.substring(filePath.lastIndexOf('\\') + 1)
      setRenameValue(fileName)
      setActiveDialog('rename')
    } else if (action === 'move') {
      setActiveDialog('move')
    } else if (action === 'copy') {
      setActiveDialog('copy')
    } else {
      // Direct action for unlock and delete
      if (action === 'delete') {
        if (!window.confirm('WARNING: Are you sure you want to unlock and permanently delete this resource? This action cannot be undone.')) {
          return
        }
      }
      executeUnlockAction(action)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Unlock className="w-7 h-7 text-primary-400" />
          File & Folder Unlocker
        </h2>
        <p className="text-gray-400 mt-1">Unlock files and folders held by other system processes using advanced driver or native hooks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File drop area & settings */}
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`glass rounded-2xl p-8 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] text-center ${
              isDragOver ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 hover:border-dark-500'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
              {filePath ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              ) : (
                <Lock className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <p className="text-white font-medium text-lg">
              {filePath ? 'Selected Path Loaded' : 'Drag & Drop File or Folder Here'}
            </p>
            <p className="text-gray-400 text-sm mt-1 mb-6 max-w-sm">
              {filePath || 'Or choose one of the browse options below to scan for active locking handles'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSelectFile}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm"
              >
                <File className="w-4 h-4" /> Browse File
              </button>
              <button
                onClick={handleSelectFolder}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm"
              >
                <Folder className="w-4 h-4" /> Browse Folder
              </button>
            </div>
          </div>

          {/* Current Path Input */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Target Resource</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={filePath}
                onChange={e => handlePathChange(e.target.value)}
                placeholder="C:\path\to\locked_file.txt"
                className="flex-1 bg-dark-900 border border-dark-600 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-primary-500"
              />
              {filePath && (
                <button
                  onClick={() => handlePathChange('')}
                  className="px-4 py-2.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Dashboard */}
          {filePath && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Operations</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  onClick={() => handleActionClick('unlock')}
                  disabled={isExecutingAction}
                  className="flex flex-col items-center justify-center p-4 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-primary-300 rounded-xl transition-all disabled:opacity-50"
                >
                  <Unlock className="w-6 h-6 mb-2" />
                  <span className="text-xs font-semibold">Unlock</span>
                </button>
                
                <button
                  onClick={() => handleActionClick('delete')}
                  disabled={isExecutingAction}
                  className="flex flex-col items-center justify-center p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 rounded-xl transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-6 h-6 mb-2" />
                  <span className="text-xs font-semibold">Unlock & Delete</span>
                </button>

                <button
                  onClick={() => handleActionClick('rename')}
                  disabled={isExecutingAction}
                  className="flex flex-col items-center justify-center p-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 rounded-xl transition-all disabled:opacity-50"
                >
                  <Edit3 className="w-6 h-6 mb-2" />
                  <span className="text-xs font-semibold">Unlock & Rename</span>
                </button>

                <button
                  onClick={() => handleActionClick('move')}
                  disabled={isExecutingAction}
                  className="flex flex-col items-center justify-center p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 rounded-xl transition-all disabled:opacity-50"
                >
                  <Move className="w-6 h-6 mb-2" />
                  <span className="text-xs font-semibold">Unlock & Move</span>
                </button>

                <button
                  onClick={() => handleActionClick('copy')}
                  disabled={isExecutingAction}
                  className="flex flex-col items-center justify-center p-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 rounded-xl transition-all disabled:opacity-50"
                >
                  <Copy className="w-6 h-6 mb-2" />
                  <span className="text-xs font-semibold">Unlock & Copy</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Engine Settings & Lock query */}
        <div className="space-y-6">
          {/* Engine Config */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Engine Configuration</h3>
            
            <div className="space-y-3">
              <label className="text-xs text-gray-400 font-medium block">UNLOCK ENGINE</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEngine('iobit')}
                  disabled={!isIobitInstalled}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    engine === 'iobit'
                      ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                      : 'bg-dark-900 border-dark-600 text-gray-400 hover:text-white disabled:opacity-30'
                  }`}
                >
                  IObit Driver
                </button>
                <button
                  onClick={() => setEngine('native')}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    engine === 'native'
                      ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                      : 'bg-dark-900 border-dark-600 text-gray-400 hover:text-white'
                  }`}
                >
                  Native Windows
                </button>
              </div>
              {!isIobitInstalled && (
                <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>IObit Unlocker engine is unavailable because the app is not installed. Defaulting to Native Windows engine.</span>
                </div>
              )}
            </div>

            <div className="border-t border-dark-600 pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Forced Mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Force terminate locking tasks</p>
              </div>
              <button
                onClick={() => setIsForcedMode(prev => !prev)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${
                  isForcedMode ? 'bg-primary-500' : 'bg-dark-900 border border-dark-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    isForcedMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Active Locking Processes */}
          {filePath && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Locks Status</h3>
                {isLoadingLocks && <Activity className="w-4 h-4 text-primary-400 animate-spin" />}
              </div>

              {lockingProcesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-center">
                  <CheckCircle2 className="w-8 h-8 mb-2" />
                  <p className="font-semibold text-sm">No Active Locks</p>
                  <p className="text-xs text-gray-400 mt-1">This file is ready for modification or deletion.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-auto pr-1">
                  <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Locked by {lockingProcesses.length} process(es). Force terminate lock to release.</span>
                  </div>
                  {lockingProcesses.map((proc, idx) => (
                    <div key={idx} className="bg-dark-900 border border-dark-600 rounded-xl p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate font-mono">{proc.name}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">PID: {proc.pid}</p>
                      </div>
                      <button
                        onClick={() => killProcess(proc.pid, proc.name)}
                        className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all shrink-0"
                      >
                        Kill Process
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action configuration popup/modal fields */}
      {activeDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-md w-full rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
              {activeDialog === 'rename' && <Edit3 className="w-5 h-5 text-yellow-400" />}
              {activeDialog === 'move' && <Move className="w-5 h-5 text-purple-400" />}
              {activeDialog === 'copy' && <Copy className="w-5 h-5 text-cyan-400" />}
              Configure Action
            </h3>

            {activeDialog === 'rename' && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium">NEW FILENAME</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            )}

            {(activeDialog === 'move' || activeDialog === 'copy') && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium">DESTINATION DIRECTORY</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={destinationPath}
                    onChange={e => setDestinationPath(e.target.value)}
                    placeholder="C:\destination\folder"
                    className="flex-1 bg-dark-900 border border-dark-600 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-primary-500"
                  />
                  <button
                    onClick={handleSelectDestination}
                    className="px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-xl text-xs text-white"
                  >
                    Browse
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveDialog(null)}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeDialog === 'rename') {
                    const dir = filePath.substring(0, filePath.lastIndexOf('\\') + 1)
                    executeUnlockAction('rename', { newPath: dir + renameValue, newName: renameValue })
                  } else if (activeDialog === 'move') {
                    executeUnlockAction('move', { destPath: destinationPath + '\\' + filePath.substring(filePath.lastIndexOf('\\') + 1) })
                  } else if (activeDialog === 'copy') {
                    executeUnlockAction('copy', { destPath: destinationPath + '\\' + filePath.substring(filePath.lastIndexOf('\\') + 1) })
                  }
                }}
                disabled={activeDialog === 'rename' ? !renameValue : !destinationPath}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                Apply & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal logs */}
      <div className="glass rounded-2xl overflow-hidden border border-dark-600">
        <div
          onClick={() => setIsTerminalOpen(prev => !prev)}
          className="bg-dark-850 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-dark-750 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-white">Execution Console Logs</span>
          </div>
          <span className="text-xs text-gray-400">{isTerminalOpen ? 'Hide' : 'Show'}</span>
        </div>
        {isTerminalOpen && (
          <div className="p-4 bg-black/90 border-t border-dark-600">
            <div className="flex justify-between mb-2 text-xs text-gray-500 font-mono">
              <span>status_console.log</span>
              <button
                onClick={(e) => { e.stopPropagation(); setTerminalOutput(''); }}
                className="hover:text-white"
              >
                Clear Console
              </button>
            </div>
            <pre className="bg-dark-950/80 rounded-xl p-4 text-xs text-emerald-400 font-mono overflow-auto max-h-64 min-h-[120px] whitespace-pre-wrap">
              {terminalOutput || 'Console ready. Execute any action to see live operations.\n'}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUnlocker
