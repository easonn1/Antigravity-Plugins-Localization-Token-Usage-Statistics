@echo off
chcp 65001 >nul
title Antigravity 一键安全内存注入
cd /d "%~dp0"
echo =======================================================
echo   正在通过 Chrome DevTools 安全通道注入汉化与 Token 插件...
echo   (100%% 内存无损注入，零修改软件文件，零风险)
echo =======================================================
python "%~dp0Antigravity-Plugin-Manager.py" --inject
echo.
pause
exit
