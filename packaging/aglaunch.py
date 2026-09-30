# -*- coding: utf-8 -*-
"""
AntigravityPlugins.exe - single entry point for the no-dependency build.

Why one executable: the suite used to need Node.js *and* Python *and* a PATH that
happened to match the machine it was built on. This dispatcher freezes the Python
runtime, carries the suite sources as data, and calls the bundled portable node.exe,
so the end user installs one .exe and needs nothing else.

Modes
  --deploy / --restore / --gui / --guard / --collect   run the matching suite script
  <script.py> [args...] / --python <script.py> ...     generic passthrough; install.py
                                                       uses it to run collector.py
  --install                                           installer GUI (Setup build)
  --uninstall [--silent]                              undo everything this installed
  --resources <dir>                                   override the Antigravity folder
(no args)                                             same as --gui

The build is a *console* build on purpose: stdout has to stay usable when a parent
process captures collector.py's JSON. GUI/guard modes simply hide the console window
after start instead of shipping a second windowed runtime.
"""

import os
import runpy
import subprocess
import sys
from pathlib import Path

IS_FROZEN = bool(getattr(sys, "frozen", False))
APP_DIR = Path(sys.executable).resolve().parent if IS_FROZEN else Path(__file__).resolve().parent
INSTALL_DIR = APP_DIR.parent if IS_FROZEN else Path(__file__).resolve().parent.parent
BUNDLE = Path(getattr(sys, "_MEIPASS", str(APP_DIR)))
PAYLOAD = BUNDLE / "payload"
PRODUCT = "Antigravity 插件增强套件"
VERSION = "1.1.0"

SCRIPTS = {
    "deploy": ("manager", "install.py"),
    "restore": ("manager", "uninstall.py"),
    "gui": ("manager", "Antigravity-Plugin-Manager.py"),
    "guard": ("manager", "auto_patch_guard.py"),
    "collect": ("plugins", "collector.py"),
}


def log(msg):
    try:
        print(msg, flush=True)
    except Exception:
        pass


def hide_console():
    if os.name != "nt":
        return
    try:
        import ctypes
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 0)  # SW_HIDE
    except Exception:
        pass


def setup_env(resources=None):
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    os.environ["AG_FROZEN"] = "1" if IS_FROZEN else "0"
    os.environ["AG_INSTALL_DIR"] = str(INSTALL_DIR)
    for node in (INSTALL_DIR / "runtime" / "node.exe", BUNDLE / "node.exe"):
        if node.exists():
            os.environ["ANTIGRAVITY_NODE"] = str(node)
            log("[runtime] node.exe -> %s" % node)
            break
    else:
        log("[runtime] 本包未内置 node.exe，将退回系统 PATH 探测")
    if resources:
        os.environ["ANTIGRAVITY_RESOURCES"] = str(resources)


def script_path(mode):
    sub, name = SCRIPTS[mode]
    p = PAYLOAD / sub / name
    if p.exists():
        return p
    dev = Path(__file__).resolve().parent.parent / sub / name
    return dev if dev.exists() else p


def run_script(path, argv):
    path = Path(path)
    if not path.exists():
        log("[错误] 找不到脚本: %s" % path)
        return 3
    saved = sys.argv[:]
    sys.argv = [str(path)] + [str(a) for a in argv]
    try:
        runpy.run_path(str(path), run_name="__main__")
    except SystemExit as e:
        code = e.code
        return code if isinstance(code, int) else 0
    except BaseException:
        import traceback
        traceback.print_exc()
        try:
            input("\n按回车键退出...")
        except Exception:
            pass
        return 1
    finally:
        sys.argv = saved
    return 0


# --------------------------------------------------------------------- shortcuts
SHORTCUTS = [
    ("一键全量部署", "--deploy", "console"),
    ("插件管理中心", "--gui", "hidden"),
    ("智能启动与汉化", "--launch", "hidden"),
    ("恢复官方原版", "--restore", "console"),
]


def menu_dir():
    return Path(os.environ.get("APPDATA", str(Path.home()))) / "Microsoft" / "Windows" \
        / "Start Menu" / "Programs" / "Antigravity 插件增强套件"


def desktop_dir():
    d = Path(os.environ.get("USERPROFILE", str(Path.home()))) / "Desktop"
    if not d.exists():
        od = Path(os.environ.get("ONEDRIVE", "")) / "Desktop"
        if od.exists():
            d = od
    return d


