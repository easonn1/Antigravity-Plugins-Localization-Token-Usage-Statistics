@echo off
chcp 65001 >nul
title Antigravity 一键恢复官方原版
echo ========================================================
echo   正在恢复官方原版 app.asar 并清除自定义补丁...
echo ========================================================
node "%~dp0manager\patch_engine.js" restore
if %errorlevel% neq 0 (
  if exist "%USERPROFILE%\.gemini\antigravity\manager\patch_engine.js" (
    node "%USERPROFILE%\.gemini\antigravity\manager\patch_engine.js" restore
  )
)
echo.
echo ========================================================
echo   已成功恢复官方原版！您可以随时重新打开软件。
echo ========================================================
pause
