@echo off
chcp 65001 >nul
title Antigravity 内存级注入
cd /d "%~dp0"
echo 正在通过 Chrome DevTools 协议安全注入...
python "%~dp0manager\Antigravity-Plugin-Manager.py" --inject
if %errorlevel% neq 0 py "%~dp0manager\Antigravity-Plugin-Manager.py" --inject
pause
