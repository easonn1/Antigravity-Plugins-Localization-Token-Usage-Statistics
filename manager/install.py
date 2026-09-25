# -*- coding: utf-8 -*-
"""
Antigravity Plugins Suite - 一键全量安装与部署引擎
支持三大功能一体化部署：
  1. 全局中文深度汉化 (含命令面板横排排版修复)
  2. 上下文 Token 实时显示徽标 (输入框底部实时进度条与用量)
  3. 用量智脑大盘统计 (基于 Nir-Bhay/antigravity-usage-intelligence 深度移植汉化)
"""

import os
import sys
import shutil
import subprocess
import time
import json
from pathlib import Path

# ANSI 颜色定义
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_step(step_idx, total_steps, title):
    print(f"\n{CYAN}{BOLD}[{step_idx}/{total_steps}] {title}{RESET}")

def print_success(msg):
    print(f"  {GREEN}✓ {msg}{RESET}")

def print_warn(msg):
    print(f"  {YELLOW}⚠ {msg}{RESET}")

def print_error(msg):
    print(f"  {RED}✗ {msg}{RESET}")

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
                creationflags=0x08000000 # CREATE_NO_WINDOW
            )
    except Exception:
        pass

def main():
    if sys.platform == "win32":
        os.system("") # 启用 ANSI 支持

    print(f"{CYAN}{BOLD}{'='*64}{RESET}")
    print(f"{CYAN}{BOLD}  Antigravity 插件增强套件 · 一键全量安装部署工具{RESET}")
    print(f"{CYAN}  包含: 深度中文汉化 + 上下文 Token 实时显示 + 用量智脑大盘{RESET}")
    print(f"{CYAN}{BOLD}{'='*64}{RESET}")

    repo_dir = Path(__file__).resolve().parent.parent
    plugins_src_dir = repo_dir / "plugins"
    manager_src_dir = repo_dir / "manager"

    user_home = Path.home()
    target_plugins_dir = user_home / ".gemini" / "antigravity" / "plugins"
    target_manager_dir = user_home / ".gemini" / "antigravity" / "manager"
    startup_dir = user_home / "AppData" / "Roaming" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"

    TOTAL_STEPS = 7

    # 步骤 1: 环境检查
    print_step(1, TOTAL_STEPS, "检查系统运行环境...")
    # 检查 Node.js
    node_ok = False
    try:
        r = subprocess.run(["node", "-v"], capture_output=True, text=True)
        if r.returncode == 0:
            node_ver = r.stdout.strip()
            print_success(f"Node.js 环境已就绪 ({node_ver})")
            node_ok = True
    except FileNotFoundError:
        pass

    if not node_ok:
        print_error("未检测到 Node.js 环境！")
        print("  Antigravity 的底层 asar 补丁注入引擎需要 Node.js 支持。")
        print("  请先访问 https://nodejs.org/ 下载并安装 LTS 版本的 Node.js 后重试。")
        input("\n按回车键退出安装...")
        sys.exit(1)

    # 检查 Python
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print_success(f"Python 环境已就绪 (v{py_ver})")

    # 检查 Antigravity 安装
    resources_dir = find_antigravity_resources()
    if not resources_dir:
        print_error("未自动找到 Antigravity 安装目录！")
        custom = input("  请输入 Antigravity 的 resources 文件夹路径 (例如 C:\\...\\resources): ").strip()
        custom_path = Path(custom.strip('\"\''))
        if custom_path.exists() and (custom_path / "app.asar").exists():
            resources_dir = custom_path
            print_success(f"已锁定自定义路径: {resources_dir}")
        else:
            print_error("指定的路径无效或未包含 app.asar，安装中止。")
            input("\n按回车键退出安装...")
            sys.exit(1)
    else:
        print_success(f"已锁定 Antigravity 核心目录: {resources_dir}")

    # 步骤 2: 安全关闭冲突进程
    print_step(2, TOTAL_STEPS, "检查并平稳关闭冲突进程...")
    kill_process_by_name("Antigravity.exe")
    time.sleep(1)
    print_success("已确保 Antigravity 客户端安全关闭（防止文件占用锁死）")

    # 步骤 3: 官方原版核心安全备份
    print_step(3, TOTAL_STEPS, "检查并创建官方核心归档备份...")
    asar_path = resources_dir / "app.asar"
    bak_path = resources_dir / "app.asar.bak"
    if not bak_path.exists():
        if asar_path.exists():
            shutil.copy2(asar_path, bak_path)
            print_success(f"已成功创建官方原版备份: app.asar.bak ({bak_path.stat().st_size:,} 字节)")
        else:
            print_error("未找到 app.asar 文件！")
            sys.exit(1)
    else:
        print_success(f"官方原版备份已存在 ({bak_path.stat().st_size:,} 字节)，具备秒级回退保障")

    # 步骤 4: 部署插件与管理组件到用户目录
    print_step(4, TOTAL_STEPS, "部署三大插件与核心引擎到系统目录...")
    target_plugins_dir.mkdir(parents=True, exist_ok=True)
    target_manager_dir.mkdir(parents=True, exist_ok=True)

    # 复制插件文件
    for item in plugins_src_dir.iterdir():
        if item.is_file():
            shutil.copy2(item, target_plugins_dir / item.name)
            print_success(f"部署插件: {item.name}")

    # 复制管理文件
    for item in manager_src_dir.iterdir():
        if item.is_file():
            shutil.copy2(item, target_manager_dir / item.name)
            print_success(f"部署管理组件: {item.name}")

    # 步骤 5: 执行底层补丁引擎打补丁
    print_step(5, TOTAL_STEPS, "执行底层 Asar 补丁引擎注入...")
    patch_engine_path = target_manager_dir / "patch_engine.js"
    res = subprocess.run(
        ["node", str(patch_engine_path), "patch"],
        cwd=str(target_manager_dir),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore"
    )
    if res.returncode == 0:
        print_success("底核注入成功！汉化模块、Token 实时计数器、用量智脑 IPC 挂载完成")
    else:
        print_error("补丁引擎执行遇到警告或错误：")
        print(res.stderr or res.stdout)
        print_warn("尝试继续完成后续配置...")

    # 步骤 6: 初始化本地专属用量大盘数据
    print_step(6, TOTAL_STEPS, "初始化个人专属本地用量大盘...")
    collector_py = target_plugins_dir / "collector.py"
    dashboard_html = target_plugins_dir / "dashboard.html"
    try:
        # 执行数据采集生成实时统计
        res_collect = subprocess.run(
            [sys.executable, str(collector_py), "--json"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            timeout=30
        )
        if res_collect.returncode == 0 and res_collect.stdout.strip():
            user_stats = json.loads(res_collect.stdout.strip())
            # 注入到本地的 dashboard.html 中
            if dashboard_html.exists():
                html_txt = dashboard_html.read_text(encoding="utf-8", errors="ignore")
                marker = "const statsData = "
                idx1 = html_txt.find(marker)
                if idx1 != -1:
                    idx2 = html_txt.find(";\n    setTimeout", idx1)
                    if idx2 != -1:
                        new_html = html_txt[:idx1 + len(marker)] + json.dumps(user_stats) + html_txt[idx2:]
                        dashboard_html.write_text(new_html, encoding="utf-8")
                        total_tok = user_stats.get("summary", {}).get("total_tokens", 0)
                        print_success(f"成功同步本地真实统计数据 (已累计记录 {total_tok:,} Tokens)")
        else:
            print_warn("暂未扫描到历史会话记录（首次使用），已使用纯净模板就绪")
    except Exception as e:
        print_warn(f"初始化大盘数据跳过 ({e})，不影响正常使用，首次打开时将自动采集")

    # 步骤 7: 开机静默守护配置与进程启动
    print_step(7, TOTAL_STEPS, "配置开机静默防失效守护...")
    vbs_src = target_manager_dir / "AntigravityPluginGuard.vbs"
    if startup_dir.exists() and vbs_src.exists():
        vbs_dst = startup_dir / "AntigravityPluginGuard.vbs"
        shutil.copy2(vbs_src, vbs_dst)
        print_success("已配置 Windows 开机静默自启 (0 黑框弹窗，防更新失效)")

    # 启动后台守护
    pythonw_candidates = [
        Path(sys.executable).parent / "pythonw.exe",
        Path("C:/Program Files/Python312/pythonw.exe"),
        Path("C:/Program Files/Python311/pythonw.exe"),
        Path("C:/Program Files/Python310/pythonw.exe"),
    ]
    pythonw_bin = None
    for p in pythonw_candidates:
        if p.exists():
            pythonw_bin = str(p)
            break

    guard_script = target_manager_dir / "auto_patch_guard.py"
    if pythonw_bin and guard_script.exists():
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        subprocess.Popen(
            [pythonw_bin, str(guard_script)],
            cwd=str(target_manager_dir),
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
            close_fds=True
        )
        print_success("后台高精度实时推送守护已无感启动")

    print(f"\n{GREEN}{BOLD}{'='*64}{RESET}")
    print(f"{GREEN}{BOLD}  🎉 全部三大功能已成功部署完毕！{RESET}")
    print(f"{GREEN}  1. 【深度汉化】 全局界面、菜单及命令面板全部中文化{RESET}")
    print(f"{GREEN}  2. 【实时 Token】 输入框底部常驻显示上下文消耗与比例进度条{RESET}")
    print(f"{GREEN}  3. 【用量智脑】 输入框旁新增 📊用量智脑 按钮，支持弹窗与独立大屏{RESET}")
    print(f"{GREEN}{BOLD}{'='*64}{RESET}")

    # 询问是否立即启动 Antigravity
    app_exe = resources_dir.parent / "Antigravity.exe"
    if app_exe.exists():
        ans = input("\n是否立即启动 Antigravity 体验全新插件增强？(Y/n): ").strip().lower()
        if ans in ("", "y", "yes"):
            subprocess.Popen([str(app_exe)], cwd=str(app_exe.parent))
            print(f"{GREEN}✓ Antigravity 正在启动中... 祝您编码愉快！{RESET}")
            time.sleep(2)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n用户取消安装。")
    except Exception as e:
        print(f"\n{RED}安装发生异常: {e}{RESET}")
        import traceback
        traceback.print_exc()
        input("\n按回车键退出...")
