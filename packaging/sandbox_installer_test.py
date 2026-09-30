# -*- coding: utf-8 -*-
"""Sandbox test for the installer itself: silent install -> verify -> uninstall -> verify."""
import os
import shutil
import subprocess
import sys
import time
import winreg
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SB = REPO / ".sandbox"
HOME = SB / "home"
ROAM = HOME / "AppData" / "Roaming"
LOCAL = HOME / "AppData" / "Local"
AG = SB / "antigravity" / "resources"
BUNDLE = SB / "bundle"
TARGET = LOCAL / "AntigravityPlugins"
checks = []


def check(name, ok, detail=""):
    checks.append((name, bool(ok), detail))
    print("  [%s] %s%s" % ("PASS" if ok else "FAIL", name, ("  - " + str(detail)[:220]) if not ok else ""))


def main():
    if SB.exists():
        subprocess.run(["taskkill", "/F", "/IM", "AntigravityPlugins.exe"], capture_output=True)
        shutil.rmtree(str(SB), ignore_errors=True)
    for d in (ROAM / "Microsoft/Windows/Start Menu/Programs/Startup", LOCAL, AG):
        Path(d).mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(Path.home() / "AppData/Local/Programs/antigravity/resources/app.asar"),
                 str(AG / "app.asar"))
    # a fake "Setup build" extraction folder so the installer runs from source.
    # PyInstaller maps `--add-data dist/AntigravityPlugins;tree` to tree/AntigravityPlugins.exe
    shutil.copytree(str(REPO / "dist" / "AntigravityPlugins"), str(BUNDLE / "tree"))
    shutil.copytree(str(REPO / "stage" / "node"), str(BUNDLE / "runtime"))

    env = dict(os.environ)
    env.update({"USERPROFILE": str(HOME), "HOME": str(HOME), "APPDATA": str(ROAM),
                "LOCALAPPDATA": str(LOCAL), "ANTIGRAVITY_RESOURCES": str(AG),
                "PYTHONIOENCODING": "utf-8", "AG_SETUP_BUNDLE": str(BUNDLE)})

    print("=" * 70)
    print("A) silent install into %s" % TARGET)
    print("=" * 70)
    t0 = time.time()
    p = subprocess.run([sys.executable, "packaging/aginstaller.py", "--silent",
                        "--target", str(TARGET)], cwd=str(REPO), env=env,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       text=True, encoding="utf-8", errors="replace", timeout=900,
                       stdin=subprocess.DEVNULL)
    print("\n".join((p.stdout or "").splitlines()[-40:]))
    print("  [%.0fs] rc=%s" % (time.time() - t0, p.returncode))
    check("installer exit code 0", p.returncode == 0, p.returncode)
    check("no exception in installer log", "Traceback" not in (p.stdout or ""), (p.stdout or "")[-400:])

    exe = TARGET / "bin" / "AntigravityPlugins.exe"
    check("frozen exe installed", exe.exists(), exe)
    check("python runtime bundled", (TARGET / "bin" / "_internal" / "python312.dll").exists()
          or any((TARGET / "bin" / "_internal").glob("python*.dll")), "no python dll in _internal")
    check("node bundled (no system Node needed)", (TARGET / "runtime" / "node.exe").exists())
    check("node license shipped for redistribution", (TARGET / "runtime" / "LICENSE").exists())

    bats = sorted(TARGET.glob("*.bat"))
    check("bat entry points generated", len(bats) == 3, [b.name for b in bats])
    for b in bats:
        raw = b.read_bytes()
        check("%s ascii+crlf" % b.name, all(x < 128 for x in raw) and raw.count(b"\r\n") == raw.count(b"\n"),
              "non-ascii=%d crlf=%d lf=%d" % (sum(1 for x in raw if x > 127), raw.count(b"\r\n"), raw.count(b"\n")))

    menu = ROAM / "Microsoft/Windows/Start Menu/Programs/Antigravity 插件增强套件"
    lnks = sorted(menu.glob("*.lnk")) if menu.exists() else []
    check("start menu shortcuts", len(lnks) == 4, [l.name for l in lnks])
    desk = sorted((HOME / "Desktop").glob("*.lnk")) if (HOME / "Desktop").exists() else []
    check("desktop shortcuts", len(desk) == 2, [d.name for d in desk])

    vbs = ROAM / "Microsoft/Windows/Start Menu/Programs/Startup/AntigravityPluginGuard.vbs"
    check("autostart entry written", vbs.exists(), vbs)
    if vbs.exists():
        body = vbs.read_text(encoding="ascii", errors="replace")
        check("autostart is ascii + targets bundled exe",
              all(ord(c) < 128 for c in body) and "AntigravityPlugins.exe" in body and "Python312" not in body,
              body[:200])

    deployed = HOME / ".gemini" / "antigravity" / "plugins"
    check("deploy ran during install (3 plugins)", deployed.exists() and len(list(deployed.glob("0*.js"))) == 3)
    check("app.asar patched", (AG / "app.asar.bak").exists()
          and (AG / "app.asar").stat().st_size != (AG / "app.asar.bak").stat().st_size)

    try:
        k = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                           r"Software\Microsoft\Windows\CurrentVersion\Uninstall\AntigravityPlugins")
        name = winreg.QueryValueEx(k, "DisplayName")[0]
        uninst = winreg.QueryValueEx(k, "UninstallString")[0]
        winreg.CloseKey(k)
        check("uninstall registry entry", "Antigravity" in name and str(TARGET) in uninst.replace("/", "\\"), uninst)
    except OSError as e:
        check("uninstall registry entry", False, e)

    print("=" * 70)
    print("B) uninstall via the installed exe")
    print("=" * 70)
    pu = subprocess.run([str(exe), "--uninstall", "--silent"], cwd=str(TARGET.parent), env=env,
                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                        text=True, encoding="utf-8", errors="replace", timeout=600,
                        stdin=subprocess.DEVNULL)
    print("\n".join((pu.stdout or "").splitlines()[-20:]))
    check("uninstall exit code 0", pu.returncode == 0, pu.returncode)
    check("asar restored to official", (AG / "app.asar").read_bytes() == (AG / "app.asar.bak").read_bytes())
    check("autostart removed", not vbs.exists())
    check("shortcuts removed", not menu.exists() or not list(menu.glob("*.lnk")))
    time.sleep(14)   # the detached retry-delete loop needs the process to have exited
    check("install folder removed", not TARGET.exists(),
          [str(x.relative_to(TARGET)) for x in sorted(TARGET.rglob("*"))[:5]] if TARGET.exists() else "")
    try:
        winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                       r"Software\Microsoft\Windows\CurrentVersion\Uninstall\AntigravityPlugins").close()
        check("registry entry removed", False, "still present")
    except OSError:
        check("registry entry removed", True)

    passed = sum(1 for _n, ok, _d in checks if ok)
    print("=" * 70)
    print("result: %d/%d passed" % (passed, len(checks)))
    for n, ok, d in checks:
        if not ok:
            print("   FAILED %s :: %s" % (n, d))
    print("=" * 70)
    # never leave a test daemon running on someone's machine
    subprocess.run(["taskkill", "/F", "/IM", "AntigravityPlugins.exe", "/T"], capture_output=True)
    time.sleep(1)
    shutil.rmtree(str(SB), ignore_errors=True)
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
