@echo off
chcp 65001 >nul
title Antigravity 插件管理中心
cd /d "%~dp0"
start "" pythonw "%~dp0manager\Antigravity-Plugin-Manager.py"
if %errorlevel% neq 0 start "" python "%~dp0manager\Antigravity-Plugin-Manager.py"
if %errorlevel% neq 0 start "" py "%~dp0manager\Antigravity-Plugin-Manager.py"
exit
