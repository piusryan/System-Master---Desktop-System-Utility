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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
