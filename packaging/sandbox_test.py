# -*- coding: utf-8 -*-
"""
End-to-end sandbox test for the packaged build - it never touches a real install.

Everything the suite writes is redirected into a throwaway directory by overriding
USERPROFILE / APPDATA / LOCALAPPDATA, and Antigravity's own folder is replaced by a
copy of app.asar pointed at through ANTIGRAVITY_RESOURCES. That lets us prove the
deploy -> inject -> restore -> uninstall loop before shipping it.

  python packaging/sandbox_test.py [--exe dist/AntigravityPlugins/AntigravityPlugins.exe]
                                   [--asar <path to a real app.asar to copy>]
                                   [--keep]        keep the sandbox for inspection
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
SANDBOX = REPO / ".sandbox"

checks = []


def check(name, ok, detail=""):
    checks.append((name, bool(ok), detail))
    print("  [%s] %s%s" % ("PASS" if ok else "FAIL", name, ("  - " + detail) if detail and not ok else ""))
    return ok


def run(exe, args, env, timeout=600):
    t0 = time.time()
    p = subprocess.run([str(exe)] + args, cwd=str(Path(exe).parent.parent), env=env,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       text=True, encoding="utf-8", errors="replace", timeout=timeout)
    return p, time.time() - t0


def kill_leftovers(exe_name):
    if os.name != "nt":
        return
    subprocess.run(["taskkill", "/F", "/IM", exe_name], capture_output=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--exe", default=str(REPO / "dist" / "AntigravityPlugins" / "AntigravityPlugins.exe"))
    ap.add_argument("--asar", default=str(Path.home() / "AppData/Local/Programs/antigravity/resources/app.asar"))
    ap.add_argument("--keep", action="store_true")
    a = ap.parse_args()

    exe = Path(a.exe).resolve()
    if not exe.exists():
        raise SystemExit("build first: python packaging/build.py  (missing %s)" % exe)

    if SANDBOX.exists():
        kill_leftovers(exe.name)
        shutil.rmtree(str(SANDBOX), ignore_errors=True)
    home = SANDBOX / "home"
    ag = SANDBOX / "antigravity" / "resources"
    (home / "AppData" / "Roaming").mkdir(parents=True)
    (home / "AppData" / "Local").mkdir(parents=True)
    ag.mkdir(parents=True)
    # Windows always has this folder; install.py writes the autostart entry into it
    (home / "AppData" / "Roaming" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup").mkdir(parents=True)
    src_asar = Path(a.asar)
    if src_asar.exists():
        shutil.copy2(str(src_asar), str(ag / "app.asar"))
    else:
        (ag / "app.asar").write_bytes(b'{"placeholder":true}')
        print("[note] no real app.asar available, using a placeholder - patch step may warn")

    env = dict(os.environ)
    env.update({
        "USERPROFILE": str(home),
        "HOME": str(home),
        "APPDATA": str(home / "AppData" / "Roaming"),
        "LOCALAPPDATA": str(home / "AppData" / "Local"),
        "ANTIGRAVITY_RESOURCES": str(ag),
        "PYTHONIOENCODING": "utf-8",
        "AG_NO_DAEMON": "1",
    })

    print("=" * 72)
    print("1) deploy  (bundled runtime, no Node/Python from the host)")
    print("=" * 72)
    p, dt = run(exe, ["--deploy", "--yes", "--no-daemon"], env)
    out = p.stdout or ""
    print("\n".join(out.splitlines()[-30:]))
    check("deploy exit code 0", p.returncode == 0, "rc=%s" % p.returncode)
    check("no 'Node.js not detected' false negative", "未检测到 Node.js" not in out)
    check("node resolved from the package", "node.exe" in out and "v2" in out)
    check("backup created", (ag / "app.asar.bak").exists())
    check("app.asar rewritten by the injector",
          (ag / "app.asar.bak").exists()
          and (ag / "app.asar").stat().st_size != (ag / "app.asar.bak").stat().st_size)
    check("injector reported success", "底核注入成功" in out or "[OK]" in out)

    plugins = home / ".gemini" / "antigravity" / "plugins"
    mgr = home / ".gemini" / "antigravity" / "manager"
    check("3 plugins deployed", plugins.exists() and len(list(plugins.glob("0*.js"))) == 3, str(plugins))
    check("patch_engine deployed", (mgr / "patch_engine.js").exists())

    vbs = Path(env["APPDATA"]) / "Microsoft/Windows/Start Menu/Programs/Startup/AntigravityPluginGuard.vbs"
    check("startup guard written", vbs.exists(), str(vbs))
    if vbs.exists():
        body = vbs.read_text(encoding="ascii", errors="replace")
        check("startup guard is ASCII only", all(ord(c) < 128 for c in body))
        check("guard points at the bundled exe (no hardcoded pythonw)",
              "AntigravityPlugins.exe" in body and "Python312" not in body, body[:200])

    dash = plugins / "dashboard.html"
    if dash.exists():
        html = dash.read_text(encoding="utf-8", errors="ignore")
        check("dashboard stats injection ran (needs the import re fix)",
              "const statsData = {" in html)

    print("\n" + "=" * 72)
    print("2) restore  (back to official)")
    print("=" * 72)
    p2, dt2 = run(exe, ["--restore", "--yes"], env)
    out2 = p2.stdout or ""
    print("\n".join(out2.splitlines()[-18:]))
    check("restore exit code 0", p2.returncode == 0, "rc=%s" % p2.returncode)
    same = (ag / "app.asar").read_bytes() == (ag / "app.asar.bak").read_bytes()
    check("app.asar identical to the official backup", same)

    print("\n" + "=" * 72)
    print("3) unknown-arg / passthrough regression")
    print("=" * 72)
    p3, _ = run(exe, ["--definitely-not-a-mode"], env, timeout=120)
    check("bad mode returns a non-zero code", p3.returncode != 0, "rc=%s" % p3.returncode)

    kill_leftovers(exe.name)
    if not a.keep:
        shutil.rmtree(str(SANDBOX), ignore_errors=True)
    else:
        print("\nsandbox kept at %s" % SANDBOX)

    passed = sum(1 for _n, ok, _d in checks if ok)
    print("\n" + "=" * 72)
    print("result: %d/%d checks passed" % (passed, len(checks)))
    for n, ok, d in checks:
        if not ok:
            print("   FAILED: %s  %s" % (n, d))
    print("=" * 72)
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
