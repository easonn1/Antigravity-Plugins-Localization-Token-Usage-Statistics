@echo off
rem ==================================================================
rem  Antigravity Plugins Suite launcher  (generated - keep this ASCII!)
rem  No non-ASCII byte may be added to this file: cmd.exe desyncs its own
rem  read offset when chcp switches the codepage mid-batch.  Every
rem  human-readable Chinese message is printed by Python instead.
rem ==================================================================
setlocal enableextensions
chcp 65001 >nul 2>nul
set "PYTHONIOENCODING=utf-8"
title Antigravity Plugins Suite

rem --- Guard 1: cannot enter our own folder -> archive was not extracted
cd /d "%~dp0" 2>nul
if errorlevel 1 (
    echo [ERROR] Cannot enter the folder of this script.
    echo         Extract the whole archive first, then run it again.
    pause
    exit /b 1
)

rem --- Guard 2: double-clicking inside the WinRAR / 7-Zip preview window
rem             copies only the .bat, so the manager\ payload is missing.
if not exist "%~dp0manager\Antigravity-Plugin-Manager.py" (
    echo [ERROR] %~dp0manager\Antigravity-Plugin-Manager.py was not found next to this script.
    echo         You are probably running it from the archive preview window.
    echo         Extract all files into a normal folder, then run it again.
    pause
    exit /b 1
)

set "PYRUN="
call :DETECT_PY
if defined PYRUN goto :RUN

echo ==================================================================
echo  [ERROR] No usable Python 3.8+ could be found.
echo.
echo  Download :  https://www.python.org/downloads/
echo  IMPORTANT: tick "Add python.exe to PATH" on the first installer
echo             page, then double-click this file again.
echo ==================================================================
start "" https://www.python.org/downloads/
pause
exit /b 1

:RUN
start "" %PYRUN% "%~dp0manager\Antigravity-Plugin-Manager.py" %*
if errorlevel 1 (
    echo [ERROR] Could not start the plugin manager.
    pause
)
endlocal
exit /b 0

rem ================= helpers (generated, do not edit by hand) =================
:DETECT_PY
rem 1) py launcher: written to C:\Windows by the Python setup, needs no PATH
py -3 -c "import sys" >nul 2>nul
if not errorlevel 1 ( set "PYRUN=py -3" & exit /b 0 )
rem 2) python on PATH (the Microsoft Store stub exits non-zero, so it is skipped)
python -c "import sys" >nul 2>nul
if not errorlevel 1 ( set "PYRUN=python" & exit /b 0 )
rem 3) per-user installs: %LOCALAPPDATA%\Programs\Python\Python3xx
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\*") do (
    if not defined PYRUN if exist "%%~fD\python.exe" set PYRUN="%%~fD\python.exe"
)
if defined PYRUN exit /b 0
rem 4) per-machine installs: %ProgramFiles%\Python3xx and C:\Python3xx
for /d %%D in ("%ProgramFiles%\Python3*" "C:\Python3*") do (
    if not defined PYRUN if exist "%%~fD\python.exe" set PYRUN="%%~fD\python.exe"
)
if defined PYRUN exit /b 0
rem 5) conda / miniconda roots
for /d %%D in ("%USERPROFILE%\anaconda3" "%USERPROFILE%\miniconda3" "C:\ProgramData\anaconda3") do (
    if not defined PYRUN if exist "%%~fD\python.exe" set PYRUN="%%~fD\python.exe"
)
exit /b 0