def ps_run(script_text):
    tmp = Path(os.environ.get("TEMP", str(Path.home()))) / "agplugins_shell.ps1"
    # Windows PowerShell 5.1 decodes a BOM-less file with the ANSI codepage, which would
    # turn the Chinese shortcut names into mojibake paths and silently fail Save().
    tmp.write_bytes(b"\xef\xbb\xbf" + script_text.encode("utf-8"))
    r = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(tmp)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    try:
        tmp.unlink()
    except Exception:
        pass
    return r


def write_wrapper_vbs(app=None):
    """Hidden-window launcher for the GUI entries (a .lnk cannot hide a console)."""
    app = Path(app) if app else APP_DIR
    exe = str(app / "AntigravityPlugins.exe")
    body = (
        "' generated: start the plugin manager with no console window\r\n"
        "Set shell = CreateObject(\"WScript.Shell\")\r\n"
        "shell.Run Chr(34) + \"%s\" + Chr(34) + \" --gui\", 0, False\r\n" % exe
    )
    (app / "gui-hidden.vbs").write_bytes(body.encode("ascii"))
    body2 = body.replace("--gui", "--launch")
    (app / "launch-hidden.vbs").write_bytes(body2.encode("ascii"))


def make_shortcuts(create_desktop, target=None):
    tgt = Path(target) if target else INSTALL_DIR
    app = tgt / "bin"
    app.mkdir(parents=True, exist_ok=True)
    # WScript.Shell refuses to Save() into a folder that does not exist yet
    menu_dir().mkdir(parents=True, exist_ok=True)
    if create_desktop:
        desktop_dir().mkdir(parents=True, exist_ok=True)
    exe = str(app / "AntigravityPlugins.exe")
    write_wrapper_vbs(app)
    wscript = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "System32", "wscript.exe")
    targets = []
    for name, args, style in SHORTCUTS:
        if style == "hidden":
            # wscript + a generated .vbs is the only way to get a console-free GUI launch
            t = wscript
            a = str(app / ("gui-hidden.vbs" if args == "--gui" else "launch-hidden.vbs"))
        else:
            t, a = exe, args
        targets.append((menu_dir() / ("%s.lnk" % name), t, a))
        if create_desktop and style == "console":
            targets.append((desktop_dir() / ("%s.lnk" % name), t, a))
    lines = ["$ws = New-Object -ComObject WScript.Shell"]
    for path, t, a in targets:
        lines.append(
            '$s=$ws.CreateShortcut("{path}");$s.TargetPath="{t}";$s.Arguments="{a}";'
            '$s.WorkingDirectory="{wd}";$s.IconLocation="{exe},0";$s.Description="Antigravity Plugins Suite";'
            "$s.Save()".format(path=str(path), t=t, a=a, wd=str(app), exe=exe)
        )
    r = ps_run("\n".join(lines) + "\n")
    return r.returncode == 0, (r.stderr or "")[:300]


def remove_shortcuts():
    n = 0
    for folder in (menu_dir(), desktop_dir()):
        if not folder.exists():
            continue
        for name, _a, style in SHORTCUTS:
            if folder == desktop_dir() and style != "console":
                continue
            lnk = folder / ("%s.lnk" % name)
            if lnk.exists():
                try:
                    lnk.unlink()
                    n += 1
                except Exception:
                    pass
    return n


def dir_size_kb(path):
    total = 0
    for root, _dirs, files in os.walk(str(path)):
        for f in files:
            try:
                total += os.path.getsize(os.path.join(root, f))
            except Exception:
                pass
    return total // 1024


def registry_write(target=None):
    tgt = Path(target) if target else INSTALL_DIR
    app = tgt / "bin"
    try:
        import winreg
        k = winreg.CreateKey(winreg.HKEY_CURRENT_USER,
                             r"Software\Microsoft\Windows\CurrentVersion\Uninstall\AntigravityPlugins")
        exe = str(app / "AntigravityPlugins.exe")
        vals = [
            ("DisplayName", "REG_SZ", PRODUCT),
            ("DisplayVersion", "REG_SZ", VERSION),
            ("Publisher", "REG_SZ", "easonn1"),
            ("DisplayIcon", "REG_SZ", exe),
            ("InstallLocation", "REG_SZ", str(tgt)),
            ("UninstallString", "REG_SZ", '"%s" --uninstall' % exe),
            ("QuietUninstallString", "REG_SZ", '"%s" --uninstall --silent' % exe),
            ("NoModify", "REG_DWORD", 1),
            ("NoRepair", "REG_DWORD", 1),
            ("EstimatedSize", "REG_DWORD", dir_size_kb(tgt)),
        ]
        for name, kind, value in vals:
            winreg.SetValueEx(k, name, 0, getattr(winreg, kind), value)
        winreg.CloseKey(k)
        return True
    except Exception as e:
        log("[警告] 写入卸载注册项失败: %s" % e)
        return False


