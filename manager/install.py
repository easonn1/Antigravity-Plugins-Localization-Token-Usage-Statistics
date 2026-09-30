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
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import shutil
import subprocess
import time
import json
import re   # 步骤 6 的 statsData 注入需要；此前缺失会导致大盘数据被静默跳过
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

def print_step(step_idx, total_steps, title):
    print(f"\n{CYAN}{BOLD}[{step_idx}/{total_steps}] {title}{RESET}")

def print_success(msg):
    print(f"  {GREEN}[OK] {msg}{RESET}")

def print_warn(msg):
    print(f"  {YELLOW}[!] {msg}{RESET}")

def print_error(msg):
    print(f"  {RED}[X] {msg}{RESET}")


# ---------------- 交互模式：无人值守 / 被安装器管道调用时不能卡在 input() -------------
def _is_tty():
    try:
        return bool(sys.stdout) and sys.stdout.isatty()
    except Exception:
        return False


INTERACTIVE = _is_tty()
_CLI_ARGS = [str(a).lower() for a in sys.argv[1:]]
# --yes / -y 显式无人值守；stdout 不是终端（安装器或脚本管道）时同样自动确认，
# 否则 input() 会抛 EOFError，让一次本来成功的安装报成异常。
AUTO_YES = ("--yes" in _CLI_ARGS) or ("-y" in _CLI_ARGS) or (not INTERACTIVE)
NO_DAEMON = "--no-daemon" in _CLI_ARGS
NO_INPUT_PREFIX = "--no-input" in _CLI_ARGS
if not INTERACTIVE:
    GREEN = YELLOW = CYAN = RED = BOLD = RESET = ""


def confirm(prompt, default=True):
    if AUTO_YES:
        return default
    try:
        return input(prompt).strip().lower() in ("", "y", "yes", "是")
    except Exception:
        return default


def ask_text(prompt, default=""):
    if AUTO_YES:
        return default
    try:
        return input(prompt).strip().strip('"\'')
    except Exception:
        return default


def pause(prompt="\n按回车键继续..."):
    if AUTO_YES:
        return
    try:
        input(prompt)
    except Exception:
        pass

def get_startup_dir():
    roaming = os.environ.get("APPDATA")
    if roaming and os.path.exists(roaming):
        return Path(roaming) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
    return Path.home() / "AppData" / "Roaming" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"

def find_antigravity_resources():
    # 允许显式指定（便携安装 / 自定义盘符 / 打包自测沙箱）
    override = os.environ.get("ANTIGRAVITY_RESOURCES")
    if override:
        p = Path(override)
        if (p / "app.asar").exists():
            return p
        if (p / "resources" / "app.asar").exists():
            return p / "resources"
        print(f"  [!] ANTIGRAVITY_RESOURCES 指向的目录没有 app.asar，改用自动探测: {override}")

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
        if p.exists() and (p / "app.asar").exists():
            return p

    # 兜底：别人可能改过安装目录 / 目录名大小写不同（Antigravity、antigravity IDE…）
    # 只按 app.asar 特征搜索常见的程序根目录，避免全盘扫描卡死。
    import glob
    roots = []
    if localappdata:
        roots.append(os.path.join(localappdata, "Programs"))
    for ev in ("PROGRAMFILES", "PROGRAMFILES(X86)", "ProgramFiles", "ProgramFiles(x86)"):
        v = os.environ.get(ev)
        if v and v not in roots:
            roots.append(v)
    for drive in ("D:", "E:"):
        for sub in ("Program Files", "Programs", "app", "software", "Softwares", "Games"):
            roots.append(os.path.join(drive + "\\", sub))
    for r in roots:
        for hit in glob.glob(os.path.join(r, "*[Aa]ntigravity*", "resources", "app.asar")):
            p = Path(hit).parent
            if p.exists():
                print(f"  [i] 通过特征搜索定位到安装目录: {p}")
                return p
    return None

def find_pythonw():
    """Locate a windowless pythonw.exe without hard-coding one install path.

    The shipped startup script used to contain a fixed
    `pythonw = "C:\\Program Files\\Python312\\pythonw.exe"`, so on a machine with
    Python 3.13 / a per-user install / conda the boot guard silently never started
    and the localization was lost after the first Antigravity update.
    """
    import glob
    roots = [Path(sys.executable).parent]
    lapp = os.environ.get("LOCALAPPDATA")
    if lapp:
        roots.append(Path(lapp) / "Programs" / "Python")
        roots += [Path(x) for x in glob.glob(str(Path(lapp) / "Programs" / "Python" / "*"))]
    for v in {os.environ.get("PROGRAMFILES"), os.environ.get("ProgramFiles"),
              os.environ.get("PROGRAMFILES(X86)"), os.environ.get("ProgramFiles(x86)")}:
        if v:
            roots.append(Path(v))
            roots += [Path(x) for x in glob.glob(str(Path(v) / "Python3*"))]
    user = os.environ.get("USERPROFILE")
    if user:
        roots += [Path(user) / "anaconda3", Path(user) / "miniconda3"]
    roots += [Path(x) for x in glob.glob("C:/Python3*")]

    for name in ("pythonw.exe", "python.exe"):
        for r in roots:
            c = r / name
            if c.is_file():
                return str(c)
    return None


