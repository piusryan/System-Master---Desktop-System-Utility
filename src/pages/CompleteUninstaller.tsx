import React, { useState, useEffect } from 'react'
import { File, Folder, Search, ChevronRight, ChevronDown, HardDrive, Trash2, X, FileJson, FileText, Settings, Database, Code, Package, BookOpen } from 'lucide-react'

interface FileSystemItem {
  id: string
  path: string
  type: 'file' | 'directory'
  size: number
  modifiedDate: Date
  isSystemFile: boolean
}

interface RegistryItem {
  id: string
  hive: string
  path: string
  name: string
  type: 'key'
}

interface ScanResult {
  id: string
  timestamp: Date
  exePath: string
  exeName: string
  files: FileSystemItem[]
  registry: RegistryItem[]
  scanDurationMs: number
}

interface TreeNode {
  id: string
  path: string
  name: string
  type: string
  isDirectory: boolean
  children: TreeNode[]
  [key: string]: any
}

const CompleteUninstaller: React.FC = () => {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'complete' | 'deleting'>('idle')
  const [selectedExe, setSelectedExe] = useState<string>('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [expandedRegistry, setExpandedRegistry] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [selectedRegistry, setSelectedRegistry] = useState<Set<string>>(new Set())
  const [deleteResult, setDeleteResult] = useState<any>(null)
  const [showFilesModal, setShowFilesModal] = useState(false)
  const [showRegistryModal, setShowRegistryModal] = useState(false)

  // Auto-expand all tree nodes after scan
  useEffect(() => {
    if (scanResult) {
      const allFilePaths = new Set<string>()
      const allRegistryPaths = new Set<string>()
      
      // Auto-expand all file nodes
      const expandFileNodes = (nodes: TreeNode[]) => {
        for (const node of nodes) {
          if (node.isDirectory) {
            allFilePaths.add(node.path)
            expandFileNodes(node.children)
          }
        }
      }
      
      // Auto-expand all registry nodes
      const expandRegistryNodes = (nodes: TreeNode[]) => {
        for (const node of nodes) {
          if (node.isDirectory) {
            allRegistryPaths.add(node.path)
            expandRegistryNodes(node.children)
          }
        }
      }
      
      expandFileNodes(buildFileTree(scanResult.files))
      expandRegistryNodes(buildRegistryTree(scanResult.registry))
      
      setExpandedFiles(allFilePaths)
      setExpandedRegistry(allRegistryPaths)
    }
  }, [scanResult])

  // Build file tree with better organization
  const buildFileTree = (files: FileSystemItem[]) => {
    const tree: TreeNode[] = []
    const map = new Map<string, TreeNode>()

    // Sort files by path and group by directory
    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))

    for (const item of sorted) {
      const parts = item.path.split('\\').filter(p => p.length > 0)
      let currentLevel: TreeNode[] = tree
      let currentPath = ''

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        currentPath = currentPath ? `${currentPath}\\${part}` : part

        if (i === parts.length - 1) {
          // It's the file or directory itself
          currentLevel.push({
            ...item,
            name: part,
            isDirectory: item.type === 'directory',
            children: []
          })
        } else {
          // Check if directory already exists
          let dir = map.get(currentPath)
          if (!dir) {
            dir = {
              id: `dir_${currentPath}`,
              path: currentPath,
              name: part,
              type: 'directory',
              isDirectory: true,
              children: []
            } as TreeNode
            map.set(currentPath, dir)
            currentLevel.push(dir)
          }
          currentLevel = dir.children
        }
      }
    }

    return tree
  }

  // Helper to build registry tree structure
  const buildRegistryTree = (items: RegistryItem[]) => {
    const tree: TreeNode[] = []
    const map = new Map<string, TreeNode>()

    // Group by hive first
    const hives = new Map<string, RegistryItem[]>()
    for (const item of items) {
      if (!hives.has(item.hive)) {
        hives.set(item.hive, [])
      }
      hives.get(item.hive)!.push(item)
    }

    for (const [hive, hiveItems] of hives) {
      const hiveNode: TreeNode = {
        id: `hive_${hive}`,
        name: hive,
        path: hive,
        type: 'key',
        isDirectory: true,
        children: []
      }
      tree.push(hiveNode)
      map.set(hive, hiveNode)

      for (const item of hiveItems) {
        const parts = item.path.split('\\').filter(p => p.length > 0 && p !== hive)
        let currentLevel: TreeNode[] = hiveNode.children
        let currentPath = hive

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          currentPath = `${currentPath}\\${part}`

          if (i === parts.length - 1) {
            currentLevel.push({
              ...item,
              name: part,
              isDirectory: true,
              children: []
            })
          } else {
            let dir = map.get(currentPath)
            if (!dir) {
              dir = {
                id: `reg_dir_${currentPath}`,
                path: currentPath,
                name: part,
                type: 'key',
                isDirectory: true,
                children: []
              } as TreeNode
              map.set(currentPath, dir)
              currentLevel.push(dir)
            }
            currentLevel = dir.children
          }
        }
      }
    }

    return tree
  }

  const toggleFileExpanded = (path: string) => {
    const newSet = new Set(expandedFiles)
    if (newSet.has(path)) {
      newSet.delete(path)
    } else {
      newSet.add(path)
    }
    setExpandedFiles(newSet)
  }

  const getFileIcon = (name: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="w-5 h-5 text-yellow-400" />
    }

    const ext = name.toLowerCase().split('.').pop() || ''
    const colorClass = 'w-5 h-5'

    switch (ext) {
      case 'exe':
      case 'msi':
      case 'bat':
      case 'cmd':
        return <Package className={`${colorClass} text-orange-400`} />
      case 'dll':
      case 'sys':
      case 'ini':
        return <Settings className={`${colorClass} text-blue-400`} />
      case 'json':
        return <FileJson className={`${colorClass} text-green-400`} />
      case 'txt':
      case 'log':
      case 'md':
        return <FileText className={`${colorClass} text-cyan-400`} />
      case 'js':
      case 'ts':
      case 'py':
      case 'cs':
      case 'cpp':
      case 'c':
      case 'java':
        return <Code className={`${colorClass} text-purple-400`} />
      case 'db':
      case 'sqlite':
        return <Database className={`${colorClass} text-pink-400`} />
      default:
        return <File className={`${colorClass} text-gray-400`} />
    }
  }

  const getRegistryIcon = (name: string) => {
    if (name === 'HKCU' || name === 'HKLM') {
      return <Database className="w-5 h-5 text-red-400" />
    }
    if (name.toLowerCase().includes('uninstall')) {
      return <Trash2 className="w-5 h-5 text-orange-400" />
    }
    if (name.toLowerCase().includes('software')) {
      return <Package className="w-5 h-5 text-blue-400" />
    }
    if (name.toLowerCase().includes('classes')) {
      return <BookOpen className="w-5 h-5 text-purple-400" />
    }
    return <Settings className="w-5 h-5 text-gray-400" />
  }

  const toggleRegistryExpanded = (path: string) => {
    const newSet = new Set(expandedRegistry)
    if (newSet.has(path)) {
      newSet.delete(path)
    } else {
      newSet.add(path)
    }
    setExpandedRegistry(newSet)
  }

  const toggleFileSelected = (path: string) => {
    const newSet = new Set(selectedFiles)
    if (newSet.has(path)) {
      newSet.delete(path)
    } else {
      newSet.add(path)
    }
    setSelectedFiles(newSet)
  }

  const toggleRegistrySelected = (path: string) => {
    const newSet = new Set(selectedRegistry)
    if (newSet.has(path)) {
      newSet.delete(path)
    } else {
      newSet.add(path)
    }
    setSelectedRegistry(newSet)
  }

  const selectAllFiles = () => {
    if (!scanResult) return
    const allPaths = scanResult.files.map(f => f.path)
    setSelectedFiles(new Set(allPaths))
  }

  const selectAllRegistry = () => {
    if (!scanResult) return
    const allPaths = scanResult.registry.map(r => r.path)
    setSelectedRegistry(new Set(allPaths))
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
    setSelectedRegistry(new Set())
  }

  const handleBrowse = async () => {
    try {
      const path = await (window as any).electronAPI.selectFileDialog()
      if (path && path.toLowerCase().endsWith('.exe')) {
        setSelectedExe(path)
        setScanResult(null)
        setSelectedFiles(new Set())
        setSelectedRegistry(new Set())
        setDeleteResult(null)
      }
    } catch (error) {
      console.error('File browse error:', error)
    }
  }

  const handleScan = async () => {
    if (!selectedExe) return
    setScanState('scanning')
    try {
      const result = await (window as any).electronAPI.uninstallerScanExe(selectedExe)
      setScanResult(result)
      setScanState('complete')
    } catch (error) {
      console.error('Scan failed:', error)
      setScanState('idle')
    }
  }

  const handleDelete = async () => {
    if (!scanResult) return
    setScanState('deleting')
    try {
      const filePaths = Array.from(selectedFiles)
      const registryPaths = Array.from(selectedRegistry)
      const result = await (window as any).electronAPI.uninstallerDelete(filePaths, registryPaths)
      setDeleteResult(result)
      
      // Refresh scan
      const newScanResult = await (window as any).electronAPI.uninstallerScanExe(selectedExe)
      setScanResult(newScanResult)
      setSelectedFiles(new Set())
      setSelectedRegistry(new Set())
      setScanState('complete')
    } catch (error) {
      console.error('Delete failed:', error)
      setScanState('complete')
    }
  }

  const renderFileTree = (nodes: TreeNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div 
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-800/80 cursor-pointer text-gray-200 transition-colors group"
        >
          {node.isDirectory ? (
            <button
              onClick={() => toggleFileExpanded(node.path)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              {expandedFiles.has(node.path) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <input
            type="checkbox"
            checked={selectedFiles.has(node.path)}
            onChange={() => toggleFileSelected(node.path)}
            className="w-4 h-4 rounded cursor-pointer accent-red-500"
          />
          {getFileIcon(node.name, node.isDirectory)}
          <span className="text-sm font-medium truncate flex-1 group-hover:text-white">{node.name}</span>
          {node.type === 'file' && (
            <span className="text-xs text-gray-500 group-hover:text-gray-400 ml-auto whitespace-nowrap">
              {node.size ? (node.size > 1024 * 1024 ? (node.size / (1024 * 1024)).toFixed(1) + ' MB' : (node.size / 1024).toFixed(1) + ' KB') : '0 B'}
            </span>
          )}
        </div>
        {node.isDirectory && expandedFiles.has(node.path) && node.children.length > 0 && (
          <div className="mt-1">
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  const renderRegistryTree = (nodes: TreeNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div 
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-800/80 cursor-pointer text-gray-200 transition-colors group"
        >
          <button
            onClick={() => toggleRegistryExpanded(node.path)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            {expandedRegistry.has(node.path) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
          <input
            type="checkbox"
            checked={selectedRegistry.has(node.path)}
            onChange={() => toggleRegistrySelected(node.path)}
            className="w-4 h-4 rounded cursor-pointer accent-purple-500"
          />
          {getRegistryIcon(node.name)}
          <span className="text-sm font-mono truncate flex-1 group-hover:text-white">{node.name}</span>
        </div>
        {expandedRegistry.has(node.path) && node.children.length > 0 && (
          <div className="mt-1">
            {renderRegistryTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl border border-red-500/30">
          <HardDrive className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Complete Uninstaller
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            Select an EXE file to scan related files, folders, and registry entries
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select EXE File
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={selectedExe}
                readOnly
                placeholder="C:\Path\To\Your\Program.exe"
                className="flex-1 bg-dark-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleBrowse}
                className="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Browse
              </button>
            </div>
          </div>
          <button
            onClick={handleScan}
            disabled={!selectedExe || scanState === 'scanning' || scanState === 'deleting'}
            className="px-7 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2 h-fit"
          >
            {scanState === 'scanning' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {scanState === 'scanning' ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {(scanState === 'complete' || scanState === 'deleting') && scanResult && (
        <>
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <button
              onClick={() => setShowFilesModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <Folder className="w-5 h-5" />
              View Files ({scanResult.files.length})
            </button>
            
            <button
              onClick={() => setShowRegistryModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <File className="w-5 h-5" />
              View Registry ({scanResult.registry.length})
            </button>

            <div className="flex-1" />

            <button
              onClick={clearSelection}
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors"
            >
              Clear Selection
            </button>

            <button
              onClick={handleDelete}
              disabled={scanState === 'deleting' || (selectedFiles.size === 0 && selectedRegistry.size === 0)}
              className="px-7 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              {scanState === 'deleting' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {scanState === 'deleting' ? 'Deleting...' : `Delete (${selectedFiles.size + selectedRegistry.size})`}
            </button>
          </div>

          {deleteResult && (
            <div className="glass rounded-2xl p-5 border border-green-500/30 bg-green-500/10">
              <h4 className="font-semibold text-green-300 mb-3">✓ Delete Complete</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div>Files deleted: {deleteResult.files.filter((r: any) => r.success).length} / {deleteResult.files.length}</div>
                <div>Registry deleted: {deleteResult.registry.filter((r: any) => r.success).length} / {deleteResult.registry.length}</div>
              </div>
            </div>
          )}

          {/* Files Modal */}
          {showFilesModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass rounded-2xl border border-gray-700 w-full max-w-3xl max-h-[85vh] flex flex-col bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl">
                <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 flex justify-between items-center sticky top-0">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Folder className="w-7 h-7 text-yellow-400" />
                    Files & Folders
                  </h2>
                  <button
                    onClick={() => setShowFilesModal(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                  {scanResult?.files.length === 0 ? (
                    <div className="text-gray-400 text-center py-12">No files found</div>
                  ) : (
                    renderFileTree(buildFileTree(scanResult?.files || []))
                  )}
                </div>

                <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-between items-center sticky bottom-0">
                  <div className="text-sm text-gray-400">
                    {scanResult?.files.length || 0} items • {selectedFiles.size} selected
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={selectAllFiles}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium rounded-lg transition-colors text-sm"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setShowFilesModal(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registry Modal */}
          {showRegistryModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass rounded-2xl border border-gray-700 w-full max-w-3xl max-h-[85vh] flex flex-col bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl">
                <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex justify-between items-center sticky top-0">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <File className="w-7 h-7 text-purple-400" />
                    Registry Entries
                  </h2>
                  <button
                    onClick={() => setShowRegistryModal(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                  {scanResult?.registry.length === 0 ? (
                    <div className="text-gray-400 text-center py-12">No registry entries found</div>
                  ) : (
                    renderRegistryTree(buildRegistryTree(scanResult?.registry || []))
                  )}
                </div>

                <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-between items-center sticky bottom-0">
                  <div className="text-sm text-gray-400">
                    {scanResult?.registry.length || 0} items • {selectedRegistry.size} selected
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={selectAllRegistry}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium rounded-lg transition-colors text-sm"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setShowRegistryModal(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CompleteUninstaller
