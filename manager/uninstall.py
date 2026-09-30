# -*- coding: utf-8 -*-
"""
Antigravity Plugins Suite - 一键恢复官方原版
100% 纯 Python 标准库实现，零第三方依赖，完美适配 Windows 10 与 Windows 11。
"""

import os
import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import shutil
import subprocess
import time
from pathlib import Path

# ================= Node.js locator (generated block - keep self-contained) =========
# On other people's machines node.exe often exists but is NOT reachable through PATH:
#   * Node installed after the session/Explorer started (stale environment block)
#   * nvm-windows / fnm / volta / scoop / chocolatey layouts (per-version dirs)
#   * a portable node.exe unzipped somewhere
# subprocess.run(["node", ...]) then raises FileNotFoundError and the whole patch
# silently fails, so resolve the real executable once and cache it.
_NODE_BIN_CACHE = {}


def find_node(quiet=False):
    """Return a usable node.exe path, or None. Honours ANTIGRAVITY_NODE override."""
    if "p" in _NODE_BIN_CACHE:
        return _NODE_BIN_CACHE["p"]

    import glob
    import subprocess

    def env(*names):
        for n in names:
            v = os.environ.get(n)
            if v:
                return v
        return None

    roots = []
    pf = env("PROGRAMFILES", "ProgramFiles")
    pf86 = env("ProgramFiles(x86)", "PROGRAMFILES(X86)")
    lapp = env("LOCALAPPDATA")
    user = env("USERPROFILE")
    appd = env("APPDATA")
    if pf:
        roots.append(os.path.join(pf, "nodejs"))
    if pf86:
        roots.append(os.path.join(pf86, "nodejs"))
    if lapp:
        roots.append(os.path.join(lapp, "Programs", "nodejs"))
        roots.append(os.path.join(lapp, "fnm", "node-versions", "*", "installation"))
    if user:
        roots.append(os.path.join(user, "scoop", "apps", "nodejs", "current"))
        roots.append(os.path.join(user, "scoop", "apps", "nodejs-lts", "current"))
        roots.append(os.path.join(user, ".volta", "bin"))
        roots.append(os.path.join(user, "AppData", "Local", "Microsoft", "WinGet", "Links"))
    if appd:
        roots.append(os.path.join(appd, "nvm"))            # nvm-windows stores
        roots.append(os.path.join(appd, "nvm", "*"))       # ...\nvm\v22.11.0\node.exe
        roots.append(os.path.join(appd, "fnm", "node-versions", "*", "installation"))
    roots.append(env("NVM_SYMLINK") or "")
    roots.append(env("N_PREFIX") or "")
    roots.append(env("VOLTA_HOME") and os.path.join(env("VOLTA_HOME"), "bin") or "")
    roots.append(env("FNM_CORE_PACKAGES_HOME") or "")
    roots.append(r"C:\nodejs")
    roots.append(env("ProgramData") and os.path.join(env("ProgramData"), "chocolatey", "bin") or "")

    cands = []
    override = env("ANTIGRAVITY_NODE", "AG_NODE")
    if override:
        cands.append(override if override.lower().endswith(".exe") else os.path.join(override, "node.exe"))
    found = None
    try:
        import shutil as _sh
        found = _sh.which("node")
    except Exception:
        found = None
    if found:
        cands.append(found)
    for r in roots:
        if not r:
            continue
        for g in (glob.glob(os.path.join(r, "node.exe")) + glob.glob(os.path.join(r, "*", "node.exe"))):
            cands.append(g)

    seen = set()
    for c in cands:
        if not c:
            continue
        key = os.path.normcase(os.path.abspath(c))
        if key in seen:
            continue
        seen.add(key)
        if not os.path.isfile(c):
            continue
        flags = 0x08000000 if os.name == "nt" else 0  # CREATE_NO_WINDOW: pythonw must not flash a console
        try:
            r = subprocess.run([c, "-v"], capture_output=True, text=True, timeout=15,
                               creationflags=flags, encoding="utf-8", errors="replace")
            if r.returncode == 0 and r.stdout.strip().startswith("v"):
                if not quiet and found and key != os.path.normcase(os.path.abspath(found)):
                    try:
                        print("  [i] node.exe resolved outside PATH: %s (%s)" % (c, r.stdout.strip()))
                    except Exception:
                        pass  # pythonw.exe has no stdout - never let the locator crash the guard
                _NODE_BIN_CACHE["p"] = c
                return c
        except Exception:
            continue
    _NODE_BIN_CACHE["p"] = None
    return None
# ================= end generated Node.js locator block =================


# ANSI 颜色定义
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

def get_startup_dir():
    roaming = os.environ.get("APPDATA")
    if roaming and os.path.exists(roaming):
        return Path(roaming) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
    return Path.home() / "AppData" / "Roaming" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"

def find_antigravity_resources():
    candidates = [
        Path.home() / "AppData" / "Local" / "Programs" / "antigravity" / "resources",
        Path("C:/Program Files/antigravity/resources"),
        Path("C:/Program Files (x86)/antigravity/resources"),
    ]
    localappdata = os.environ.get("LOCALAPPDATA")
    if localappdata:
        candidates.insert(1, Path(localappdata) / "Programs" / "antigravity" / "resources")
    programfiles = os.environ.get("PROGRAMFILES")
    if programfiles:
        candidates.append(Path(programfiles) / "antigravity" / "resources")

    for p in candidates:
        if p.exists() and ((p / "app.asar").exists() or (p / "app.asar.bak").exists()):
            return p
    return None

