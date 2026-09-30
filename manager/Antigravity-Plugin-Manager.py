# -*- coding: utf-8 -*-
"""
* Antigravity 插件管理与拓展中心 (Antigravity Plugin Manager)
Author: Google Antigravity Agentic Assistant
"""
import os
import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import json
import shutil
import subprocess
import threading
import ctypes
from ctypes import wintypes
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

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


PLUGINS_DIR = os.path.join(os.path.expanduser('~'), '.gemini', 'antigravity', 'plugins')
MANAGER_DIR = os.path.join(os.path.expanduser('~'), '.gemini', 'antigravity', 'manager')
PATCH_ENGINE_JS = os.path.join(MANAGER_DIR, 'patch_engine.js')
APP_DIR = os.path.join(os.getenv('LOCALAPPDATA', ''), 'Programs', 'antigravity')
EXE_PATH = os.path.join(APP_DIR, 'Antigravity.exe')
CONFIG_FILE = os.path.join(PLUGINS_DIR, 'plugins.json')

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {"version": "1.0.0", "plugins": {}}

def save_config(cfg):
    os.makedirs(PLUGINS_DIR, exist_ok=True)
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

def run_node_patch(action='patch', callback=None):
    def _run():
        try:
            creation_flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            result = subprocess.run(
                [find_node() or 'node', PATCH_ENGINE_JS, action],
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                creationflags=creation_flags
            )
            out = result.stdout + '\n' + result.stderr
            if callback:
                callback(result.returncode == 0, out)
        except Exception as e:
            if callback:
                callback(False, str(e))
    threading.Thread(target=_run, daemon=True).start()

class _PROCESSENTRY32(ctypes.Structure):
    _fields_ = [
        ("dwSize", wintypes.DWORD),
        ("cntUsage", wintypes.DWORD),
        ("th32ProcessID", wintypes.DWORD),
        ("th32DefaultHeapID", ctypes.POINTER(wintypes.ULONG)),
        ("th32ModuleID", wintypes.DWORD),
        ("cntThreads", wintypes.DWORD),
        ("th32ParentProcessID", wintypes.DWORD),
        ("pcPriClassBase", wintypes.LONG),
        ("dwFlags", wintypes.DWORD),
        ("szExeFile", ctypes.c_char * 260)
    ]

def is_antigravity_running():
    try:
        hSnapshot = ctypes.windll.kernel32.CreateToolhelp32Snapshot(0x00000002, 0)
        if hSnapshot == -1:
            return False
        pe32 = _PROCESSENTRY32()
        pe32.dwSize = ctypes.sizeof(_PROCESSENTRY32)
        found = False
        target = b'antigravity.exe'
        if ctypes.windll.kernel32.Process32First(hSnapshot, ctypes.byref(pe32)):
            while True:
                if pe32.szExeFile.lower() == target:
                    found = True
                    break
                if not ctypes.windll.kernel32.Process32Next(hSnapshot, ctypes.byref(pe32)):
                    break
        ctypes.windll.kernel32.CloseHandle(hSnapshot)
        return found
    except Exception:
        return False

class PluginManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("* Antigravity 插件管理与拓展中心")
        self.root.geometry("780x560")
        self.root.minsize(680, 480)

        # Style config
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Color palette
        self.bg_color = "#f8fafc"
        self.card_bg = "#ffffff"
        self.primary_color = "#2563eb"
        self.text_color = "#1e293b"
        self.root.configure(bg=self.bg_color)

        self.setup_ui()
        self.refresh_plugin_list()
        self.refresh_system_status()

    def setup_ui(self):
        # 1. Header Frame
        header_frame = tk.Frame(self.root, bg="#1e293b", padx=20, pady=14)
        header_frame.pack(fill='x')

        title_lbl = tk.Label(
            header_frame,
            text="* Antigravity 插件管理与拓展中心",
            font=("Segoe UI", 15, "bold"),
            fg="#ffffff",
            bg="#1e293b"
        )
        title_lbl.pack(side='left')

        self.status_badge = tk.Label(
            header_frame,
            text="检测中...",
            font=("Segoe UI", 9, "bold"),
            fg="#10b981",
            bg="#0f172a",
            padx=10,
            pady=4,
            relief='groove'
        )
        self.status_badge.pack(side='right')

        # 2. Main Content
        content_frame = tk.Frame(self.root, bg=self.bg_color, padx=16, pady=12)
        content_frame.pack(fill='both', expand=True)

        # Top Action Bar
        action_bar = tk.Frame(content_frame, bg=self.bg_color)
        action_bar.pack(fill='x', pady=(0, 10))

        btn_install = tk.Button(
            action_bar,
            text="🚀 一键安装 / 修复插件系统",
            font=("Segoe UI", 10, "bold"),
            bg="#2563eb",
            fg="#ffffff",
            activebackground="#1d4ed8",
            activeforeground="#ffffff",
            relief='flat',
            padx=14,
            pady=6,
            cursor='hand2',
            command=self.on_install_click
        )
        btn_install.pack(side='left', padx=(0, 8))

        btn_folder = tk.Button(
            action_bar,
            text="📂 打开插件文件夹",
            font=("Segoe UI", 9),
            bg="#ffffff",
            fg="#334155",
            relief='groove',
            padx=12,
            pady=6,
            cursor='hand2',
            command=self.open_plugins_folder
        )
        btn_folder.pack(side='left', padx=4)

        btn_restore = tk.Button(
            action_bar,
            text="🔄 还原官方原版",
            font=("Segoe UI", 9),
            bg="#ffffff",
            fg="#ef4444",
            relief='groove',
            padx=12,
            pady=6,
            cursor='hand2',
            command=self.on_restore_click
        )
        btn_restore.pack(side='left', padx=4)

        btn_launch = tk.Button(
            action_bar,
            text="▶️ 启动 Antigravity",
            font=("Segoe UI", 9, "bold"),
            bg="#10b981",
            fg="#ffffff",
            activebackground="#059669",
            activeforeground="#ffffff",
            relief='flat',
            padx=12,
            pady=6,
            cursor='hand2',
            command=self.launch_antigravity
        )
        btn_launch.pack(side='right')

        # 3. Plugin List View
        list_frame = tk.LabelFrame(
            content_frame,
            text=" 已安装插件列表 (双击或点击下方开关启用/禁用) ",
            font=("Segoe UI", 9, "bold"),
            bg=self.card_bg,
            fg="#475569",
            padx=10,
            pady=8
        )
        list_frame.pack(fill='both', expand=True, pady=(0, 10))

        columns = ('status', 'name', 'file', 'desc')
        self.tree = ttk.Treeview(list_frame, columns=columns, show='headings', selectmode='browse')
        self.tree.heading('status', text='状态')
        self.tree.heading('name', text='插件名称')
        self.tree.heading('file', text='文件名')
        self.tree.heading('desc', text='功能简介')

        self.tree.column('status', width=70, anchor='center')
        self.tree.column('name', width=220)
        self.tree.column('file', width=180)
        self.tree.column('desc', width=240)

        scrollbar = ttk.Scrollbar(list_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')

        self.tree.bind("<Double-1>", self.on_toggle_plugin)

        # Plugin Control Bar
        plugin_ctl_bar = tk.Frame(content_frame, bg=self.bg_color)
        plugin_ctl_bar.pack(fill='x', pady=(0, 8))

        btn_toggle = tk.Button(
            plugin_ctl_bar,
            text="🔄 切换选中插件 启用/禁用",
            font=("Segoe UI", 9),
            bg="#ffffff",
            fg="#1e293b",
            relief='groove',
            padx=10,
            pady=4,
            cursor='hand2',
            command=self.on_toggle_plugin
        )
        btn_toggle.pack(side='left', padx=(0, 8))

        btn_refresh = tk.Button(
            plugin_ctl_bar,
            text="🔄 刷新列表",
            font=("Segoe UI", 9),
            bg="#ffffff",
            fg="#475569",
            relief='groove',
            padx=10,
            pady=4,
            cursor='hand2',
            command=self.refresh_plugin_list
        )
        btn_refresh.pack(side='left')

        tip_lbl = tk.Label(
            plugin_ctl_bar,
            text="💡 提示: 往插件文件夹中直接放入任何 .js 脚本即可添加新插件！",
            font=("Segoe UI", 8),
            fg="#64748b",
            bg=self.bg_color
        )
        tip_lbl.pack(side='right')

        # 4. Console Log Panel
        log_frame = tk.LabelFrame(
            content_frame,
            text=" 运行状态与日志 ",
            font=("Segoe UI", 9, "bold"),
            bg=self.card_bg,
            fg="#475569",
            padx=8,
            pady=6
        )
        log_frame.pack(fill='x', side='bottom')

        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            height=5,
            font=("Consolas", 8),
            bg="#0f172a",
            fg="#e2e8f0",
            insertbackground="#ffffff"
        )
        self.log_text.pack(fill='both', expand=True)

        self.append_log("* Antigravity 插件管理中心就绪。")

    def append_log(self, text):
        self.log_text.insert('end', text + '\n')
        self.log_text.see('end')

    def refresh_system_status(self):
        running = is_antigravity_running()
        if running:
            self.status_badge.config(text="● Antigravity 运行中", fg="#10b981")
        else:
            self.status_badge.config(text="○ Antigravity 未运行", fg="#94a3b8")

    def refresh_plugin_list(self):
        for item in self.tree.get_children():
            self.tree.delete(item)

        cfg = load_config()
        os.makedirs(PLUGINS_DIR, exist_ok=True)
        files = [f for f in os.listdir(PLUGINS_DIR) if f.endswith('.js') and not f.startswith('_')]
        files.sort()

        for f in files:
            p_info = cfg.get("plugins", {}).get(f, {})
            is_enabled = p_info.get("enabled", True)
            name = p_info.get("name", f)
            desc = p_info.get("description", "用户自定义扩展插件")
            status_str = "✅ 已启用" if is_enabled else "❌ 已禁用"
            self.tree.insert('', 'end', values=(status_str, name, f, desc))

    def on_toggle_plugin(self, event=None):
        selected = self.tree.selection()
        if not selected:
            messagebox.showinfo("提示", "请先在列表中选中一个插件！")
            return
        item = selected[0]
        values = self.tree.item(item, 'values')
        file_name = values[2]

        cfg = load_config()
        if file_name not in cfg.get("plugins", {}):
            cfg.setdefault("plugins", {})[file_name] = {
                "name": file_name,
                "description": "自定义插件",
                "enabled": True
            }

        curr_state = cfg["plugins"][file_name].get("enabled", True)
        cfg["plugins"][file_name]["enabled"] = not curr_state
        save_config(cfg)

        new_state_str = "启用" if not curr_state else "禁用"
        self.append_log(f"已{new_state_str}插件: {file_name}")
        self.refresh_plugin_list()
        messagebox.showinfo("成功", f"已将【{file_name}】设置为: {new_state_str}！\n重启 Antigravity 后即可生效。")

    def on_install_click(self):
        self.append_log(">>> 开始执行一键安装与修复注入...")
        self.status_badge.config(text="正在挂载注入...", fg="#f59e0b")

        def _cb(success, output):
            self.root.after(0, lambda: self._handle_patch_result(success, output))

        run_node_patch('patch', _cb)

    def _handle_patch_result(self, success, output):
        self.append_log(output)
        self.refresh_system_status()
        if success:
            self.append_log("* 插件系统与 Micro-Loader 挂载成功！")
            messagebox.showinfo(
                "部署成功",
                "* Antigravity 插件系统已成功挂载！\n\n- 深度中文汉化 已就绪\n- 上下文 Token 计数器 已就绪\n- 插件目录已接入通用加载器\n\n请正常重启 Antigravity 查看效果！"
            )
        else:
            self.append_log("❌ 安装或挂载过程遇到提示，详情见上方日志。")
            messagebox.showwarning("提示", "安装执行完毕，请查看日志面板。")

    def on_restore_click(self):
        if not messagebox.askyesno("确认还原", "确定要还原官方原生 app.asar 并移除所有插件挂载吗？"):
            return
        self.append_log(">>> 正在还原官方原生版本...")
        def _cb(success, output):
            self.root.after(0, lambda: self.append_log(output))
            messagebox.showinfo("还原完成", "已恢复为官方原生版本！重启软件即可生效。")
        run_node_patch('restore', _cb)

    def open_plugins_folder(self):
        os.makedirs(PLUGINS_DIR, exist_ok=True)
        os.startfile(PLUGINS_DIR)
        self.append_log(f"已打开插件文件夹: {PLUGINS_DIR}")

    def launch_antigravity(self):
        if os.path.exists(EXE_PATH):
            subprocess.Popen([EXE_PATH], shell=True)
            self.append_log(f"已启动 Antigravity: {EXE_PATH}")
        else:
            messagebox.showerror("错误", f"未找到 Antigravity 可执行文件:\n{EXE_PATH}")

def main():
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == '--patch':
            res = subprocess.run([find_node() or 'node', PATCH_ENGINE_JS, 'patch'], capture_output=True, text=True,
                             encoding='utf-8', errors='replace')
            print(res.stdout + '\n' + res.stderr)
            sys.exit(res.returncode)
        elif arg == '--restore':
            res = subprocess.run([find_node() or 'node', PATCH_ENGINE_JS, 'restore'], capture_output=True, text=True,
                             encoding='utf-8', errors='replace')
            print(res.stdout + '\n' + res.stderr)
            sys.exit(res.returncode)
        elif arg == '--launch':
            # Check and auto-patch, then launch
            subprocess.run([find_node() or 'node', PATCH_ENGINE_JS, 'patch'], capture_output=True)
            if os.path.exists(EXE_PATH):
                subprocess.Popen([EXE_PATH], shell=True)
            sys.exit(0)

    root = tk.Tk()
    app = PluginManagerApp(root)
    root.mainloop()

if __name__ == '__main__':
    main()
