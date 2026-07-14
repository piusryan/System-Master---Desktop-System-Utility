@echo off
:: build.bat — Compiles mal.cs into mal.exe using the built-in Windows CSC compiler
title Building mal.exe...
color 0E

echo.
echo  [BUILD] Finding C# compiler (csc.exe)...

:: Try .NET Framework 4.x (64-bit first, then 32-bit)
set "CSC="
if exist "%windir%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC=%windir%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
    goto :found
)
if exist "%windir%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC=%windir%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
    goto :found
)

echo  [ERROR] csc.exe not found. Requires .NET Framework 4.x.
pause & exit /b 1

:found
echo  [BUILD] Using: %CSC%
echo  [BUILD] Compiling mal.cs -> mal.exe ...
echo.

"%CSC%" ^
  /out:"%~dp0mal.exe" ^
  /target:exe ^
  /platform:x64 ^
  /optimize+ ^
  /reference:System.dll ^
  /reference:System.Core.dll ^
  /reference:Microsoft.Win32.Registry.dll ^
  "%~dp0mal.cs"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Compilation failed. See errors above.
    pause & exit /b 1
)

echo.
echo  [SUCCESS] mal.exe built successfully!
echo  [INFO]    Location: %~dp0mal.exe
echo  [INFO]    Double-click mal.exe to run the test dummy.
echo  [INFO]    Use your File Unlocker on:
echo            C:\ProgramData\UnlockerTestDummy
echo.
pause
