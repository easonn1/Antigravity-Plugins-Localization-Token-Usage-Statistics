# -*- coding: utf-8 -*-
"""
Build the no-dependency Windows package.

  stage/                        payload + portable node.exe (downloaded, sha256-checked)
  dist/AntigravityPlugins/      onedir app: frozen Python + suite sources
  dist/AntigravityPlugins-Setup.exe   onefile installer carrying the tree above + node.exe

Usage:
  python packaging/build.py                # full build (downloads Node if missing)
  python packaging/build.py --app-only     # only the onedir app
  python packaging/build.py --node <path>  # reuse a local node.exe instead of downloading
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
STAGE = REPO / "stage"
DIST = REPO / "dist"
BUILD = REPO / "build"
PRODUCT = "AntigravityPlugins"
VERSION = "1.1.1"
NODE_VERSION = "v24.21.0"          # latest LTS ("Krypton") line at build time
NODE_BASE = "https://nodejs.org/dist/%s" % NODE_VERSION
NODE_ZIP = "node-%s-win-x64.zip" % NODE_VERSION

# the suite sources run as data files, so PyInstaller cannot see their imports;
# without this list frozen builds die with ModuleNotFoundError at runtime.
HIDDEN_IMPORTS = [
    "ctypes", "ctypes.wintypes", "winreg", "tkinter", "tkinter.ttk", "tkinter.messagebox",
    "tkinter.filedialog", "sqlite3", "socket", "struct", "subprocess", "threading",
    "queue", "logging", "logging.handlers", "urllib", "urllib.request", "urllib.parse",
    "json", "glob", "shutil", "pathlib", "datetime", "base64", "hashlib", "uuid",
    "contextlib", "traceback", "time", "re", "runpy", "math", "statistics", "collections",
    "aglaunch", "aginstaller",
]


def run(cmd, cwd=None):
    print("+ " + " ".join(str(c) for c in cmd))
    t0 = time.time()
    p = subprocess.run([str(c) for c in cmd], cwd=cwd, stdout=subprocess.PIPE,
                       stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
    tail = "\n".join((p.stdout or "").splitlines()[-25:])
    print(tail)
    print("  [%.0fs] rc=%s" % (time.time() - t0, p.returncode))
    if p.returncode != 0:
        raise SystemExit("build step failed: %s" % " ".join(map(str, cmd[:4])))
    return p


def sha256(path, block=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(block)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def fetch(url, dest):
    print("downloading %s" % url)
    req = urllib.request.Request(url, headers={"User-Agent": "antigravity-plugins-build"})
    with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as f:
        total = int(r.headers.get("Content-Length", "0"))
        got = 0
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
            got += len(chunk)
            if total:
                print("\r  %5.1f%%" % (got * 100.0 / total), end="")
        print()


def node_expected_sha(zip_path):
    """Verify against the published SHASUMS256.txt instead of trusting the download."""
    sums = zip_path.parent / "SHASUMS256.txt"
    if not sums.exists():
        fetch(NODE_BASE + "/SHASUMS256.txt", sums)
    want = None
    for line in sums.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.strip().endswith(NODE_ZIP):
            want = line.split()[0].lower()
            break
    if not want:
        raise SystemExit("SHASUMS256.txt has no entry for " + NODE_ZIP)
    return want


def ensure_node(local=None):
    out = STAGE / "node"
    exe = out / "node.exe"
    if exe.exists():
        print("node.exe already staged: %s" % exe)
        return out
    out.mkdir(parents=True, exist_ok=True)
    if local:
        shutil.copy2(local, str(exe))
        print("using local node.exe: %s (%s)" % (local, exe))
        return out
    zip_path = STAGE / NODE_ZIP
    if not zip_path.exists():
        fetch("%s/%s" % (NODE_BASE, NODE_ZIP), zip_path)
    want = node_expected_sha(zip_path)
    got = sha256(zip_path)
    if got != want:
        raise SystemExit("SHA256 mismatch for %s\n  expected %s\n  got      %s" % (NODE_ZIP, want, got))
    print("SHA256 verified: %s" % got)
    with zipfile.ZipFile(str(zip_path)) as z:
        root = NODE_ZIP[:-4]
        for name in ("node.exe", "LICENSE"):
            member = "%s/%s" % (root, name)
            if member in z.namelist():
                with z.open(member) as src, open(str(out / name), "wb") as dst:
                    shutil.copyfileobj(src, dst)
            else:
                raise SystemExit("member missing in archive: " + member)
    shutil.rmtree(str(STAGE / root), ignore_errors=True)
    if not exe.exists():
        raise SystemExit("node.exe not found after extraction")
    return out


def stage_payload():
    p = STAGE / "payload"
    if p.exists():
        shutil.rmtree(str(p))
    for sub in ("manager", "plugins"):
        src = REPO / sub
        dst = p / sub
        dst.mkdir(parents=True, exist_ok=True)
        for f in sorted(src.iterdir()):
            if f.is_file() and f.suffix in (".py", ".js", ".json", ".html", ".vbs", ".md", ".txt"):
                shutil.copy2(str(f), str(dst / f.name))
    count = len(list(p.rglob("*")))
    print("payload staged: %d files" % count)
    return p


def pyinstaller(args):
    cmd = [sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean"] + args
    run(cmd, cwd=str(REPO))


def build_app():
    app_dist = DIST / PRODUCT
    if app_dist.exists():
        shutil.rmtree(str(app_dist))
    hidden = []
    for m in HIDDEN_IMPORTS:
        hidden += ["--hidden-import", m]
    pyinstaller([
        "--name", PRODUCT,
        "--onedir",
        "--console",
        "--paths", str(REPO / "packaging"),
        "--add-data", "%s;payload" % (STAGE / "payload"),
        "--distpath", str(DIST),
        "--workpath", str(BUILD / "app"),
        "--specpath", str(BUILD / "app"),
        str(REPO / "packaging" / "aglaunch.py"),
    ] + hidden)
    exe = app_dist / (PRODUCT + ".exe")
    if not exe.exists():
        raise SystemExit("app exe missing: " + str(exe))
    return app_dist


def build_setup(app_dist, node_dir):
    hidden = []
    for m in HIDDEN_IMPORTS:
        hidden += ["--hidden-import", m]
    pyinstaller([
        "--name", "%s-Setup" % PRODUCT,
        "--onefile",
        "--console",
        "--paths", str(REPO / "packaging"),
        "--add-data", "%s;tree" % app_dist,
        "--add-data", "%s;runtime" % node_dir,
        "--distpath", str(DIST),
        "--workpath", str(BUILD / "setup"),
        "--specpath", str(BUILD / "setup"),
        "--contents-directory", "_internal",
        str(REPO / "packaging" / "aginstaller.py"),
    ] + hidden)
    setup_exe = DIST / ("%s-Setup.exe" % PRODUCT)
    if not setup_exe.exists():
        raise SystemExit("setup exe missing: " + str(setup_exe))
    return setup_exe


def portable_zip(app_dist, node_dir):
    """A zip of the same tree for people who would rather not run an installer."""
    sys.path.insert(0, str(REPO / "packaging"))
    import aginstaller
    root = STAGE / "portable" / PRODUCT
    if root.exists():
        shutil.rmtree(str(root.parent))
    shutil.copytree(str(app_dist), str(root / "bin"))
    shutil.copytree(str(node_dir), str(root / "runtime"))
    aginstaller.write_launchers(root)          # ASCII .bat entry points, no Python needed
    (root / "README-portable.txt").write_bytes((
        "Antigravity Plugins Suite - portable build\r\n"
        "Run bin\\AntigravityPlugins.exe --deploy  (or the .bat entry points).\r\n"
        "Nothing has to be installed: Python and Node.js are bundled.\r\n"
        "Uninstall: bin\\AntigravityPlugins.exe --uninstall\r\n").encode("ascii"))
    zpath = DIST / ("%s-%s-portable-win-x64.zip" % (PRODUCT, VERSION))
    with zipfile.ZipFile(str(zpath), "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in sorted(root.rglob("*")):
            if p.is_file():
                z.write(str(p), str(Path("AntigravityPlugins") / p.relative_to(root)))
    return zpath


def report(files):
    print("\n" + "=" * 72)
    print("artifacts (%s %s)" % (PRODUCT, VERSION))
    print("=" * 72)
    for f in files:
        if f and f.exists():
            print("%-46s %8.1f MB  sha256=%s" % (f.name, f.stat().st_size / 1048576.0, sha256(f)))
    print("=" * 72)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app-only", action="store_true")
    ap.add_argument("--node", help="path to a node.exe to reuse instead of downloading")
    ap.add_argument("--skip-portable", action="store_true")
    a = ap.parse_args()

    REPO.mkdir(exist_ok=True)
    STAGE.mkdir(exist_ok=True)
    stage_payload()
    node_dir = ensure_node(a.node)
    app_dist = build_app()
    out = [app_dist / (PRODUCT + ".exe")]
    if not a.app_only:
        out.append(build_setup(app_dist, node_dir))
        if not a.skip_portable:
            out.append(portable_zip(app_dist, node_dir))
    report([f for f in out if f])
    print("\nnext: python packaging/build.py --app-only for a quick rebuild of the app tree only")


if __name__ == "__main__":
    main()
