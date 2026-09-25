@echo off
chcp 65001 >nul
title Antigravity 智能启动
cd /d "%~dp0"
start "" pythonw "%~dp0manager\Antigravity-Plugin-Manager.py" --launch
if %errorlevel% neq 0 start "" py "%~dp0manager\Antigravity-Plugin-Manager.py" --launch
exit
