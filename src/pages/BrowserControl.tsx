import React, { useState, useEffect } from 'react'
import { Globe, ShieldAlert, AlertTriangle, CheckCircle2, Trash2, PowerOff } from 'lucide-react'

interface BrowserExtension {
  id: string
  name: string
  description?: string
  version: string
  permissions: string[]
  isSideloaded: boolean
  browser: 'chrome' | 'edge' | 'firefox'
  path?: string
  iconUrl?: string
}

const BrowserControl: React.FC = () => {
  const [extensions, setExtensions] = useState<BrowserExtension[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedBrowser, setSelectedBrowser] = useState<'all' | 'chrome' | 'edge' | 'firefox'>('all')
  const [statusMessage, setStatusMessage] = useState<string>('')

  useEffect(() => {
    scanExtensions()
  }, [])

  const scanExtensions = async () => {
    setIsLoading(true)
    setStatusMessage('Scanning browser extensions...')
    try {
      const results = await window.electronAPI.scanBrowserExtensions()
      setExtensions(results)
      setStatusMessage(`Found ${results.length} extensions across browsers`)
    } catch (err: any) {
      setStatusMessage('Error scanning extensions: ' + (err.message || err))
    } finally {
      setIsLoading(false)
    }
  }

  const disableExtension = async (extension: BrowserExtension) => {
    if (window.confirm(`Are you sure you want to disable "${extension.name}"?`)) {
      try {
        await window.electronAPI.disableBrowserExtension(extension.id, extension.browser)
        setStatusMessage(`Disabled "${extension.name}"`)
        scanExtensions()
      } catch (err: any) {
        setStatusMessage('Error disabling extension: ' + (err.message || err))
      }
    }
  }

  const removeExtension = async (extension: BrowserExtension) => {
    if (window.confirm(`Are you sure you want to REMOVE "${extension.name}"? This cannot be undone!`)) {
      try {
        await window.electronAPI.removeBrowserExtension(extension.id, extension.browser)
        setStatusMessage(`Removed "${extension.name}"`)
        scanExtensions()
      } catch (err: any) {
        setStatusMessage('Error removing extension: ' + (err.message || err))
      }
    }
  }

  const filteredExtensions = selectedBrowser === 'all'
    ? extensions
    : extensions.filter(e => e.browser === selectedBrowser)

  const getRiskLevel = (ext: BrowserExtension) => {
    let risk = 0
    if (ext.isSideloaded) risk += 3
    if (ext.permissions.includes('proxy')) risk += 2
    if (ext.permissions.includes('downloads')) risk += 1
    if (ext.permissions.includes('<all_urls>') || ext.permissions.includes('http://*/*') || ext.permissions.includes('https://*/*')) risk += 1
    if (ext.permissions.includes('tabs')) risk += 1
    if (ext.permissions.includes('cookies')) risk += 2
    if (ext.permissions.includes('history')) risk += 2
    if (ext.permissions.includes('bookmarks')) risk += 1

    if (risk >= 5) return 'high'
    if (risk >= 3) return 'medium'
    return 'low'
  }

  const formatPermissions = (perms: string[]) => {
    const friendlyNames: Record<string, string> = {
      'tabs': 'Read open tabs',
      'bookmarks': 'Access bookmarks',
      'history': 'View browsing history',
      'downloads': 'Manage downloads',
      'cookies': 'Access cookies',
      'storage': 'Read/write data',
      'notifications': 'Show notifications',
      'proxy': 'Modify proxy settings',
      'geolocation': 'Access location',
      'audioCapture': 'Record audio',
      'videoCapture': 'Record video'
    }
    return perms.map(p => friendlyNames[p] || p).filter(p => !p.includes('://')) // Skip URL permissions for brevity
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe className="w-7 h-7 text-cyan-400" />
          Browser Control
        </h2>
        <p className="text-gray-400 mt-1">Audit, disable, or remove browser extensions from Chrome, Edge, and Firefox</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedBrowser('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedBrowser === 'all' ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              All Browsers
            </button>
            <button
              onClick={() => setSelectedBrowser('chrome')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedBrowser === 'chrome' ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              Chrome
            </button>
            <button
              onClick={() => setSelectedBrowser('edge')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedBrowser === 'edge' ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              Edge
            </button>
            <button
              onClick={() => setSelectedBrowser('firefox')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedBrowser === 'firefox' ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              Firefox
            </button>
          </div>
          <button
            onClick={scanExtensions}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Scan Extensions
          </button>
        </div>
        {statusMessage && <p className="text-xs text-gray-400">{statusMessage}</p>}
      </div>

      {filteredExtensions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredExtensions.map((ext) => {
            const risk = getRiskLevel(ext)
            return (
              <div key={`${ext.browser}-${ext.id}`} className="glass rounded-2xl p-5 border border-dark-600 hover:border-primary-500/30 transition-all">
                <div className="flex gap-3 mb-3">
                  {ext.iconUrl ? (
                    <img src={ext.iconUrl} alt="" className="w-12 h-12 rounded-xl" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-sm truncate">{ext.name}</h3>
                      <span className="text-[10px] bg-dark-700 px-2 py-0.5 rounded uppercase text-gray-400">
                        {ext.browser}
                      </span>
                    </div>
                    {ext.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{ext.description}</p>}
                    <p className="text-gray-600 text-[10px] mt-1">v{ext.version}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    {risk === 'high' && <ShieldAlert className="w-3 h-3 text-red-400" />}
                    {risk === 'medium' && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                    {risk === 'low' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    <span className={`text-[10px] font-semibold uppercase ${
                      risk === 'high' ? 'text-red-400' :
                      risk === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                    }`}>
                      {risk === 'high' ? 'High Risk' :
                       risk === 'medium' ? 'Medium Risk' : 'Low Risk'}
                    </span>
                  </div>
                  {ext.isSideloaded && (
                    <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg mb-2">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] text-red-300">Sideloaded (not from official store)</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {formatPermissions(ext.permissions).slice(0, 5).map(p => (
                      <span key={p} className="text-[10px] bg-dark-800 text-gray-300 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                    {ext.permissions.length > 5 && (
                      <span className="text-[10px] bg-dark-800 text-gray-500 px-2 py-0.5 rounded-full">
                        +{ext.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => disableExtension(ext)}
                    className="flex-1 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <PowerOff className="w-3 h-3" />
                    Disable
                  </button>
                  <button
                    onClick={() => removeExtension(ext)}
                    className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <Globe className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No Extensions Found</h3>
          <p className="text-gray-500 text-sm">Click "Scan Extensions" to audit your browser add-ons</p>
        </div>
      )}
    </div>
  )
}

export default BrowserControl
