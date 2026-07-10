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
        mainWindow.loadURL('http://localhost:3000');
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
