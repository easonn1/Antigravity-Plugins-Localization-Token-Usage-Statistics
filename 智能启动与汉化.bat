@echo off
chcp 65001 >nul
title Antigravity 智能启动与汉化
start "" pythonw "%~dp0Antigravity-Plugin-Manager.py" --launch
exit