def registry_remove():
    try:
        import winreg
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER,
                         r"Software\Microsoft\Windows\CurrentVersion\Uninstall\AntigravityPlugins")
        return True
    except Exception:
        return False


def remove_autostart():
    startup = Path(os.environ.get("APPDATA", str(Path.home()))) / "Microsoft" / "Windows" \
        / "Start Menu" / "Programs" / "Startup" / "AntigravityPluginGuard.vbs"
    if startup.exists():
        try:
            startup.unlink()
            return True
        except Exception:
            return False
    return False


def ask(title, text):
    try:
        import tkinter
        from tkinter import messagebox
        root = tkinter.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        ans = messagebox.askyesno(title, text)
        root.destroy()
        return ans
    except Exception:
        return True


def do_uninstall(silent=False):
    log("=" * 62)
    log(" %s · 卸载" % PRODUCT)
    log("=" * 62)
    setup_env()
    restore = True if silent else ask(
        PRODUCT,
        "是否同时把 Antigravity 恢复为官方原版？\n\n"
        "是  - 还原 app.asar、清理插件目录与开机守护\n"
        "否  - 只删除本套件的安装目录和快捷方式（保留已注入的补丁）")
    rc = 0
    if restore:
        rc = run_script(script_path("restore"), [])
        log("[1/3] 恢复官方原版: %s" % ("完成" if rc == 0 else "返回码 %s" % rc))
    else:
        log("[1/3] 已跳过还原（Antigravity 保持当前已注入状态）")
    n = remove_shortcuts()
    reg = registry_remove()
    auto = remove_autostart()
    log("[2/3] 快捷方式删除 %d 个；卸载注册项 %s；开机守护 %s"
        % (n, "已移除" if reg else "无需处理", "已移除" if auto else "无需处理"))
    target = str(INSTALL_DIR)
    bat = Path(os.environ.get("TEMP", str(Path.home()))) / "agplugins_selfdelete.cmd"
    # The running exe locks its own image, so keep retrying until this process exits.
    # `timeout` cannot be used: this helper is spawned without a console, and timeout
    # errors out on redirected/absent input, which turned the retry loop into a spin.
    # no parenthesised blocks either - %var% inside a block expands once at parse time.
    bat.write_bytes(
        ("@echo off\r\n"
         "setlocal enabledelayedexpansion\r\n"
         "set /a tries=0\r\n"
         ":retry\r\n"
         "ping -n 2 127.0.0.1 >nul\r\n"
         'rd /s /q "%s" 2>nul\r\n'
         'if not exist "%s" goto done\r\n'
         "set /a tries+=1\r\n"
         "if !tries! lss 30 goto retry\r\n"
         ":done\r\n"
         'del /q "%%~f0"\r\n' % (target, target)).encode("ascii"))
    flags = 0x00000008 | 0x00000200 if os.name == "nt" else 0
    subprocess.Popen(["cmd", "/c", str(bat)], creationflags=flags, close_fds=True)
    log("[3/3] 本进程退出后会自动删除安装目录: %s" % target)
    if not silent:
        try:
            input("\n按回车键关闭窗口...")
        except Exception:
            pass
    return 0


def main():
    argv = sys.argv[1:]
    mode = argv[0] if argv else ""
    rest = argv[1:]
    resources = None
    if "--resources" in rest:
        i = rest.index("--resources")
        if i + 1 < len(rest):
            resources = rest[i + 1]
            rest = rest[:i] + rest[i + 2:]
    setup_env(resources)

    if mode in ("--uninstall", "-uninstall"):
        return do_uninstall(silent="--silent" in rest)
    if mode == "--install":
        import aginstaller          # bundled via --hidden-import / --paths packaging
        return aginstaller.gui_main()
    if mode in ("--help", "-?", "/?"):
        print(__doc__)
        return 0

    # generic passthrough so install.py can call [<this exe>, collector.py, --json]
    if mode == "--python":
        mode, rest = rest[0], rest[1:]
    if mode.lower().endswith(".py"):
        return run_script(Path(mode), rest)

    if mode in ("", "--gui", "--launch"):
        hide_console()
        if mode == "--launch":
            return run_script(script_path("gui"), ["--launch"])
        return run_script(script_path("gui"), [])
    if mode == "--guard":
        hide_console()
        return run_script(script_path("guard"), [])
    if mode == "--collect":
        return run_script(script_path("collect"), rest)
    if mode in ("--deploy", "--restore"):
        return run_script(script_path(mode.strip("-")), rest)

    log("[错误] 未知参数: %s" % mode)
    log(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
