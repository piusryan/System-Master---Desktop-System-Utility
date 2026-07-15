export interface ElectronAPI {
  openExternal: (url: string) => Promise<void>
  networkPing: (host: string) => Promise<string>
  networkIpConfig: () => Promise<string>
  networkFlushDns: () => Promise<string>
  networkReleaseIp: () => Promise<string>
  networkRenewIp: () => Promise<string>
  networkReset: () => Promise<string>
  networkWinsockReset: () => Promise<string>
  networkRemoteDesktop: () => Promise<void>
  networkEnableTelnet: () => Promise<string>
  networkDisableTelnet: () => Promise<string>
  sfcScan: () => Promise<string>
  dismCheckHealth: () => Promise<string>
  dismScanHealth: () => Promise<string>
  dismRestoreHealth: () => Promise<string>
  checkDisk: () => Promise<string>
  windowsMemoryDiagnostic: () => Promise<string>
  directxDiagnostic: () => Promise<string>
  fixWindowsApps: () => Promise<string>
  fixBluetooth: () => Promise<string>
  fixAudio: () => Promise<string>
  troubleshootBluetooth: () => Promise<string>
  troubleshootCamera: () => Promise<string>
  troubleshootNetwork: () => Promise<string>
  troubleshootPrinter: () => Promise<string>
  troubleshootCompatibility: () => Promise<string>
  troubleshootVideoPlayback: () => Promise<string>
  troubleshootWindowsMediaPlayer: () => Promise<string>
  troubleshootWindowsUpdate: () => Promise<string>
  enableQuickRecovery: () => Promise<string>
  disableQuickRecovery: () => Promise<string>
  activateSelfHealing: () => Promise<string>
  generateSystemLogs: () => Promise<string>
  generateApplicationLogs: () => Promise<string>
  generateSecurityLogs: () => Promise<string>
  deleteRunHistory: () => Promise<string>
  deleteTempInternetFiles: () => Promise<string>
  cleanTempFolders: () => Promise<string>
  clearWindowsUpdateCache: () => Promise<string>
  clearThumbnailCache: () => Promise<string>
  clearMicrosoftStoreCache: () => Promise<string>
  clearOutlookCache: () => Promise<string>
  clearTeamsCache: () => Promise<string>
  clearRecycleBin: () => Promise<string>
  deleteOldWindows: () => Promise<string>
  defragmentDrive: () => Promise<string>
  wipeFreeSpace: () => Promise<string>
  manageDiskPartitions: () => Promise<string>
  deleteRecentItems: () => Promise<string>
  deleteAddressBarHistory: () => Promise<string>
  checkIobitInstalled: () => Promise<boolean>
  getFileLockingProcesses: (targetPath: string) => Promise<Array<{ pid: number; name: string; path: string }>>
  unlockFileNative: (targetPath: string, actionType: 'unlock' | 'delete' | 'rename' | 'move' | 'copy', actionArgs?: any) => Promise<{
    success: boolean
    killedPids: number[]
    killSummary: string
    actionSummary: string
  }>
  unlockFileIobit: (targetPath: string, actionType: 'unlock' | 'delete' | 'rename' | 'move' | 'copy', modifier: 'normal' | 'advanced', actionArgs?: any) => Promise<{
    success: boolean
    stdout: string
    stderr: string
    commandRun: string
    error?: string
  }>
  selectFileDialog: () => Promise<string | null>
  selectFolderDialog: () => Promise<string | null>
  scanBrowserExtensions: () => Promise<Array<{ id: string; name: string; description?: string; version: string; permissions: string[]; isSideloaded: boolean; browser: 'chrome' | 'edge' | 'firefox'; path?: string; iconUrl?: string }>>
  disableBrowserExtension: (id: string, browser: 'chrome' | 'edge' | 'firefox') => Promise<void>
  removeBrowserExtension: (id: string, browser: 'chrome' | 'edge' | 'firefox') => Promise<void>
  uninstallerScanExe: (exePath: string) => Promise<any>,
  uninstallerDelete: (filePaths: string[], registryPaths: string[]) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
