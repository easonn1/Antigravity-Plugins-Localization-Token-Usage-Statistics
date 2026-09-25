@echo off
chcp 65001 >nul
title Antigravity 插件管理中心
start "" pythonw "%~dp0Antigravity-Plugin-Manager.py"
if %errorlevel% neq 0 start "" py "%~dp0Antigravity-Plugin-Manager.py"
exit
