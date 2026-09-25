' Antigravity Plugin Guard v3.0
' Silent background daemon, auto-restore plugins after updates

Set WshShell = CreateObject("WScript.Shell")
pythonw = "C:\Program Files\Python312\pythonw.exe"
guardScript = WshShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.gemini\antigravity\manager\auto_patch_guard.py"

' Delay 15s then launch persistent daemon (no window)
WScript.Sleep 15000
WshShell.Run """" & pythonw & """ """ & guardScript & """", 0, False
