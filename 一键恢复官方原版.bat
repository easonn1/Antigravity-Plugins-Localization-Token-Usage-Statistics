@echo off
chcp 65001 >nul
title Antigravity 一键恢复官方原版
cd /d "%~dp0"
echo 正在还原官方原生环境...
python "%~dp0manager\uninstall.py" %*
if %errorlevel% neq 0 (
    echo.
    echo 正在尝试通过 py 命令执行...
    py "%~dp0manager\uninstall.py" %*
)
pause
