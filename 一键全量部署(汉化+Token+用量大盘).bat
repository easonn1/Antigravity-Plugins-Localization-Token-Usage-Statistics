@echo off
chcp 65001 >nul
title Antigravity 一键全量部署
cd /d "%~dp0"
echo 正在启动全量自动化部署引擎...
python "%~dp0manager\install.py" %*
if %errorlevel% neq 0 (
    echo.
    echo 正在尝试通过 py 命令执行...
    py "%~dp0manager\install.py" %*
)
pause
