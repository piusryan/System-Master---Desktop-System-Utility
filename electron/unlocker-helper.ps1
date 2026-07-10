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
