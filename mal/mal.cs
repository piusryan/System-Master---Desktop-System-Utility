// mal.cs — UnlockerTestDummy
// PURPOSE : Safe stubborn-process test target for the File Unlocker feature.
// BEHAVIOR: Moves itself to %ProgramData%\UnlockerTestDummy\mal.exe,
//           holds hard file locks (FileShare.None), sets DENY-DELETE ACLs,
//           adds itself to the Run registry key, and loops forever.
// REMOVAL : Use your project's File Unlocker on C:\ProgramData\UnlockerTestDummy
// ─────────────────────────────────────────────────────────────────────────────
using System;
using System.IO;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using Microsoft.Win32;
using System.Threading;

class Program
{
    // MoveFileEx — used to schedule original file deletion on reboot (fallback)
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool MoveFileEx(string src, string dst, int flags);
    const int MOVEFILE_DELAY_UNTIL_REBOOT = 4;

    static void Main(string[] args)
    {
        string installDir  = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
            "UnlockerTestDummy");
        string installExe  = Path.Combine(installDir, "calc.exe");
        string lockFile1   = Path.Combine(installDir, "locked_testfile.dat");
        string lockFile2   = Path.Combine(installDir, "locked_testfile2.dat");
        string currentExe  = Process.GetCurrentProcess().MainModule.FileName;
        bool   alreadyHere = string.Equals(currentExe, installExe,
                                           StringComparison.OrdinalIgnoreCase);

        // ── Step 1: Move self to install dir then vanish ──────────────────
        if (!alreadyHere)
        {
            // Create install directory
            if (!Directory.Exists(installDir))
                Directory.CreateDirectory(installDir);

            // Copy binary to install location
            File.Copy(currentExe, installExe, overwrite: true);

            // Launch the installed copy (hidden / minimised window)
            Process.Start(new ProcessStartInfo(installExe)
            {
                WindowStyle    = ProcessWindowStyle.Minimized,
                UseShellExecute = true
            });

            // Self-delete: cmd deletes original ~1s after we exit
            Process.Start(new ProcessStartInfo("cmd.exe",
                $"/c ping 127.0.0.1 -n 2 >nul & del /f /q \"{currentExe}\"")
            {
                WindowStyle    = ProcessWindowStyle.Hidden,
                CreateNoWindow = true,
                UseShellExecute = false
            });

            Environment.Exit(0);   // original instance disappears
        }

        // ── Step 2: Create locked dummy files ─────────────────────────────
        foreach (var f in new[] { lockFile1, lockFile2 })
            if (!File.Exists(f))
                File.WriteAllText(f,
                    "UnlockerTestDummy locked file — remove via File Unlocker\r\n");

        // ── Step 3: Deny-delete ACL on folder + exe ───────────────────────
        TryDenyDelete(installDir, isDir: true);
        TryDenyDelete(installExe, isDir: false);

        // ── Step 4: Add to HKLM Run key (persistence visible in Task Mgr) ─
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", writable: true);
            key?.SetValue("UnlockerTestDummy", $"\"{installExe}\"");
        }
        catch { /* needs admin — skip if not elevated */ }

        // ── Step 5: Hold file locks with FileShare.None ───────────────────
        FileStream fs1 = null, fs2 = null;
        try
        {
            fs1 = new FileStream(lockFile1, FileMode.OpenOrCreate,
                                 FileAccess.ReadWrite, FileShare.None);
            fs2 = new FileStream(lockFile2, FileMode.OpenOrCreate,
                                 FileAccess.ReadWrite, FileShare.None);

            Console.Title            = "mal  [UnlockerTestDummy — Test Process]";
            Console.ForegroundColor  = ConsoleColor.Green;
            Console.WriteLine();
            Console.WriteLine("  ╔══════════════════════════════════════════════╗");
            Console.WriteLine("  ║   UnlockerTestDummy  —  ACTIVE TEST PROCESS  ║");
            Console.WriteLine("  ╠══════════════════════════════════════════════╣");
            Console.WriteLine($"  ║  Location : {installDir,-33}║");
            Console.WriteLine($"  ║  Lock 1   : locked_testfile.dat             ║");
            Console.WriteLine($"  ║  Lock 2   : locked_testfile2.dat            ║");
            Console.WriteLine("  ╠══════════════════════════════════════════════╣");
            Console.WriteLine("  ║  HOW TO REMOVE:                              ║");
            Console.WriteLine("  ║  Use File Unlocker on the install folder.    ║");
            Console.WriteLine("  ╚══════════════════════════════════════════════╝");
            Console.ResetColor();
            Console.WriteLine();
            Console.WriteLine("  Holding locks... (cannot be deleted normally)");

            // Loop forever — killed only by process termination (your unlocker)
            while (true) Thread.Sleep(5000);
        }
        finally
        {
            fs1?.Dispose();
            fs2?.Dispose();

            // Cleanup registry key when process is finally killed
            try
            {
                using var key = Registry.LocalMachine.OpenSubKey(
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", writable: true);
                key?.DeleteValue("UnlockerTestDummy", throwOnMissingValue: false);
            }
            catch { }
        }
    }

    static void TryDenyDelete(string path, bool isDir)
    {
        try
        {
            var everyone = new SecurityIdentifier(WellKnownSidType.WorldSid, null);
            if (isDir)
            {
                var acl = Directory.GetAccessControl(path);
                acl.AddAccessRule(new FileSystemAccessRule(
                    everyone,
                    FileSystemRights.Delete | FileSystemRights.DeleteSubdirectoriesAndFiles,
                    InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit,
                    PropagationFlags.None,
                    AccessControlType.Deny));
                Directory.SetAccessControl(path, acl);
            }
            else
            {
                var acl = File.GetAccessControl(path);
                acl.AddAccessRule(new FileSystemAccessRule(
                    everyone,
                    FileSystemRights.Delete,
                    AccessControlType.Deny));
                File.SetAccessControl(path, acl);
            }
        }
        catch { /* skip if not elevated */ }
    }
}