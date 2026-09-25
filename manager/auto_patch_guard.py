# -*- coding: utf-8 -*-
"""
Antigravity 插件自动守护脚本 v3.0 (Real-Time File Watcher + Periodic Fallback)
功能:
  1. 实时监听 app.asar 文件变化，一旦被更新就立即重新打补丁（秒级响应）
  2. 每 5 分钟备选周期检查（防止文件监听漏报）
  3. 启动时立即检查一次
"""

import os
import sys
import subprocess
import logging
import time
import threading
from pathlib import Path
from datetime import datetime

# === 路径配置 ===
HOME = Path.home()
RESOURCES_DIR = Path(os.environ.get('LOCALAPPDATA', '')) / 'Programs' / 'antigravity' / 'resources'
PRELOAD_PATH = RESOURCES_DIR / 'app' / 'dist' / 'preload.js'
ASAR_PATH = RESOURCES_DIR / 'app.asar'
BAK_PATH = RESOURCES_DIR / 'app.asar.bak'
PATCH_ENGINE = HOME / '.gemini' / 'antigravity' / 'manager' / 'patch_engine.js'
LOG_FILE = HOME / '.gemini' / 'antigravity' / 'manager' / 'guard.log'

# === 日志配置 ===
os.makedirs(LOG_FILE.parent, exist_ok=True)
logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format='%(asctime)s [Guard] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
log = logging.getLogger()

# 去重：防止短时间内多次触发
_last_patch_time = 0
_PATCH_COOLDOWN = 30  # 30 秒内不重复修复


def is_patched():
    """检查 preload.js 是否包含我们的插件标记"""
    if not PRELOAD_PATH.exists():
        return False
    try:
        code = PRELOAD_PATH.read_text(encoding='utf-8')
        has_localization = 'processNode' in code and 'MutationObserver' in code
        has_token = 'ag-token-counter-badge' in code
        return has_localization and has_token
    except Exception:
        return False


def ensure_backup():
    """确保 app.asar.bak 是干净的原版备份"""
    if not BAK_PATH.exists() and ASAR_PATH.exists():
        import shutil
        shutil.copy2(str(ASAR_PATH), str(BAK_PATH))
        log.info(f'Created backup: app.asar.bak ({BAK_PATH.stat().st_size:,} bytes)')
        return True
    return False


def run_patch():
    """调用 patch_engine.js 重新注入插件"""
    global _last_patch_time

    # 冷却期检查
    now = time.time()
    if now - _last_patch_time < _PATCH_COOLDOWN:
        return True  # 跳过

    if not PATCH_ENGINE.exists():
        log.error(f'patch_engine.js not found at {PATCH_ENGINE}')
        return False

    try:
        creation_flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        result = subprocess.run(
            ['node', str(PATCH_ENGINE), 'patch'],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(PATCH_ENGINE.parent),
            creationflags=creation_flags
        )
        _last_patch_time = time.time()
        if result.returncode == 0:
            log.info('Patch applied successfully.')
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    log.info(f'  {line.strip()}')
            return True
        else:
            log.error(f'Patch failed (exit code {result.returncode})')
            if result.stderr:
                log.error(result.stderr[:500])
            if result.stdout:
                log.error(result.stdout[:500])
            return False
    except subprocess.TimeoutExpired:
        log.error('Patch timed out after 120 seconds')
        return False
    except Exception as e:
        log.error(f'Patch error: {e}')
        return False


def check_and_repair(force=False):
    """检查并修复（核心逻辑）"""
    if not RESOURCES_DIR.exists():
        return
    if not force and is_patched():
        return

    log.info('=== Patch needed or update detected! Auto-recovering... ===')
    log.info(f'app.asar: {ASAR_PATH.exists()} ({ASAR_PATH.stat().st_size:,} bytes)' if ASAR_PATH.exists() else 'app.asar: NOT FOUND')
    log.info(f'app.asar.bak: {BAK_PATH.exists()}')
    log.info(f'app/ dir: {(RESOURCES_DIR / "app").is_dir()}')

    ensure_backup()

    if run_patch():
        if is_patched():
            log.info('Verification PASSED. Plugins restored!')
        else:
            log.warning('Patch ran but verification failed.')
    else:
        log.error('Auto-recovery FAILED.')


