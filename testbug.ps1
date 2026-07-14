param([string]$TargetPath)

# Simplified script to test the bug
$nativeCsharp = @'
using System;
using System.Collections.Generic;
namespace NativeUnlocker {
    public class Api {
        public static int[] GetLockingPids(string[] paths) {
            var r = new List<int>(); // Oh wait does this affect anything?
            return r.ToArray();
        }
    }
}
'@
try { Add-Type -TypeDefinition $nativeCsharp -ErrorAction Stop } catch {}

Write-Host "Script executed successfully"
