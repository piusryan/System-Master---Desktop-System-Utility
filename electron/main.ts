import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'

// Custom exec function that doesn't throw on non-zero exit codes
const execCommand = (command: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({ stdout, stderr })
    })
  })
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: true,
    transparent: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  // Check if in development mode or production
  const isDev = !app.isPackaged

  if (isDev) {
    // Try to load from dev server, fall back to built files if not available
    mainWindow.loadURL('http://localhost:3000')
      .catch(() => {
        console.log('Dev server not available, loading from built files')
        if (mainWindow) {
          mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
        }
      })
    mainWindow.webContents.openDevTools()
  } else {
    // Load the local built file
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.handle('open-external', async (_, url: string) => {
  await shell.openExternal(url)
})

// Network handlers
ipcMain.handle('network-ping', async (_, host: string) => {
  const { stdout, stderr } = await execCommand(`ping -n 4 ${host}`)
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('network-ipconfig', async () => {
  const { stdout, stderr } = await execCommand('ipconfig /all')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('network-flush-dns', async () => {
  const { stdout, stderr } = await execCommand('ipconfig /flushdns')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('network-release-ip', async () => {
  const { stdout, stderr } = await execCommand('ipconfig /release')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('network-renew-ip', async () => {
  const { stdout, stderr } = await execCommand('ipconfig /renew')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('network-reset', async () => {
  const commands = [
    'netsh int ip reset',
    'netsh winsock reset'
  ]
  let result = ''
  for (const cmd of commands) {
    const { stdout, stderr } = await execCommand(cmd)
    result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n---\n`
  }
  return result + '\nPlease restart your computer for changes to take effect!'
})

ipcMain.handle('network-winsock-reset', async () => {
  const { stdout, stderr } = await execCommand('netsh winsock reset')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nPlease restart your computer!'
})

ipcMain.handle('network-remote-desktop', async () => {
  try {
    await execCommand('mstsc')
  } catch (error: any) {
    console.error('Error launching remote desktop:', error)
  }
})

ipcMain.handle('network-enable-telnet', async () => {
  const { stdout, stderr } = await execCommand('dism /online /Enable-Feature /FeatureName:TelnetClient /All /NoRestart')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('network-disable-telnet', async () => {
  const { stdout, stderr } = await execCommand('dism /online /Disable-Feature /FeatureName:TelnetClient /NoRestart')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

// System Repair handlers
ipcMain.handle('sfc-scan', async () => {
  const { stdout, stderr } = await execCommand('sfc /scannow')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('dism-check-health', async () => {
  const { stdout, stderr } = await execCommand('dism /online /cleanup-image /checkhealth')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('dism-scan-health', async () => {
  const { stdout, stderr } = await execCommand('dism /online /cleanup-image /scanhealth')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('dism-restore-health', async () => {
  const { stdout, stderr } = await execCommand('dism /online /cleanup-image /restorehealth')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

// Fix & Repair handlers
ipcMain.handle('check-disk', async () => {
  const { stdout, stderr } = await execCommand('chkdsk C: /f /r')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nNote: You may need to restart your computer for this to complete.'
})

ipcMain.handle('windows-memory-diagnostic', async () => {
  try {
    await execCommand('mdsched.exe')
    return 'Windows Memory Diagnostic launched. Follow the prompts to restart and scan.'
  } catch (error: any) {
    return `Error: ${error.message}`
  }
})

ipcMain.handle('directx-diagnostic', async () => {
  try {
    await execCommand('dxdiag')
    return 'DirectX Diagnostic Tool launched.'
  } catch (error: any) {
    return `Error: ${error.message}`
  }
})

ipcMain.handle('fix-windows-apps', async () => {
  const { stdout, stderr } = await execCommand('powershell -Command "Get-AppXPackage -AllUsers | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register \"$($_.InstallLocation)\\AppXManifest.xml\"}"')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '')
})

ipcMain.handle('fix-bluetooth', async () => {
  const commands = [
    'powershell -Command "Get-Service -Name bthserv | Restart-Service -Force"',
    'powershell -Command "Get-Service -Name BthHFEnum | Restart-Service -Force"',
    'powershell -Command "Get-Service -Name BthEnum | Restart-Service -Force"',
    'powershell -Command "Get-Service -Name BthAvctpSvc | Restart-Service -Force"'
  ]
  let result = ''
  for (const cmd of commands) {
    const { stdout, stderr } = await execCommand(cmd)
    result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n---\n`
  }
  return result
})

ipcMain.handle('fix-audio', async () => {
  const commands = [
    'powershell -Command "Get-Service -Name Audiosrv | Restart-Service -Force"',
    'powershell -Command "Get-Service -Name AudioEndpointBuilder | Restart-Service -Force"',
    'pnputil /scan-devices'
  ]
  let result = ''
  for (const cmd of commands) {
    const { stdout, stderr } = await execCommand(cmd)
    result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n---\n`
  }
  return result
})

// Troubleshooters
ipcMain.handle('troubleshoot-bluetooth', async () => {
  const { stdout, stderr } = await execCommand('msdt.exe -id BluetoothDiagnostic')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nBluetooth Troubleshooter launched.'
})

ipcMain.handle('troubleshoot-camera', async () => {
  const { stdout, stderr } = await execCommand('msdt.exe -id CameraDiagnostic')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nCamera Troubleshooter launched.'
})

ipcMain.handle('troubleshoot-network', async () => {
  const { stdout, stderr } = await execCommand('msdt.exe -id NetworkDiagnosticsWeb')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nNetwork Troubleshooter launched.'
})

ipcMain.handle('troubleshoot-printer', async () => {
  const { stdout, stderr } = await execCommand('msdt.exe -id PrinterDiagnostic')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nPrinter Troubleshooter launched.'
})

ipcMain.handle('troubleshoot-compatibility', async () => {
  const { stdout, stderr } = await execCommand('msdt.exe -id PCADiagnostic')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nProgram Compatibility Troubleshooter launched.'
})

ipcMain.handle('troubleshoot-video-playback', async () => {
  const { stdout, stderr } = await execCommand('msdt.exe -id VideoPlaybackDiagnostic')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nVideo Playback Troubleshooter launched.'
})

ipcMain.handle('troubleshoot-windows-media-player', async () => {
  const { stdout, stderr } = await execCommand('msdt.exe -id WindowsMediaPlayerDiagnostic')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nWindows Media Player Troubleshooter launched.'
})

ipcMain.handle('troubleshoot-windows-update', async () => {
  const { stdout, stderr } = await execCommand('msdt.exe -id WindowsUpdateDiagnostic')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nWindows Update Troubleshooter launched.'
})

// Quick Machine Recovery
ipcMain.handle('enable-quick-recovery', async () => {
  const { stdout, stderr } = await execCommand('bcdedit /set {default} bootstatuspolicy ignoreallfailures')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nQuick Machine Recovery enabled.'
})

ipcMain.handle('disable-quick-recovery', async () => {
  const { stdout, stderr } = await execCommand('bcdedit /set {default} bootstatuspolicy displayallfailures')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nQuick Machine Recovery disabled.'
})

// Self-Healing Mode
ipcMain.handle('activate-self-healing', async () => {
  const { stdout, stderr } = await execCommand('fsutil repair set C: 0x01000000')
  return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nSelf-Healing Mode activated.'
})

// Generate Logs
const saveLogFile = async (logType: 'System' | 'Application' | 'Security'): Promise<string> => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: `${logType}Logs.txt`,
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
    title: `Save ${logType} Logs`
  })
  if (canceled || !filePath) {
    return 'Save canceled'
  }
  
  const logCommand = `powershell -Command "Get-WinEvent -LogName ${logType} -MaxEvents 100 | Format-List | Out-File -FilePath '${filePath.replace(/'/g, "''")}' -Encoding UTF8"`
  const { stdout, stderr } = await execCommand(logCommand)
  if (stderr) {
    return `Error: ${stderr}`
  }
  return `Logs saved successfully to ${filePath}`
}

ipcMain.handle('generate-system-logs', async () => {
  return await saveLogFile('System')
})

ipcMain.handle('generate-application-logs', async () => {
  return await saveLogFile('Application')
})

ipcMain.handle('generate-security-logs', async () => {
  return await saveLogFile('Security')
})

// New System Repair Features
ipcMain.handle('delete-run-history', async () => {
  const command = 'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU" /f'
  const { stdout, stderr } = await execCommand(command)
  return `Run History Deleted:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`
})

ipcMain.handle('delete-temp-internet-files', async () => {
  const command = 'RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 8'
  const { stdout, stderr } = await execCommand(command)
  return `Temporary Internet Files Deleted:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`
})

ipcMain.handle('clear-windows-update-cache', async () => {
  const commands = [
    'net stop wuauserv',
    'net stop cryptSvc',
    'net stop bits',
    'net stop msiserver',
    'rd /s /q C:\\Windows\\SoftwareDistribution\\Download',
    'rd /s /q C:\\Windows\\SoftwareDistribution\\DataStore',
    'rd /s /q C:\\Windows\\System32\\catroot2',
    'net start wuauserv',
    'net start cryptSvc',
    'net start bits',
    'net start msiserver'
  ]
  let result = 'Windows Update Cache Cleared:\n'
  for (const cmd of commands) {
    try {
      const { stdout, stderr } = await execCommand(cmd)
      result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`
    } catch {
      result += `${cmd}\nSkipped (might already be stopped/deleted)\n`
    }
  }
  return result
})

ipcMain.handle('clear-thumbnail-cache', async () => {
  const commands = [
    'taskkill /f /im explorer.exe',
    'del /f /s /q /a "%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer\\*"',
    'start explorer.exe'
  ]
  let result = 'Thumbnail Cache Cleared:\n'
  for (const cmd of commands) {
    const { stdout, stderr } = await execCommand(cmd)
    result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`
  }
  return result
})

ipcMain.handle('clear-microsoft-store-cache', async () => {
  const { stdout, stderr } = await execCommand('wsreset.exe')
  return `Microsoft Store Cache Cleared:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`
})

ipcMain.handle('clear-outlook-cache', async () => {
  const commands = [
    'del /f /s /q "%LOCALAPPDATA%\\Microsoft\\Outlook\\RoamCache\\*"',
    'del /f /s /q "%APPDATA%\\Microsoft\\Outlook\\Offline Address Books\\*"'
  ]
  let result = 'Outlook Cache Cleared:\n'
  for (const cmd of commands) {
    const { stdout, stderr } = await execCommand(cmd)
    result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`
  }
  return result
})

ipcMain.handle('clear-teams-cache', async () => {
  const commands = [
    'taskkill /f /im Teams.exe',
    'rd /s /q "%APPDATA%\\Microsoft\\Teams\\Cache"',
    'rd /s /q "%APPDATA%\\Microsoft\\Teams\\blob_storage"',
    'rd /s /q "%APPDATA%\\Microsoft\\Teams\\databases"',
    'rd /s /q "%APPDATA%\\Microsoft\\Teams\\GPUCache"',
    'rd /s /q "%APPDATA%\\Microsoft\\Teams\\IndexedDB"',
    'rd /s /q "%APPDATA%\\Microsoft\\Teams\\Local Storage"',
    'rd /s /q "%APPDATA%\\Microsoft\\Teams\\tmp"',
    'start Teams.exe'
  ]
  let result = 'Teams Cache Cleared:\n'
  for (const cmd of commands) {
    try {
      const { stdout, stderr } = await execCommand(cmd)
      result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`
    } catch {
      result += `${cmd}\nSkipped\n`
    }
  }
  return result
})

ipcMain.handle('clear-recycle-bin', async () => {
  const { stdout, stderr } = await execCommand('powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"')
  return `Recycle Bin Cleared:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`
})

ipcMain.handle('delete-old-windows', async () => {
  const folderPath = 'C:\\Windows.old'
  // Check if the folder exists first
  const { stdout: existsCheck, stderr: existsCheckErr } = await execCommand(`if exist "${folderPath}" (echo exists) else (echo notfound)`)
  
  if (existsCheck.trim() === 'notfound') {
    return 'Old Windows Files Deleted:\nNo Windows.old folder found. There is nothing to delete!'
  }

  const commands = [
    `takeown /F "${folderPath}" /R /A /D Y`,
    `icacls "${folderPath}" /grant Administrators:F /T`,
    `rd /s /q "${folderPath}"`
  ]
  let result = 'Old Windows Files Deleted:\n'
  for (const cmd of commands) {
    try {
      const { stdout, stderr } = await execCommand(cmd)
      result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`
    } catch {
      result += `${cmd}\nSkipped\n`
    }
  }
  return result
})

ipcMain.handle('defragment-drive', async () => {
  const { stdout, stderr } = await execCommand('defrag C: /O')
  return `Defragmentation Complete:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`
})

ipcMain.handle('wipe-free-space', async () => {
  const { stdout, stderr } = await execCommand('cipher /w:C:')
  return `Free Space Wiped:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`
})

ipcMain.handle('manage-disk-partitions', async () => {
  try {
    await execCommand('diskmgmt.msc')
    return 'Disk Management Opened'
  } catch (error: any) {
    return `Error: ${error.message}`
  }
})

ipcMain.handle('delete-recent-items', async () => {
  const commands = [
    'del /f /s /q "%APPDATA%\\Microsoft\\Windows\\Recent\\*"',
    'del /f /s /q "%APPDATA%\\Microsoft\\Windows\\Recent\\AutomaticDestinations\\*"',
    'del /f /s /q "%APPDATA%\\Microsoft\\Windows\\Recent\\CustomDestinations\\*"'
  ]
  let result = 'Recent Items Deleted:\n'
  for (const cmd of commands) {
    const { stdout, stderr } = await execCommand(cmd)
    result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`
  }
  return result
})

ipcMain.handle('delete-address-bar-history', async () => {
  const command = 'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\TypedPaths" /f'
  const { stdout, stderr } = await execCommand(command)
  return `Address Bar History Deleted:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`
})

// --- FILE UNLOCKER INTEGRATION ---

const UNLOCKER_PS_SCRIPT = `
param([string]$Path)

$csharp = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

namespace FileUnlocker {
    public class Win32 {
        [StructLayout(LayoutKind.Sequential)]
        public struct RM_UNIQUE_PROCESS {
            public int dwProcessId;
            public System.Runtime.InteropServices.ComTypes.FILETIME ProcessStartTime;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct RM_PROCESS_INFO {
            public RM_UNIQUE_PROCESS Process;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
            public string strAppName;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
            public string strServiceShortName;
            public int ApplicationType;
            public uint AppStatus;
            public uint TSSessionId;
            [MarshalAs(UnmanagedType.Bool)]
            public bool bRestartable;
        }

        [DllImport("rstrtmgr.dll", CharSet = CharSet.Auto)]
        public static extern int RmStartSession(out uint pSessionHandle, int dwSessionFlags, string strSessionKey);

        [DllImport("rstrtmgr.dll")]
        public static extern int RmEndSession(uint pSessionHandle);

        [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)]
        public static extern int RmRegisterResources(uint pSessionHandle, uint nFiles, string[] rgsFilenames,
            uint nApplications, RM_UNIQUE_PROCESS[] rgApplications, uint nServices, string[] rgsServiceNames);

        [DllImport("rstrtmgr.dll")]
        public static extern int RmGetList(uint dwSessionHandle, out uint pnProcInfoNeeded, ref uint pnProcInfo,
            [In, Out] RM_PROCESS_INFO[] rgAffectedApps, ref uint lpdwRebootReasons);

        public static int[] GetLockingProcessIds(string[] filePaths) {
            List<int> pids = new List<int>();
            uint handle;
            string key = Guid.NewGuid().ToString();
            int res = RmStartSession(out handle, 0, key);
            if (res != 0) return pids.ToArray();

            try {
                res = RmRegisterResources(handle, (uint)filePaths.Length, filePaths, 0, null, 0, null);
                if (res != 0) return pids.ToArray();

                uint pnProcInfoNeeded = 0;
                uint pnProcInfo = 0;
                uint rebootReasons = 0;

                res = RmGetList(handle, out pnProcInfoNeeded, ref pnProcInfo, null, ref rebootReasons);
                if (res == 234) { // ERROR_MORE_DATA
                    RM_PROCESS_INFO[] processInfo = new RM_PROCESS_INFO[pnProcInfoNeeded];
                    pnProcInfo = pnProcInfoNeeded;
                    res = RmGetList(handle, out pnProcInfoNeeded, ref pnProcInfo, processInfo, ref rebootReasons);
                    if (res == 0) {
                        for (int i = 0; i < pnProcInfo; i++) {
                            pids.Add(processInfo[i].Process.dwProcessId);
                        }
                    }
                }
            } finally {
                RmEndSession(handle);
            }
            return pids.ToArray();
        }
    }
}
'@

try {
    Add-Type -TypeDefinition $csharp -ReferencedAssemblies 'System.Runtime.InteropServices'
} catch {}

$files = @()
if (Test-Path $Path) {
    $item = Get-Item $Path
    if ($item.PSIsContainer) {
        $files = Get-ChildItem -Path $Path -File -Recurse | Select-Object -First 500 | ForEach-Object { $_.FullName }
    } else {
        $files = @($item.FullName)
    }
}

if ($files.Count -eq 0) {
    Write-Output "[]"
    exit
}

$pids = [FileUnlocker.Win32]::GetLockingProcessIds($files)
$results = @()
foreach ($pid in $pids) {
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        $results += [PSCustomObject]@{
            pid = $pid
            name = $proc.Name
            path = $proc.Path
        }
    } else {
        $results += [PSCustomObject]@{
            pid = $pid
            name = "Unknown"
            path = ""
        }
    }
}
$results | ConvertTo-Json
`

const runPowerShellScript = async (scriptContent: string, args: string): Promise<{ stdout: string; stderr: string }> => {
  const tempScriptPath = path.join(app.getPath('temp'), `unlocker_helper_${Date.now()}.ps1`)
  fs.writeFileSync(tempScriptPath, scriptContent, 'utf-8')
  try {
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScriptPath}" ${args}`
    const result = await execCommand(cmd)
    return result
  } finally {
    try {
      fs.unlinkSync(tempScriptPath)
    } catch {}
  }
}

ipcMain.handle('check-iobit-installed', async () => {
  const iobitPath = 'C:\\Program Files (x86)\\IObit\\IObit Unlocker\\IObitUnlocker.exe'
  return fs.existsSync(iobitPath)
})

ipcMain.handle('get-file-locking-processes', async (_, targetPath: string) => {
  const { stdout, stderr } = await runPowerShellScript(UNLOCKER_PS_SCRIPT, `-Path "${targetPath.replace(/"/g, '\\"')}"`)
  if (stderr && !stdout) {
    console.error('PowerShell error querying locks:', stderr)
    return []
  }
  try {
    const text = stdout.trim()
    if (!text || text === '[]') return []
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (e) {
    console.error('Failed to parse locking processes:', e)
    return []
  }
})

ipcMain.handle('unlock-file-native', async (_, targetPath: string, actionType: 'unlock' | 'delete' | 'rename' | 'move' | 'copy', actionArgs?: any) => {
  // First query locking processes
  const { stdout } = await runPowerShellScript(UNLOCKER_PS_SCRIPT, `-Path "${targetPath.replace(/"/g, '\\"')}"`)
  let pids: number[] = []
  try {
    const text = stdout.trim()
    if (text && text !== '[]') {
      const parsed = JSON.parse(text)
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      pids = arr.map((p: any) => p.pid).filter((pid: any) => typeof pid === 'number')
    }
  } catch {}

  // Kill the locking processes
  const killResults: string[] = []
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL')
      killResults.push(`Killed PID ${pid} natively`)
    } catch (err: any) {
      // Fallback to elevated taskkill if SIGKILL fails (e.g. process context issues)
      const { stderr } = await execCommand(`taskkill /f /pid ${pid}`)
      if (!stderr) {
        killResults.push(`Killed PID ${pid} via taskkill`)
      } else {
        killResults.push(`Failed to kill PID ${pid}: ${err.message || stderr}`)
      }
    }
  }

  // Execute requested file action
  let actionResult = ''
  try {
    if (actionType === 'delete') {
      if (fs.statSync(targetPath).isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true })
      } else {
        fs.unlinkSync(targetPath)
      }
      actionResult = 'File/Folder deleted successfully.'
    } else if (actionType === 'rename') {
      const newPath = actionArgs?.newPath
      if (!newPath) throw new Error('New path is required for rename.')
      fs.renameSync(targetPath, newPath)
      actionResult = `File/Folder renamed successfully to ${path.basename(newPath)}.`
    } else if (actionType === 'move') {
      const destPath = actionArgs?.destPath
      if (!destPath) throw new Error('Destination path is required for move.')
      fs.renameSync(targetPath, destPath)
      actionResult = `File/Folder moved successfully to ${destPath}.`
    } else if (actionType === 'copy') {
      const destPath = actionArgs?.destPath
      if (!destPath) throw new Error('Destination path is required for copy.')
      if (fs.statSync(targetPath).isDirectory()) {
        fs.cpSync(targetPath, destPath, { recursive: true })
      } else {
        fs.copyFileSync(targetPath, destPath)
      }
      actionResult = `File/Folder copied successfully to ${destPath}.`
    } else {
      actionResult = 'File/Folder unlocked successfully.'
    }
  } catch (err: any) {
    actionResult = `Action failed: ${err.message}`
  }

  return {
    success: !actionResult.startsWith('Action failed'),
    killedPids: pids,
    killSummary: killResults.join('\n'),
    actionSummary: actionResult
  }
})

ipcMain.handle('unlock-file-iobit', async (_, targetPath: string, actionType: 'unlock' | 'delete' | 'rename' | 'move' | 'copy', modifier: 'normal' | 'advanced', actionArgs?: any) => {
  const iobitPath = 'C:\\Program Files (x86)\\IObit\\IObit Unlocker\\IObitUnlocker.exe'
  if (!fs.existsSync(iobitPath)) {
    return { success: false, error: 'IObit Unlocker is not installed.' }
  }

  let cmdParam = '/None'
  if (actionType === 'delete') cmdParam = '/Delete'
  else if (actionType === 'rename') cmdParam = '/Rename'
  else if (actionType === 'move') cmdParam = '/Move'
  else if (actionType === 'copy') cmdParam = '/Copy'

  const optParam = modifier === 'advanced' ? '/Advanced' : '/Normal'

  let extraArgsStr = ''
  if (actionType === 'rename' && actionArgs?.newName) {
    extraArgsStr = ` "${actionArgs.newName}"`
  } else if ((actionType === 'move' || actionType === 'copy') && actionArgs?.destPath) {
    extraArgsStr = ` "${actionArgs.destPath}"`
  }

  const fullCmd = `"${iobitPath}" ${cmdParam} ${optParam} "${targetPath}"${extraArgsStr}`
  const { stdout, stderr } = await execCommand(fullCmd)

  // Auto-dismiss the popup dialog that IObit Unlocker shows on completion
  setTimeout(async () => {
    await execCommand('taskkill /f /im IObitUnlocker.exe')
  }, 2000)

  return {
    success: true,
    stdout,
    stderr,
    commandRun: fullCmd
  }
})

ipcMain.handle('select-file-dialog', async () => {
  if (!mainWindow) return null
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'showHiddenFiles']
  })
  return canceled ? null : filePaths[0]
})

ipcMain.handle('select-folder-dialog', async () => {
  if (!mainWindow) return null
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'showHiddenFiles']
  })
  return canceled ? null : filePaths[0]
})
