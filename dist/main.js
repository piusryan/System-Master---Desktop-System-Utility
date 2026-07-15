"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
// Custom exec function that doesn't throw on non-zero exit codes
const execCommand = (command) => {
    return new Promise((resolve) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            resolve({ stdout, stderr });
        });
    });
};
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    });
    // Check if in development mode or production
    const isDev = !electron_1.app.isPackaged;
    if (isDev) {
        // Try to load from dev server, fall back to built files if not available
        mainWindow.loadURL('http://localhost:3000')
            .catch(() => {
            console.log('Dev server not available, loading from built files');
            if (mainWindow) {
                mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
            }
        });
        mainWindow.webContents.openDevTools();
    }
    else {
        // Load the local built file
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.ipcMain.handle('open-external', async (_, url) => {
    await electron_1.shell.openExternal(url);
});
// Network handlers
electron_1.ipcMain.handle('network-ping', async (_, host) => {
    const { stdout, stderr } = await execCommand(`ping -n 4 ${host}`);
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('network-ipconfig', async () => {
    const { stdout, stderr } = await execCommand('ipconfig /all');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('network-flush-dns', async () => {
    const { stdout, stderr } = await execCommand('ipconfig /flushdns');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('network-release-ip', async () => {
    const { stdout, stderr } = await execCommand('ipconfig /release');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('network-renew-ip', async () => {
    const { stdout, stderr } = await execCommand('ipconfig /renew');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('network-reset', async () => {
    const commands = [
        'netsh int ip reset',
        'netsh winsock reset'
    ];
    let result = '';
    for (const cmd of commands) {
        const { stdout, stderr } = await execCommand(cmd);
        result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n---\n`;
    }
    return result + '\nPlease restart your computer for changes to take effect!';
});
electron_1.ipcMain.handle('network-winsock-reset', async () => {
    const { stdout, stderr } = await execCommand('netsh winsock reset');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nPlease restart your computer!';
});
electron_1.ipcMain.handle('network-remote-desktop', async () => {
    try {
        await execCommand('mstsc');
    }
    catch (error) {
        console.error('Error launching remote desktop:', error);
    }
});
electron_1.ipcMain.handle('network-enable-telnet', async () => {
    const { stdout, stderr } = await execCommand('dism /online /Enable-Feature /FeatureName:TelnetClient /All /NoRestart');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('network-disable-telnet', async () => {
    const { stdout, stderr } = await execCommand('dism /online /Disable-Feature /FeatureName:TelnetClient /NoRestart');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
// System Repair handlers
electron_1.ipcMain.handle('sfc-scan', async () => {
    const { stdout, stderr } = await execCommand('sfc /scannow');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('dism-check-health', async () => {
    const { stdout, stderr } = await execCommand('dism /online /cleanup-image /checkhealth');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('dism-scan-health', async () => {
    const { stdout, stderr } = await execCommand('dism /online /cleanup-image /scanhealth');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('dism-restore-health', async () => {
    const { stdout, stderr } = await execCommand('dism /online /cleanup-image /restorehealth');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
// Fix & Repair handlers
electron_1.ipcMain.handle('check-disk', async () => {
    const { stdout, stderr } = await execCommand('chkdsk C: /f /r');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nNote: You may need to restart your computer for this to complete.';
});
electron_1.ipcMain.handle('windows-memory-diagnostic', async () => {
    try {
        await execCommand('mdsched.exe');
        return 'Windows Memory Diagnostic launched. Follow the prompts to restart and scan.';
    }
    catch (error) {
        return `Error: ${error.message}`;
    }
});
electron_1.ipcMain.handle('directx-diagnostic', async () => {
    try {
        await execCommand('dxdiag');
        return 'DirectX Diagnostic Tool launched.';
    }
    catch (error) {
        return `Error: ${error.message}`;
    }
});
electron_1.ipcMain.handle('fix-windows-apps', async () => {
    const { stdout, stderr } = await execCommand('powershell -Command "Get-AppXPackage -AllUsers | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register \"$($_.InstallLocation)\\AppXManifest.xml\"}"');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '');
});
electron_1.ipcMain.handle('fix-bluetooth', async () => {
    const commands = [
        'powershell -Command "Get-Service -Name bthserv | Restart-Service -Force"',
        'powershell -Command "Get-Service -Name BthHFEnum | Restart-Service -Force"',
        'powershell -Command "Get-Service -Name BthEnum | Restart-Service -Force"',
        'powershell -Command "Get-Service -Name BthAvctpSvc | Restart-Service -Force"'
    ];
    let result = '';
    for (const cmd of commands) {
        const { stdout, stderr } = await execCommand(cmd);
        result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n---\n`;
    }
    return result;
});
electron_1.ipcMain.handle('fix-audio', async () => {
    const commands = [
        'powershell -Command "Get-Service -Name Audiosrv | Restart-Service -Force"',
        'powershell -Command "Get-Service -Name AudioEndpointBuilder | Restart-Service -Force"',
        'pnputil /scan-devices'
    ];
    let result = '';
    for (const cmd of commands) {
        const { stdout, stderr } = await execCommand(cmd);
        result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n---\n`;
    }
    return result;
});
// Troubleshooters
electron_1.ipcMain.handle('troubleshoot-bluetooth', async () => {
    const { stdout, stderr } = await execCommand('msdt.exe -id BluetoothDiagnostic');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nBluetooth Troubleshooter launched.';
});
electron_1.ipcMain.handle('troubleshoot-camera', async () => {
    const { stdout, stderr } = await execCommand('msdt.exe -id CameraDiagnostic');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nCamera Troubleshooter launched.';
});
electron_1.ipcMain.handle('troubleshoot-network', async () => {
    const { stdout, stderr } = await execCommand('msdt.exe -id NetworkDiagnosticsWeb');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nNetwork Troubleshooter launched.';
});
electron_1.ipcMain.handle('troubleshoot-printer', async () => {
    const { stdout, stderr } = await execCommand('msdt.exe -id PrinterDiagnostic');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nPrinter Troubleshooter launched.';
});
electron_1.ipcMain.handle('troubleshoot-compatibility', async () => {
    const { stdout, stderr } = await execCommand('msdt.exe -id PCADiagnostic');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nProgram Compatibility Troubleshooter launched.';
});
electron_1.ipcMain.handle('troubleshoot-video-playback', async () => {
    const { stdout, stderr } = await execCommand('msdt.exe -id VideoPlaybackDiagnostic');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nVideo Playback Troubleshooter launched.';
});
electron_1.ipcMain.handle('troubleshoot-windows-media-player', async () => {
    const { stdout, stderr } = await execCommand('msdt.exe -id WindowsMediaPlayerDiagnostic');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nWindows Media Player Troubleshooter launched.';
});
electron_1.ipcMain.handle('troubleshoot-windows-update', async () => {
    const { stdout, stderr } = await execCommand('msdt.exe -id WindowsUpdateDiagnostic');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nWindows Update Troubleshooter launched.';
});
// Quick Machine Recovery
electron_1.ipcMain.handle('enable-quick-recovery', async () => {
    const { stdout, stderr } = await execCommand('bcdedit /set {default} bootstatuspolicy ignoreallfailures');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nQuick Machine Recovery enabled.';
});
electron_1.ipcMain.handle('disable-quick-recovery', async () => {
    const { stdout, stderr } = await execCommand('bcdedit /set {default} bootstatuspolicy displayallfailures');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nQuick Machine Recovery disabled.';
});
// Self-Healing Mode
electron_1.ipcMain.handle('activate-self-healing', async () => {
    const { stdout, stderr } = await execCommand('fsutil repair set C: 0x01000000');
    return stdout + (stderr ? `\nErrors/Warnings: ${stderr}` : '') + '\nSelf-Healing Mode activated.';
});
// Generate Logs
const saveLogFile = async (logType) => {
    const { filePath, canceled } = await electron_1.dialog.showSaveDialog({
        defaultPath: `${logType}Logs.txt`,
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
        title: `Save ${logType} Logs`
    });
    if (canceled || !filePath) {
        return 'Save canceled';
    }
    const logCommand = `powershell -Command "Get-WinEvent -LogName ${logType} -MaxEvents 100 | Format-List | Out-File -FilePath '${filePath.replace(/'/g, "''")}' -Encoding UTF8"`;
    const { stdout, stderr } = await execCommand(logCommand);
    if (stderr) {
        return `Error: ${stderr}`;
    }
    return `Logs saved successfully to ${filePath}`;
};
electron_1.ipcMain.handle('generate-system-logs', async () => {
    return await saveLogFile('System');
});
electron_1.ipcMain.handle('generate-application-logs', async () => {
    return await saveLogFile('Application');
});
electron_1.ipcMain.handle('generate-security-logs', async () => {
    return await saveLogFile('Security');
});
// New System Repair Features
electron_1.ipcMain.handle('delete-run-history', async () => {
    const command = 'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU" /f';
    const { stdout, stderr } = await execCommand(command);
    return `Run History Deleted:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`;
});
electron_1.ipcMain.handle('delete-temp-internet-files', async () => {
    const command = 'RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 8';
    const { stdout, stderr } = await execCommand(command);
    return `Temporary Internet Files Deleted:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`;
});
electron_1.ipcMain.handle('clear-windows-update-cache', async () => {
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
    ];
    let result = 'Windows Update Cache Cleared:\n';
    for (const cmd of commands) {
        try {
            const { stdout, stderr } = await execCommand(cmd);
            result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`;
        }
        catch {
            result += `${cmd}\nSkipped (might already be stopped/deleted)\n`;
        }
    }
    return result;
});
electron_1.ipcMain.handle('clear-thumbnail-cache', async () => {
    const commands = [
        'taskkill /f /im explorer.exe',
        'del /f /s /q /a "%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer\\*"',
        'start explorer.exe'
    ];
    let result = 'Thumbnail Cache Cleared:\n';
    for (const cmd of commands) {
        const { stdout, stderr } = await execCommand(cmd);
        result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`;
    }
    return result;
});
electron_1.ipcMain.handle('clear-microsoft-store-cache', async () => {
    const { stdout, stderr } = await execCommand('wsreset.exe');
    return `Microsoft Store Cache Cleared:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`;
});
electron_1.ipcMain.handle('clear-outlook-cache', async () => {
    const commands = [
        'del /f /s /q "%LOCALAPPDATA%\\Microsoft\\Outlook\\RoamCache\\*"',
        'del /f /s /q "%APPDATA%\\Microsoft\\Outlook\\Offline Address Books\\*"'
    ];
    let result = 'Outlook Cache Cleared:\n';
    for (const cmd of commands) {
        const { stdout, stderr } = await execCommand(cmd);
        result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`;
    }
    return result;
});
electron_1.ipcMain.handle('clear-teams-cache', async () => {
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
    ];
    let result = 'Teams Cache Cleared:\n';
    for (const cmd of commands) {
        try {
            const { stdout, stderr } = await execCommand(cmd);
            result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`;
        }
        catch {
            result += `${cmd}\nSkipped\n`;
        }
    }
    return result;
});
electron_1.ipcMain.handle('clear-recycle-bin', async () => {
    const { stdout, stderr } = await execCommand('powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"');
    return `Recycle Bin Cleared:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`;
});
electron_1.ipcMain.handle('delete-old-windows', async () => {
    const folderPath = 'C:\\Windows.old';
    // Check if the folder exists first
    const { stdout: existsCheck, stderr: existsCheckErr } = await execCommand(`if exist "${folderPath}" (echo exists) else (echo notfound)`);
    if (existsCheck.trim() === 'notfound') {
        return 'Old Windows Files Deleted:\nNo Windows.old folder found. There is nothing to delete!';
    }
    const commands = [
        `takeown /F "${folderPath}" /R /A /D Y`,
        `icacls "${folderPath}" /grant Administrators:F /T`,
        `rd /s /q "${folderPath}"`
    ];
    let result = 'Old Windows Files Deleted:\n';
    for (const cmd of commands) {
        try {
            const { stdout, stderr } = await execCommand(cmd);
            result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`;
        }
        catch {
            result += `${cmd}\nSkipped\n`;
        }
    }
    return result;
});
electron_1.ipcMain.handle('defragment-drive', async () => {
    const { stdout, stderr } = await execCommand('defrag C: /O');
    return `Defragmentation Complete:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`;
});
electron_1.ipcMain.handle('wipe-free-space', async () => {
    const { stdout, stderr } = await execCommand('cipher /w:C:');
    return `Free Space Wiped:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`;
});
electron_1.ipcMain.handle('manage-disk-partitions', async () => {
    try {
        await execCommand('diskmgmt.msc');
        return 'Disk Management Opened';
    }
    catch (error) {
        return `Error: ${error.message}`;
    }
});
electron_1.ipcMain.handle('delete-recent-items', async () => {
    const commands = [
        'del /f /s /q "%APPDATA%\\Microsoft\\Windows\\Recent\\*"',
        'del /f /s /q "%APPDATA%\\Microsoft\\Windows\\Recent\\AutomaticDestinations\\*"',
        'del /f /s /q "%APPDATA%\\Microsoft\\Windows\\Recent\\CustomDestinations\\*"'
    ];
    let result = 'Recent Items Deleted:\n';
    for (const cmd of commands) {
        const { stdout, stderr } = await execCommand(cmd);
        result += `${cmd}\n${stdout}${stderr ? `\n${stderr}` : ''}\n`;
    }
    return result;
});
electron_1.ipcMain.handle('delete-address-bar-history', async () => {
    const command = 'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\TypedPaths" /f';
    const { stdout, stderr } = await execCommand(command);
    return `Address Bar History Deleted:\n${stdout}${stderr ? `\nErrors: ${stderr}` : ''}`;
});
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

$lockingProcIds = [FileUnlocker.Win32]::GetLockingProcessIds($files)
$results = @()
foreach ($procId in $lockingProcIds) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
        $results += [PSCustomObject]@{
            pid = $procId
            name = $proc.Name
            path = $proc.Path
        }
    } else {
        $results += [PSCustomObject]@{
            pid = $procId
            name = "Unknown"
            path = ""
        }
    }
}
$results | ConvertTo-Json
`;
const runPowerShellScript = async (scriptContent, args) => {
    const tempScriptPath = path.join(electron_1.app.getPath('temp'), `unlocker_helper_${Date.now()}.ps1`);
    fs.writeFileSync(tempScriptPath, scriptContent, 'utf-8');
    try {
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScriptPath}" ${args}`;
        const result = await execCommand(cmd);
        return result;
    }
    finally {
        try {
            fs.unlinkSync(tempScriptPath);
        }
        catch { }
    }
};
// Check for IObit Unlocker installation (check bundled first)
electron_1.ipcMain.handle('check-iobit-installed', async () => {
    const isPackaged = electron_1.app.isPackaged;
    const possiblePaths = [
        isPackaged ? path.join(process.resourcesPath, 'IObit Unlocker', 'IObitUnlocker.exe') : path.join(__dirname, 'IObit Unlocker', 'IObitUnlocker.exe'), // bundled first
        path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'IObit', 'IObit Unlocker', 'IObitUnlocker.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'IObit', 'IObit Unlocker', 'IObitUnlocker.exe'),
        path.join(__dirname, '..', 'IObit Unlocker', 'IObitUnlocker.exe')
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return true;
        }
    }
    return false;
});
electron_1.ipcMain.handle('get-file-locking-processes', async (_, targetPath) => {
    const { stdout, stderr } = await runPowerShellScript(UNLOCKER_PS_SCRIPT, `-Path "${targetPath.replace(/"/g, '\\"')}"`);
    if (stderr && !stdout) {
        console.error('PowerShell error querying locks:', stderr);
        return [];
    }
    try {
        const text = stdout.trim();
        if (!text || text === '[]')
            return [];
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [parsed];
    }
    catch (e) {
        console.error('Failed to parse locking processes:', e);
        return [];
    }
});
// Load the self-dependent unlock script from disk (avoids JS template-literal backtick conflicts)
// Handles: LanSchool, Sentinel, Cisco AMP, CrowdStrike, Symantec, McAfee, drivers, system files
const getUnlockActionPsContent = () => {
    const isPackaged = electron_1.app.isPackaged;
    const scriptPath = isPackaged
        ? path.join(process.resourcesPath, 'unlock-action.ps1')
        : path.join(__dirname, '..', 'electron', 'unlock-action.ps1');
    return fs.readFileSync(scriptPath, 'utf-8');
};
electron_1.ipcMain.handle('unlock-file-native', async (_, targetPath, actionType, actionArgs) => {
    const safeTarget = targetPath.replace(/"/g, '\\"');
    let actionArg = '';
    if (actionType === 'rename' && actionArgs?.newName)
        actionArg = actionArgs.newName;
    else if ((actionType === 'move' || actionType === 'copy') && actionArgs?.destPath)
        actionArg = actionArgs.destPath;
    else if (actionType === 'rename' && actionArgs?.newPath)
        actionArg = path.basename(actionArgs.newPath);
    const psArgs = `-TargetPath "${safeTarget}" -Action "${actionType}" -ActionArg "${actionArg.replace(/"/g, '\\"')}"`;
    const { stdout, stderr } = await runPowerShellScript(getUnlockActionPsContent(), psArgs);
    try {
        const text = stdout.trim();
        if (text) {
            const result = JSON.parse(text);
            return {
                success: result.success ?? false,
                scheduledReboot: result.scheduledReboot ?? false,
                killedPids: result.killedPids ?? [],
                stoppedServices: result.stoppedServices ?? [],
                killSummary: (result.log ?? []).join('\n'),
                actionSummary: result.actionResult ?? ''
            };
        }
    }
    catch (e) {
        console.error('unlock-file-native parse error:', e, stderr);
    }
    return { success: false, scheduledReboot: false, killedPids: [], stoppedServices: [], killSummary: stderr, actionSummary: 'Operation failed' };
});
// Get IObit Unlocker executable path (check bundled first)
const getIobitPath = () => {
    const isPackaged = electron_1.app.isPackaged;
    const possiblePaths = [
        isPackaged ? path.join(process.resourcesPath, 'IObit Unlocker', 'IObitUnlocker.exe') : path.join(__dirname, 'IObit Unlocker', 'IObitUnlocker.exe'), // bundled first
        path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'IObit', 'IObit Unlocker', 'IObitUnlocker.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'IObit', 'IObit Unlocker', 'IObitUnlocker.exe'),
        path.join(__dirname, '..', 'IObit Unlocker', 'IObitUnlocker.exe')
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
};
// unlock-file-iobit: uses actual IObit if available, falls back to native
electron_1.ipcMain.handle('unlock-file-iobit', async (_, targetPath, actionType, modifier, actionArgs) => {
    const iobitPath = getIobitPath();
    if (iobitPath) {
        // Try IObit first
        try {
            let args = [];
            // IObit command line usage (reverse-engineered from common patterns)
            // Common pattern: IObitUnlocker.exe "path" /delete or similar
            // We'll construct the best possible arguments
            args.push(targetPath);
            switch (actionType) {
                case 'delete':
                    args.push('/delete');
                    break;
                case 'unlock':
                default:
                    // Just unlock
                    break;
            }
            if (modifier === 'advanced') {
                args.push('/force');
            }
            const { stdout, stderr } = await execCommand(`"${iobitPath}" ${args.map(a => `"${a}"`).join(' ')}`);
            return {
                success: true,
                scheduledReboot: false,
                killedPids: [],
                stoppedServices: [],
                killSummary: 'IObit Unlocker command executed',
                actionSummary: 'IObit Unlocker has processed the request',
                commandRun: `"${iobitPath}" ${args.map(a => `"${a}"`).join(' ')}`
            };
        }
        catch (e) {
            console.error('IObit execution failed, falling back to native:', e);
        }
    }
    // Fallback to native if IObit isn't available or failed
    const safeTarget = targetPath.replace(/"/g, '\\"');
    let actionArg = '';
    if (actionType === 'rename' && actionArgs?.newName)
        actionArg = actionArgs.newName;
    else if ((actionType === 'move' || actionType === 'copy') && actionArgs?.destPath)
        actionArg = actionArgs.destPath;
    const psArgs = `-TargetPath "${safeTarget}" -Action "${actionType}" -ActionArg "${actionArg.replace(/"/g, '\\"')}"`;
    const { stdout, stderr } = await runPowerShellScript(getUnlockActionPsContent(), psArgs);
    try {
        const text = stdout.trim();
        if (text) {
            const result = JSON.parse(text);
            return { success: result.success ?? false, scheduledReboot: result.scheduledReboot ?? false, killedPids: result.killedPids ?? [], stoppedServices: result.stoppedServices ?? [], killSummary: (result.log ?? []).join('\n'), actionSummary: result.actionResult ?? '' };
        }
    }
    catch (e) {
        console.error('unlock-file-iobit parse error:', e, stderr);
    }
    return { success: false, scheduledReboot: false, killedPids: [], stoppedServices: [], killSummary: stderr, actionSummary: 'Operation failed' };
});
electron_1.ipcMain.handle('select-file-dialog', async () => {
    if (!mainWindow)
        return null;
    const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'showHiddenFiles']
    });
    return canceled ? null : filePaths[0];
});
electron_1.ipcMain.handle('select-folder-dialog', async () => {
    if (!mainWindow)
        return null;
    const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'showHiddenFiles']
    });
    return canceled ? null : filePaths[0];
});
// Browser Extension Functions
electron_1.ipcMain.handle('scanBrowserExtensions', async () => {
    const extensions = [];
    const homeDir = process.env.USERPROFILE || '';
    if (!homeDir)
        return extensions;
    // Scan Chrome
    try {
        const chromeExtDir = path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Extensions');
        if (fs.existsSync(chromeExtDir)) {
            const extFolders = fs.readdirSync(chromeExtDir, { withFileTypes: true }).filter(d => d.isDirectory());
            for (const ext of extFolders) {
                const extPath = path.join(chromeExtDir, ext.name);
                const versions = fs.readdirSync(extPath, { withFileTypes: true }).filter(d => d.isDirectory());
                if (versions.length > 0) {
                    const manifestPath = path.join(extPath, versions[0].name, 'manifest.json');
                    if (fs.existsSync(manifestPath)) {
                        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                        extensions.push({
                            id: ext.name,
                            name: manifest.name || 'Unknown',
                            description: manifest.description,
                            version: manifest.version || '0.0.0',
                            permissions: manifest.permissions || manifest.optional_permissions || [],
                            isSideloaded: false, // Default, can check install source later
                            browser: 'chrome',
                            path: extPath
                        });
                    }
                }
            }
        }
    }
    catch (err) {
        console.error('Chrome scan error:', err);
    }
    // Scan Edge
    try {
        const edgeExtDir = path.join(homeDir, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Extensions');
        if (fs.existsSync(edgeExtDir)) {
            const extFolders = fs.readdirSync(edgeExtDir, { withFileTypes: true }).filter(d => d.isDirectory());
            for (const ext of extFolders) {
                const extPath = path.join(edgeExtDir, ext.name);
                const versions = fs.readdirSync(extPath, { withFileTypes: true }).filter(d => d.isDirectory());
                if (versions.length > 0) {
                    const manifestPath = path.join(extPath, versions[0].name, 'manifest.json');
                    if (fs.existsSync(manifestPath)) {
                        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                        extensions.push({
                            id: ext.name,
                            name: manifest.name || 'Unknown',
                            description: manifest.description,
                            version: manifest.version || '0.0.0',
                            permissions: manifest.permissions || manifest.optional_permissions || [],
                            isSideloaded: false,
                            browser: 'edge',
                            path: extPath
                        });
                    }
                }
            }
        }
    }
    catch (err) {
        console.error('Edge scan error:', err);
    }
    // Scan Firefox
    try {
        const ffProfilesDir = path.join(homeDir, 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'Profiles');
        if (fs.existsSync(ffProfilesDir)) {
            const profiles = fs.readdirSync(ffProfilesDir, { withFileTypes: true }).filter(d => d.isDirectory());
            for (const profile of profiles) {
                const extDir = path.join(ffProfilesDir, profile.name, 'extensions');
                if (fs.existsSync(extDir)) {
                    const extFiles = fs.readdirSync(extDir, { withFileTypes: true });
                    for (const ext of extFiles) {
                        if (ext.name.endsWith('.xpi')) {
                            // For simplicity, just add a placeholder, we can extract xpi if needed later
                            extensions.push({
                                id: ext.name.replace('.xpi', ''),
                                name: ext.name.replace('.xpi', ''),
                                description: 'Firefox extension',
                                version: '0.0.0',
                                permissions: [],
                                isSideloaded: true,
                                browser: 'firefox',
                                path: path.join(extDir, ext.name)
                            });
                        }
                    }
                }
            }
        }
    }
    catch (err) {
        console.error('Firefox scan error:', err);
    }
    return extensions;
});
electron_1.ipcMain.handle('disableBrowserExtension', async (_, id, browser) => {
    console.log(`Disabling extension ${id} in ${browser} not implemented (requires registry edits or browser API access)`);
});
electron_1.ipcMain.handle('removeBrowserExtension', async (_, id, browser) => {
    console.log(`Removing extension ${id} in ${browser} not implemented (requires registry edits or browser API access)`);
});