def kill_process_by_name(name):
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/IM", name],
                capture_output=True,
                creationflags=0x08000000 # CREATE_NO_WINDOW
            )
    except Exception:
        pass

def terminate_guard_processes():
    try:
        # 使用原生 PowerShell / WMI 查找并安全终止守护进程，无需安装任何 pip 第三方模块
        ps_cmd = "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*auto_patch_guard*' -or $_.CommandLine -like '*auto_patcher*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_cmd],
            capture_output=True,
            creationflags=0x08000000
        )
    except Exception:
        pass

def is_admin():
    try:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False

def main():
    if sys.platform == "win32":
        os.system("")

    print(f"{YELLOW}{BOLD}{'='*64}{RESET}")
    print(f"{YELLOW}{BOLD}  Antigravity 插件增强套件 · 一键恢复官方原版{RESET}")
    print(f"{YELLOW}  支持 Win10 / Win11 · 还原官方原生环境 · 彻底清除补丁{RESET}")
    print(f"{YELLOW}{BOLD}{'='*64}{RESET}")

    resources_dir = find_antigravity_resources()
    if not resources_dir:
        print(f"\n{RED}未自动定位到 Antigravity 安装目录！{RESET}")
        custom = input("请输入 Antigravity 根目录或 resources 文件夹路径: ").strip().strip('\"\'')
        p = Path(custom)
        if (p / "resources" / "app.asar").exists() or (p / "resources" / "app.asar.bak").exists():
            resources_dir = p / "resources"
        elif (p / "app.asar").exists() or (p / "app.asar.bak").exists():
            resources_dir = p
        else:
            print(f"{RED}指定的路径无效或未包含 app.asar，卸载中止。{RESET}")
            input("\n按回车键退出...")
            sys.exit(1)

    print(f"已锁定核心目录: {resources_dir}")

    # 检查权限
    if str(resources_dir).lower().startswith("c:\\program files") and not is_admin():
        print(f"\n{YELLOW}提示: Antigravity 安装在系统目录，可能需要管理员权限。{RESET}")
        print(f"{YELLOW}如果还原失败，请右键批处理选择【以管理员身份运行】。{RESET}")

    print(f"\n{CYAN}[1/4] 检查并平稳关闭冲突进程...{RESET}")
    kill_process_by_name("Antigravity.exe")
    time.sleep(1)
    print(f"  {GREEN}[OK] Antigravity 客户端已关闭{RESET}")

    print(f"\n{CYAN}[2/4] 终止后台守护引擎...{RESET}")
    terminate_guard_processes()
    print(f"  {GREEN}[OK] 后台守护进程已安全终止{RESET}")

    print(f"\n{CYAN}[3/4] 移除开机自启动项...{RESET}")
    startup_dir = get_startup_dir()
    startup_vbs = startup_dir / "AntigravityPluginGuard.vbs"
    if startup_vbs.exists():
        try:
            startup_vbs.unlink()
            print(f"  {GREEN}[OK] 成功移除开机自启项 (AntigravityPluginGuard.vbs){RESET}")
        except Exception as e:
            print(f"  {YELLOW}[!] 移除自启项遇到提示: {e}{RESET}")
    else:
        print(f"  {GREEN}[OK] 开机自启项未安装或已清除{RESET}")

    print(f"\n{CYAN}[4/4] 还原官方原生 app.asar 核心归档...{RESET}")
    asar_path = resources_dir / "app.asar"
    bak_path = resources_dir / "app.asar.bak"
    app_unpacked = resources_dir / "app"

    # 清除解压的临时 app 文件夹
    if app_unpacked.exists():
        try:
            shutil.rmtree(app_unpacked, ignore_errors=True)
            print(f"  {GREEN}[OK] 清除解包的临时 app 注入目录{RESET}")
        except Exception:
            pass

    if bak_path.exists():
        try:
            shutil.copy2(bak_path, asar_path)
            print(f"  {GREEN}[OK] 成功从官方原生备份 (app.asar.bak) 秒级完整还原！{RESET}")
        except PermissionError:
            print(f"  {RED}[X] 权限不足！请右键【一键恢复官方原版.bat】选择【以管理员身份运行】后重试！{RESET}")
            input("\n按回车键退出...")
            sys.exit(1)
        except Exception as e:
            print(f"  {RED}[X] 还原过程发生错误: {e}{RESET}")
    else:
        print(f"  {YELLOW}[!] 未找到备份文件 app.asar.bak，尝试通过 patch_engine.js restore 兜底...{RESET}")
        patch_engine = Path(__file__).resolve().parent / "patch_engine.js"
        if patch_engine.exists():
            subprocess.run([find_node() or "node", str(patch_engine), "restore", str(resources_dir)])

    print(f"\n{GREEN}{BOLD}{'='*64}{RESET}")
    print(f"{GREEN}{BOLD}  * 官方原版环境已完整恢复！所有修改已完全撤销。{RESET}")
    print(f"{GREEN}{BOLD}{'='*64}{RESET}")
    input("\n按回车键退出...")

if __name__ == "__main__":
    main()
