' Antigravity Plugin Guard v3.1 - silent background daemon, ASCII only, CRLF.
'
' v3.0 hard-coded `pythonw = "C:\Program Files\Python312\pythonw.exe"`, so on any
' machine that keeps Python elsewhere (3.13, per-user install, conda, or the
' no-Python setup.exe build) the daemon quietly never started and the localization
' was lost after the first Antigravity auto-update. This version probes the
' installed launcher and the common interpreter locations instead.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

profile = shell.ExpandEnvironmentStrings("%USERPROFILE%")
lapp = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
pf = shell.ExpandEnvironmentStrings("%PROGRAMFILES%")

guardScript = profile & "\.gemini\antigravity\manager\auto_patch_guard.py"

' candidate "exe|arguments" pairs, first hit wins
Dim list(7)
list(0) = lapp & "\AntigravityPlugins\bin\AntigravityPlugins.exe|--guard"
list(1) = pf & "\Python312\pythonw.exe|" & Chr(34) & guardScript & Chr(34)
list(2) = pf & "\Python313\pythonw.exe|" & Chr(34) & guardScript & Chr(34)
list(3) = pf & "\Python311\pythonw.exe|" & Chr(34) & guardScript & Chr(34)
list(4) = lapp & "\Programs\Python\Python312\pythonw.exe|" & Chr(34) & guardScript & Chr(34)
list(5) = lapp & "\Programs\Python\Python313\pythonw.exe|" & Chr(34) & guardScript & Chr(34)
list(6) = profile & "\anaconda3\pythonw.exe|" & Chr(34) & guardScript & Chr(34)
list(7) = profile & "\miniconda3\pythonw.exe|" & Chr(34) & guardScript & Chr(34)

For Each item In list
    parts = Split(item, "|")
    exe = parts(0)
    args = parts(1)
    If fso.FileExists(exe) Then
        If InStr(exe, "AntigravityPlugins.exe") > 0 Or fso.FileExists(guardScript) Then
            WScript.Sleep 15000
            shell.Run Chr(34) & exe & Chr(34) & " " & args, 0, False
            WScript.Quit 0
        End If
    End If
Next

' Nothing usable found: stay silent instead of failing on a hard-coded path.