def watch_asar_file():
    """
    用 Windows ReadDirectoryChangesW 实时监听 resources/ 目录下的文件变化。
    当 app.asar 被修改或替换时，等待 8 秒让更新完成，然后立即修复。
    """
    import ctypes
    import ctypes.wintypes

    INVALID_HANDLE_VALUE = ctypes.wintypes.HANDLE(-1).value
    FILE_NOTIFY_CHANGE_FILE_NAME = 0x01
    FILE_NOTIFY_CHANGE_SIZE = 0x08
    FILE_NOTIFY_CHANGE_LAST_WRITE = 0x10
    FILE_LIST_DIRECTORY = 0x01
    FILE_SHARE_READ = 0x01
    FILE_SHARE_WRITE = 0x02
    FILE_SHARE_DELETE = 0x04
    OPEN_EXISTING = 3
    FILE_FLAG_BACKUP_SEMANTICS = 0x02000000

    kernel32 = ctypes.windll.kernel32

    dir_handle = kernel32.CreateFileW(
        str(RESOURCES_DIR),
        FILE_LIST_DIRECTORY,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        None,
        OPEN_EXISTING,
        FILE_FLAG_BACKUP_SEMANTICS,
        None
    )

    if dir_handle == INVALID_HANDLE_VALUE:
        log.warning('Cannot watch resources directory, falling back to periodic only.')
        return

    log.info(f'File watcher started on: {RESOURCES_DIR}')

    buf = ctypes.create_string_buffer(4096)
    bytes_returned = ctypes.wintypes.DWORD()

    while True:
        try:
            ok = kernel32.ReadDirectoryChangesW(
                dir_handle,
                buf,
                4096,
                False,  # Don't watch subtree
                FILE_NOTIFY_CHANGE_FILE_NAME | FILE_NOTIFY_CHANGE_SIZE | FILE_NOTIFY_CHANGE_LAST_WRITE,
                ctypes.byref(bytes_returned),
                None,
                None
            )
            if ok:
                # Parse changed filename
                offset = 0
                while True:
                    next_offset = int.from_bytes(buf[offset:offset+4], 'little')
                    name_len = int.from_bytes(buf[offset+8:offset+12], 'little')
                    name = buf[offset+12:offset+12+name_len].decode('utf-16-le', errors='ignore')
                    if 'app.asar' in name.lower() and 'bak' not in name.lower() and 'patched' not in name.lower():
                        log.info(f'Detected change: {name}')
                        # Wait for update to finish writing
                        time.sleep(8)
                        check_and_repair(force=True)
                    if next_offset == 0:
                        break
                    offset += next_offset
        except Exception as e:
            log.error(f'Watcher error: {e}')
            time.sleep(10)


