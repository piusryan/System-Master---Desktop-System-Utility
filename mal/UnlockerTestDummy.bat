@echo off
:: ============================================================
::  UnlockerTestDummy.bat
::  PURPOSE : Safe test target for the File Unlocker feature.
::  BEHAVIOR: Copies itself to a test folder, holds a hard file
::            lock open (via PowerShell C# FileStream), and keeps
::            a visible process in Task Manager under the name
::            "UnlockerTestDummy".
::  REMOVAL : Use your project's File Unlocker to kill and delete.
::  AUTHOR  : System Master - Research Project Test Tool
:: ============================================================

title UnlockerTestDummy [TEST PROCESS - Safe to Remove via Unlocker]
color 0A

:: ── Step 1: Self-copy to test install location ──────────────
set "INSTALL_DIR=%ProgramData%\UnlockerTestDummy"
set "INSTALL_EXE=%INSTALL_DIR%\UnlockerTestDummy.bat"
set "LOCK_FILE=%INSTALL_DIR%\locked_testfile.dat"
set "LOCK_FILE2=%INSTALL_DIR%\locked_testfile2.dat"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" 2>nul

:: Copy self to install dir if not already running from there
if /I not "%~f0"=="%INSTALL_EXE%" (
    copy /Y "%~f0" "%INSTALL_EXE%" >nul 2>&1
    echo [UnlockerTestDummy] Installed to: %INSTALL_DIR%
    echo [UnlockerTestDummy] Starting from install location...
    start "" /MIN "%INSTALL_EXE%"
    exit /b
)

:: ── Step 2: Create locked dummy files ───────────────────────
echo [UnlockerTestDummy] Creating locked test files...
echo This file is intentionally locked for unlocker testing. > "%LOCK_FILE%"
echo This file is intentionally locked for unlocker testing. > "%LOCK_FILE2%"

:: ── Step 3: Set deny-delete ACL on install folder ───────────
icacls "%INSTALL_DIR%" /deny Everyone:(D,DC) /T /C /Q >nul 2>&1
icacls "%INSTALL_EXE%"  /deny Everyone:(D,DC)      /Q >nul 2>&1

:: ── Step 4: Register as a fake service name (no real install)
::    Just sets a Run key so Task Manager shows the name clearly
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "UnlockerTestDummy" /t REG_SZ /d "\"%INSTALL_EXE%\"" /f >nul 2>&1

echo.
echo  ============================================================
echo   UnlockerTestDummy - ACTIVE TEST PROCESS
echo  ============================================================
echo   Install Path : %INSTALL_DIR%
echo   Locked Files : %LOCK_FILE%
echo               : %LOCK_FILE2%
echo   Process Name : UnlockerTestDummy (cmd.exe hosting this bat)
echo.
echo   HOW TO REMOVE:
echo   Use your project's File Unlocker on:
echo   %INSTALL_DIR%
echo   It will: stop the process, release locks, delete folder.
echo  ============================================================
echo.

:: ── Step 5: Hold hard file locks via PowerShell FileStream ──
::    This runs a PS snippet that opens both files with FileShare.None
::    so no other process can read/write/delete them.
::    Runs forever in the background of this same window.
echo [UnlockerTestDummy] Locking files with FileStream (FileShare.None)...

powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
"$ErrorActionPreference='SilentlyContinue';" ^
"$f1 = [System.IO.File]::Open('%LOCK_FILE%',  [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None);" ^
"$f2 = [System.IO.File]::Open('%LOCK_FILE2%', [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None);" ^
"Write-Host '[UnlockerTestDummy] Files locked. Running... (Ctrl+C or use Unlocker to stop)';" ^
"try { while($true){ Start-Sleep -Seconds 5 } } finally { $f1.Close(); $f2.Close() }"

:: If PowerShell exits (killed by unlocker), clean up registry key
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "UnlockerTestDummy" /f >nul 2>&1
echo [UnlockerTestDummy] Process ended. Registry key cleaned.
exit /b
