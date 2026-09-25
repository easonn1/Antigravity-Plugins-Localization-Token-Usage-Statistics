@echo off
chcp 65001 >nul
title Antigravity Easy Installer
cd /d "%~dp0"
python "%~dp0manager\install.py" %*
if %errorlevel% neq 0 py "%~dp0manager\install.py" %*
pause