GUARD_VBS = """' Antigravity Plugin Guard - generated launcher, ASCII only.
' Runs the auto-repatch daemon 15s after logon with no window at all.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
Dim exe, args
exe = "%(exe)s"
args = "%(args)s"
If fso.FileExists(exe) Then
    WScript.Sleep 15000
    shell.Run Chr(34) & exe & Chr(34) & " " & args, 0, False
End If
"""


def write_guard_launcher(vbs_path, pythonw_bin=None, frozen_exe=None):
    """Write the startup .vbs against the interpreter that actually exists here."""
    if vbs_path is None:
        return None
    if frozen_exe:
        exe, args = str(frozen_exe), '--guard'
    elif pythonw_bin:
        exe = str(pythonw_bin)
        args = '"%s"' % (Path(vbs_path).parent / "auto_patch_guard.py")
    else:
        return None
    try:
        Path(vbs_path).write_bytes((GUARD_VBS % {"exe": exe, "args": args}).encode("ascii", "replace"))
    except Exception as e:
        print_warn("生成开机守护脚本失败 (%s)" % e)
        return None
    return Path(vbs_path)


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
    startup_dir = get_startup_dir()

    TOTAL_STEPS = 7

    # 步骤 1: 环境检查
    print_step(1, TOTAL_STEPS, "检查系统运行环境...")
    # 检查 Node.js（不再只看 PATH：还会探测 nvm / fnm / volta / scoop / chocolatey / 便携版）
    node_ok = False
    node_bin = find_node()
    if node_bin:
        try:
            r = subprocess.run([node_bin, "-v"], capture_output=True, text=True,
                               encoding="utf-8", errors="replace", timeout=20)
            if r.returncode == 0:
                node_ver = r.stdout.strip()
                print_success(f"Node.js 环境已就绪 ({node_ver})")
                import shutil as _sh
                if not _sh.which("node"):
                    print_warn(f"  node.exe 不在 PATH 中，已改用完整路径调用：{node_bin}")
                node_ok = True
        except Exception:
            node_ok = False

    if not node_ok:
        print_error("未检测到 Node.js 环境！")
        print("  Antigravity 的底层 asar 补丁注入引擎需要 Node.js 支持。")
        print("  已自动搜索：PATH、Program Files\\nodejs、nvm-windows、fnm、volta、scoop、chocolatey、便携目录。")
        print("  方案 A：访问 https://nodejs.org/ 安装 LTS 版本（保持默认勾选 Add to PATH），")
        print("          安装完成后【关闭所有窗口重新双击】本脚本（旧窗口读不到新 PATH）。")
        print("  方案 B：本机已有 node.exe（如 nvm/便携版），直接粘贴其完整路径给安装器。")
        manual = ""
        try:
            manual = ask_text("\n  请输入 node.exe 完整路径（留空则退出）: ")
        except Exception:
            manual = ""
        if manual:
            cand = Path(manual)
            if cand.is_dir():
                cand = cand / "node.exe"
            if cand.exists():
                try:
                    r = subprocess.run([str(cand), "-v"], capture_output=True, text=True,
                                       encoding="utf-8", errors="replace", timeout=20)
                    if r.returncode == 0 and r.stdout.strip().startswith("v"):
                        node_bin = str(cand)
                        node_ok = True
                        os.environ["ANTIGRAVITY_NODE"] = node_bin
                        print_success(f"已使用手动指定的 Node.js ({r.stdout.strip()})")
                        print_warn("  请将该目录加入系统 PATH，否则开机静默守护可能失效。")
                except Exception:
                    pass
        if not node_ok:
            try:
                os.startfile("https://nodejs.org/en/download/")
            except Exception:
                subprocess.run(["cmd", "/c", "start", "", "https://nodejs.org/en/download/"],
                               capture_output=True)
            pause("\n按回车键退出安装...")
            sys.exit(1)

    # 检查 Python
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print_success(f"Python 环境已就绪 (v{py_ver})")

    # 检查 Antigravity 安装
    resources_dir = find_antigravity_resources()
    if not resources_dir:
        print_error("未自动找到 Antigravity 安装目录！")
        custom = ask_text("  请输入 Antigravity 根目录或 resources 文件夹路径: ")
        p_custom = Path(custom)
        if (p_custom / "resources" / "app.asar").exists():
            resources_dir = p_custom / "resources"
            print_success(f"已自动解析并锁定: {resources_dir}")
        elif (p_custom / "app.asar").exists():
            resources_dir = p_custom
            print_success(f"已锁定自定义路径: {resources_dir}")
        else:
            print_error("指定的路径无效或未包含 app.asar，安装中止。")
            pause("\n按回车键退出安装...")
            sys.exit(1)
    else:
        print_success(f"已锁定 Antigravity 核心目录: {resources_dir}")

    # 写入权限预检：装在 Program Files 下时必须管理员，否则会在备份那一步才失败
    probe = resources_dir / ".ag_write_probe.tmp"
    try:
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
    except Exception:
        print_error("当前账号没有写入该目录的权限（通常因为 Antigravity 装在了 Program Files）。")
        print("  请右键【一键全量部署.bat】→【以管理员身份运行】后重试。")
        print(f"  目标目录：{resources_dir}")
        pause("\n按回车键退出安装...")
        sys.exit(1)

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
            try:
                shutil.copy2(asar_path, bak_path)
                print_success(f"已成功创建官方原版备份: app.asar.bak ({bak_path.stat().st_size:,} 字节)")
            except PermissionError:
                print_error("权限不足！请右键【一键全量部署.bat】选择【以管理员身份运行】后重试！")
                pause("\n按回车键退出安装...")
                sys.exit(1)
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
        [find_node() or "node", str(patch_engine_path), "patch", str(resources_dir)],
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
        # 确保使用控制台版 python.exe 而非 pythonw.exe 执行采集
        py_cli = Path(sys.executable).parent / "python.exe"
        py_exec = str(py_cli) if py_cli.exists() else sys.executable

        # 执行数据采集生成实时统计
        res_collect = subprocess.run(
            [py_exec, str(collector_py), "--json"],
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
                pattern = re.compile(r"const statsData = \{[\s\S]*?\};")
                replacement = f"const statsData = {json.dumps(user_stats)};"
                if pattern.search(html_txt):
                    new_html = pattern.sub(lambda _: replacement, html_txt)
                    dashboard_html.write_text(new_html, encoding="utf-8")
                    total_tok = user_stats.get("summary", {}).get("total_tokens", 0)
                    print_success(f"成功同步本地真实统计数据 (已累计记录 {total_tok:,} Tokens)")
        else:
            print_warn("暂未扫描到历史会话记录（首次使用），已使用纯净模板就绪")
    except Exception as e:
        print_warn(f"初始化大盘数据跳过 ({e})，不影响正常使用，首次打开时将自动采集")

    # 步骤 7: 开机静默守护配置与进程启动
    print_step(7, TOTAL_STEPS, "配置开机静默防失效守护...")
    guard_script = target_manager_dir / "auto_patch_guard.py"
    pythonw_bin = find_pythonw()
    frozen_exe = Path(sys.executable) if getattr(sys, "frozen", False) else None
    vbs_path = write_guard_launcher(target_manager_dir / "AntigravityPluginGuard.vbs",
                                   pythonw_bin=pythonw_bin, frozen_exe=frozen_exe)
    if vbs_path is None:
        # 找不到可用解释器时才退回随包的静态脚本（它只在你机器上有默认路径 Python 时才有效）
        vbs_src = target_manager_dir / "AntigravityPluginGuard.vbs"
        vbs_path = vbs_src if vbs_src.exists() else None
    if startup_dir.exists() and vbs_path and Path(vbs_path).exists():
        shutil.copy2(str(vbs_path), str(startup_dir / "AntigravityPluginGuard.vbs"))
        print_success("已配置 Windows 开机静默自启 (0 黑框弹窗，防更新失效)")
    elif not startup_dir.exists():
        print_warn(f"未找到开机启动目录，跳过自启配置：{startup_dir}")
        print("       软件自动更新后若汉化失效，重新双击一次【一键全量部署】即可。")
    else:
        print_warn("未能配置开机自启：本机没有找到可用的 Python/守护可执行文件。")
        print("       软件自动更新后若汉化失效，重新双击一次【一键全量部署】即可。")

    if frozen_exe:
        daemon_cmd = [str(frozen_exe), "--guard"]
    elif pythonw_bin and guard_script.exists():
        daemon_cmd = [pythonw_bin, str(guard_script)]
    else:
        daemon_cmd = None
    if NO_DAEMON:
        print_warn("已按 --no-daemon 跳过后台守护启动（自测/无人值守环境用）")
    if daemon_cmd and not NO_DAEMON:
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        subprocess.Popen(
            daemon_cmd,
            cwd=str(target_manager_dir),
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
            close_fds=True
        )
        print_success("后台高精度实时推送守护已无感启动")

    print(f"\n{GREEN}{BOLD}{'='*64}{RESET}")
    print(f"{GREEN}{BOLD}  * 全部三大功能已成功部署完毕！{RESET}")
    print(f"{GREEN}  1. 【深度汉化】 全局界面、菜单及命令面板全部中文化{RESET}")
    print(f"{GREEN}  2. 【实时 Token】 输入框底部常驻显示上下文消耗与比例进度条{RESET}")
    print(f"{GREEN}  3. 【用量智脑】 输入框旁新增 *用量智脑 按钮，支持弹窗与独立大屏{RESET}")
    print(f"{GREEN}{BOLD}{'='*64}{RESET}")

    # 询问是否立即启动 Antigravity
    app_exe = resources_dir.parent / "Antigravity.exe"
    if app_exe.exists():
        ans = confirm("\n是否立即启动 Antigravity 体验全新插件增强？(Y/n): ")
        if ans:
            subprocess.Popen([str(app_exe)], cwd=str(app_exe.parent))
            print(f"{GREEN}[OK] Antigravity 正在启动中... 祝您编码愉快！{RESET}")
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
        pause("\n按回车键退出...")
