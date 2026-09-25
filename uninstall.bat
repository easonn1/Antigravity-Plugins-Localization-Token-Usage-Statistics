@echo off
chcp 65001 >nul
title Antigravity Easy Uninstaller
cd /d "%~dp0"
python "%~dp0manager\uninstall.py" %*
if %errorlevel% neq 0 py "%~dp0manager\uninstall.py" %*
pause
