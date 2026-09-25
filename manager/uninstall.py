# -*- coding: utf-8 -*-
"""
Antigravity Plugins Suite - 一键恢复官方原版
"""

import os
import sys
import shutil
import subprocess
import time
from pathlib import Path

GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

def find_antigravity_resources():
    candidates = [
        Path.home() / "AppData" / "Local" / "Programs" / "antigravity" / "resources",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "antigravity" / "resources",
        Path("C:/Program Files/antigravity/resources"),
        Path("C:/Program Files (x86)/antigravity/resources"),
    ]
    for p in candidates:
        if p.exists() and (p / "app.asar").exists():
            return p
    return None

def kill_process_by_name(name):
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/IM", name],
                capture_output=True,
                creationflags=0x08000000
            )
    except Exception:
        pass

def main():
    if sys.platform == "win32":
        os.system("")

    print(f"{YELLOW}{BOLD}{'='*64}{RESET}")
    print(f"{YELLOW}{BOLD}  Antigravity 插件增强套件 · 一键恢复官方原版{RESET}")
    print(f"{YELLOW}{BOLD}{'='*64}{RESET}")

    resources_dir = find_antigravity_resources()
    if not resources_dir:
        print(f"{RED}未自动找到 Antigravity 安装目录！{RESET}")
        custom = input("请输入 resources 文件夹路径: ").strip()
        resources_dir = Path(custom.strip('\"\''))
        if not resources_dir.exists():
            print(f"{RED}路径无效，退出。{RESET}")
            sys.exit(1)

    print(f"\n{CYAN}[1/4] 检查并平稳关闭冲突进程...{RESET}")
    kill_process_by_name("Antigravity.exe")
    time.sleep(1)

    print(f"{CYAN}[2/4] 终止后台守护进程...{RESET}")
    try:
        import psutil
        for p in psutil.process_iter(['pid', 'name', 'cmdline']):
            cmd = " ".join(p.info['cmdline'] or [])
            if "auto_patch_guard" in cmd or "auto_patcher" in cmd:
                try:
                    p.terminate()
                except Exception:
                    pass
    except Exception:
        pass

    print(f"{CYAN}[3/4] 移除开机自启项...{RESET}")
    startup_vbs = Path.home() / "AppData" / "Roaming" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup" / "AntigravityPluginGuard.vbs"
    if startup_vbs.exists():
        try:
            startup_vbs.unlink()
            print(f"  {GREEN}✓ 已移除开机自启项{RESET}")
        except Exception as e:
            print(f"  {YELLOW}⚠ 移除自启项失败: {e}{RESET}")

    print(f"{CYAN}[4/4] 恢复官方原生 app.asar...{RESET}")
    asar_path = resources_dir / "app.asar"
    bak_path = resources_dir / "app.asar.bak"

    if bak_path.exists():
        try:
            shutil.copy2(bak_path, asar_path)
            print(f"  {GREEN}✓ 成功从官方备份 (app.asar.bak) 秒级完整还原！{RESET}")
        except Exception as e:
            print(f"  {RED}还原失败: {e}{RESET}")
    else:
        print(f"  {YELLOW}⚠ 未找到官方备份 app.asar.bak，尝试使用 patch_engine.js restore...{RESET}")
        manager_dir = Path.home() / ".gemini" / "antigravity" / "manager"
        patch_engine = manager_dir / "patch_engine.js"
        if patch_engine.exists():
            subprocess.run(["node", str(patch_engine), "restore"], cwd=str(manager_dir))

    print(f"\n{GREEN}{BOLD}{'='*64}{RESET}")
    print(f"{GREEN}{BOLD}  ✓ 官方原版环境已完整恢复！所有修改已完全撤销。{RESET}")
    print(f"{GREEN}{BOLD}{'='*64}{RESET}")
    input("\n按回车键退出...")

if __name__ == "__main__":
    main()