def live_sync_worker():
    """实时 CDP Token 同步引擎：无论会话如何切换，实时计算并秒级推送到前端徽章"""
    import urllib.request, socket, base64, json
    brain_dir = os.path.expanduser(r'~/.gemini/antigravity/brain')
    log_path = os.path.expanduser(r'~\AppData\Roaming\Antigravity\logs\language_server.log')
    last_pushed_mtime = 0
    last_pushed_file = None

    while True:
        try:
            if not os.path.exists(log_path):
                time.sleep(2)
                continue

            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            port = None
            for l in reversed(lines[-300:]):
                if 'Successfully discovered Electron WS URL: ws://127.0.0.1:' in l:
                    port = int(l.split('ws://127.0.0.1:')[1].split('/')[0])
                    break

            if port:
                try:
                    targets = json.loads(urllib.request.urlopen(f'http://127.0.0.1:{port}/json', timeout=1.5).read().decode())
                except Exception:
                    targets = []
                pages = [t for t in targets if t.get('type') == 'page']

                if pages and os.path.exists(brain_dir):
                    latest_file = None
                    latest_mtime = 0
                    for d in os.listdir(brain_dir):
                        p = os.path.join(brain_dir, d, '.system_generated', 'logs', 'transcript.jsonl')
                        if os.path.exists(p):
                            st = os.path.getmtime(p)
                            if st > latest_mtime:
                                latest_mtime = st
                                latest_file = p

                    if latest_file and (latest_mtime != last_pushed_mtime or latest_file != last_pushed_file):
                        total_cn, total_en = 0, 0
                        with open(latest_file, 'r', encoding='utf-8', errors='ignore') as f:
                            for line in f:
                                if not line.strip(): continue
                                try:
                                    data = json.loads(line)
                                    txt = (data.get('content') or '') + (data.get('thinking') or '')
                                    if data.get('tool_calls'): txt += json.dumps(data.get('tool_calls'))
                                    for ch in txt:
                                        if '\u4e00' <= ch <= '\u9fff': total_cn += 1
                                        else: total_en += 1
                                except Exception: pass
                        tokens = round((total_en / 4.0) + (total_cn * 1.5))

                        if tokens > 0:
                            last_pushed_mtime = latest_mtime
                            last_pushed_file = latest_file
                            escaped_p = latest_file.replace('\\', '\\\\').replace('"', '\\"')
                            
                            disp_val = f"{tokens / 1000000.0:.2f}M" if tokens >= 1000000 else (f"{tokens / 1000.0:.1f}k" if tokens >= 1000 else str(tokens))
                            
                            js = f"""(() => {{
                                if (window.__ag_setExactTokens) {{
                                    window.__ag_setExactTokens({tokens}, "{escaped_p}");
                                }}
                                const textNode = document.getElementById("ag-token-counter-text");
                                const badge = document.getElementById("ag-token-counter-badge");
                                if (textNode) {{
                                    const old = textNode.innerText || "";
                                    const modelPart = old.includes("/") ? old.split("/")[1] : " 1.0M";
                                    textNode.innerText = "上下文: {disp_val} /" + modelPart;
                                }}
                                if (badge) {{
                                    badge.title = "真实已消耗: {tokens:,} Tokens\\n活跃日志: {escaped_p}\\n(点击一键复制日志路径)";
                                }}
                            }})()"""

                            for page in pages:
                                ws_url = page.get('webSocketDebuggerUrl')
                                if not ws_url: continue
                                try:
                                    path = '/' + ws_url.split(f'ws://127.0.0.1:{port}/')[1]
                                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                                    s.settimeout(1.5)
                                    s.connect(('127.0.0.1', port))
                                    key = base64.b64encode(os.urandom(16)).decode('utf-8')
                                    headers = f'GET {path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'
                                    s.sendall(headers.encode('utf-8'))
                                    s.recv(2048)

                                    payload = json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': js}}).encode('utf-8')
                                    length = len(payload)
                                    frame = bytearray([0x81])
                                    if length <= 125: frame.append(0x80 | length)
                                    elif length <= 65535: frame.append(0x80 | 126); frame.extend(length.to_bytes(2, 'big'))
                                    else: frame.append(0x80 | 127); frame.extend(length.to_bytes(8, 'big'))
                                    mask = os.urandom(4)
                                    frame.extend(mask)
                                    frame.extend(bytearray(payload[i] ^ mask[i % 4] for i in range(length)))
                                    s.sendall(frame)
                                    s.recv(4096)
                                    s.close()
                                except Exception:
                                    pass
        except Exception:
            pass
        time.sleep(2.0)


def periodic_check():
    """每 5 分钟的备选周期检查"""
    while True:
        time.sleep(300)  # 5 分钟
        try:
            check_and_repair()
        except Exception as e:
            log.error(f'Periodic check error: {e}')


def main():
    log.info('=== Guard v3.0 started ===')

    # 启动时立即检查一次
    try:
        check_and_repair()
    except Exception as e:
        log.error(f'Initial check error: {e}')

    # 启动文件监听线程（实时响应）
    watcher_thread = threading.Thread(target=watch_asar_file, daemon=True)
    watcher_thread.start()

    # 启动实时 CDP Token 同步线程
    sync_thread = threading.Thread(target=live_sync_worker, daemon=True)
    sync_thread.start()

    # 主线程执行周期检查（兜底）
    periodic_check()


if __name__ == '__main__':
    main()
