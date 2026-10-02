# 更新日志

## v1.1.3 - 补丁失败不再能把 Antigravity 变砖

2026-10-01 事故复盘：一位用户的 Antigravity 突然"双击完全没反应、也不写任何日志"。查下来是
官方 `autoUpdater` 静默 `quitAndInstall` 升到 2.18.1，守护脚本 8 秒后自动重打补丁，写出了一个
**整体错位 3 字节**的 `app.asar`（`package.json` 开头多出 `42 60 82`，JSON 解析失败；755 个文件
全是语法错误；293 个 `unpacked` 条目丢失）。

关键点在于：**对齐和 unpacked 这两个 bug 在 v1.1.1 就已经修好了**，但那台机器
`~\.gemini\antigravity\manager\patch_engine.js` 还是 9/26 的旧版——修复合进了仓库，却没有再部署。
而守护脚本日志里那句 `Verification PASSED` 只检查"文件在不在"，不检查"包能不能启动"，
于是垃圾包被判定为成功，直接把 IDE 写死了。

本次改动：

- **部署前完整性闸门** `verifyArchive()`：打包完立刻把 `app.asar` 回读，与源树**逐字节比对**
  （含 `unpacked` 侧车文件），并检查 header 可解析、`package.json` 可解析、`main` 入口存在、
  内容不越界、`.js` 开头不是垃圾字节。`applyPatch()` 在**部署前**和**部署后**各跑一次，
  任何一次不过就拒绝落盘并以非零码退出——已验证能拦住 10/1 那个真实坏包。
- **新增体检命令** `node patch_engine.js verify`：不依赖源树，直接判断当前装着的 `app.asar`
  是否结构完好、能否启动；`restore` 现在也会校验恢复结果。
- **守护脚本失败即回滚**：`check_and_repair()` 打完补丁后调用真校验，不过就把官方
  `app.asar.bak` 放回去并删除 `resources/app`。策略是**宁可暂时丢掉汉化插件，也绝不让 IDE 起不来**。
- 部署环节提醒：修复只有进仓库是不够的，必须重新运行安装器（或"一键全量部署"）把
  `manager/` 同步到 `~\.gemini\antigravity\manager`，否则机器上跑的还是旧引擎。

## v1.1.2 - 修复"用量与配额智脑"在无系统 Python 的机器上采集受阻

全新机器（只装了 `AntigravityPlugins-Setup.exe`、没有单独安装 Python）打开用量大盘时报
`用量数据采集受阻 / spawn python ENOENT`。原因是注入到 Antigravity 主进程的采集逻辑只会
`spawn('python')`：候选列表里的裸命令名（`python` / `py`）因为不含路径分隔符而永远不会被选中，
最终回落到默认值 `'python'`，而没有系统 Python 时它就 ENOENT。

修复：

- **解释器解析重写**：先查环境变量 `ANTIGRAVITY_PYTHON`，再扫常见安装目录（Program Files /
  `%LOCALAPPDATA%\Programs\Python` 的 3.10–3.13），然后**真正执行** `python / python3 / py --version`
  去探测 PATH（`existsSync` 看不到 PATH 里的命令），最后回落到安装器随包的冻结 dispatcher
  （`%LOCALAPPDATA%\AntigravityPlugins\bin\AntigravityPlugins.exe`，以 `[exe, 脚本.py, 参数]` 形式
  用内置解释器跑 collector.py）。都找不到时给出可读的中文提示，而不是裸 ENOENT。
- **dispatcher 透传时保持 stdout 干净**：`--collect` / `<脚本.py>` 透传模式下，子脚本的 stdout 就是
  数据载荷（collector.py 的 JSON），因此 `[runtime] …` 等诊断信息改走 stderr，避免污染 JSON 导致
  前端 `JSON.parse` 失败。

## v1.1.1 - 修复 Antigravity 2.18.1 打补丁后无法启动

新装到 2.18.1 的机器（例如刚下载官方安装包的全新虚拟机）点"一键全量部署"后 Antigravity 直接起不来，
根因是补丁引擎的两个假设在 2.18.1 上同时失效：

- **asar 数据区未做 4 字节对齐**：引擎用 `16 + headerSize` 作为文件数据起点，而 asar 规范会把数据区
  对齐到 4 字节。2.17.0 的 header 长度刚好是 4 的倍数所以看起来正常；2.18.1 的 header 是 276013 字节，
  于是**每个解出来的文件都提前 3 个字节**，`dist/menu.js` 开头变成上一个文件残留的 `);`，
  重新打包后整个包都是语法错误，主进程直接崩掉（现象：双击完全没反应、也不打印任何日志）。
- **`unpacked` 条目被静默丢弃**：2.18.1 开始把 `chrome-devtools-mcp` 等 293 个文件放在
  `app.asar.unpacked/` 里，这些条目没有 `offset` 字段，旧解包逻辑只处理有 `offset` 的条目，
  于是这 293 个文件既没进 `resources/app`，也没进重新打包的 asar（包体从 21.2 MB 掉到 4.47 MB），
  `require()` 找不到模块同样导致启动失败。

修复后在 2.18.1 上实测：解出的 JS 全部通过 `node --check`，asar 条目 1048 → 1048 无丢失，
包体 21.2 MB → 21.3 MB（只增长注入代码），且原版 / 旧引擎 / 新引擎三种状态的实际启动结果符合预期。

## v1.1.0 - 免依赖安装包 `AntigravityPlugins-Setup.exe`

### 新增
- **一键安装包**：内置便携版 Node.js v24.21.0（官方 zip，SHA256 校验后抽取）与冻结的 Python 运行时，
  对方机器上**不需要再安装 Node.js 或 Python**，也不会再有"未检测到 Node.js 环境"。
- 安装向导（per-user，无需管理员权限）：自定义目录、桌面/开始菜单快捷方式、
  开机静默守护、安装完成即自动部署。
- `设置 - 应用` 中的正式卸载项；`AntigravityPlugins.exe --uninstall` 会询问是否同时恢复官方原版，
  并在进程退出后清理安装目录。
- 单一入口 `AntigravityPlugins.exe`：`--deploy / --restore / --gui / --guard / --collect / --uninstall`，
  GUI 与守护进程启动时自动隐藏控制台窗口。
- 随包生成纯 ASCII 的 `.bat` 入口，供习惯命令行的用户使用。
- `packaging/build.py`（构建）与 `packaging/sandbox_test.py`（沙箱端到端自检，不会碰真实安装目录）。

### 修复
- **启动脚本自毁**：`.bat` 为 UTF-8 且内含中文时，脚本内的 `chcp 65001` 会让 cmd.exe 自己的批处理读取偏移错位，
  从半行开始执行，表现为 `'cho' / 'neq' / '噺部署' 不是内部或外部命令`、`系统找不到指定的路径。`。
  全部启动脚本重写为纯 ASCII，中文提示统一由 Python 输出。
- **ZIP 与 clone 字节不一致**：`core.autocrlf` 只影响 `git clone`，GitHub 的"下载 ZIP"直接给出仓库内字节，
  于是下载者拿到 LF-only 的批处理。新增 `.gitattributes`，对 `*.bat/*.cmd/*.vbs/*.ps1` 使用 `-text`，
  保证 clone 与 ZIP 完全一致。
- **Node 只从 PATH 查找**（共 8 处，含开机守护）：nvm / fnm / volta / scoop / chocolatey / 便携版布局一律失败，
  且开机守护静默不工作。新增带缓存的 `find_node()`，支持 `ANTIGRAVITY_NODE` 覆盖与手动指定路径，
  并用 `CREATE_NO_WINDOW` 避免 `pythonw` 弹出黑框。
- **`pythonw` 路径硬编码**：开机脚本写死 `C:\Program Files\Python312\pythonw.exe`，
  其他 Python 版本的机器上守护从未启动、汉化在软件自动更新后失效。守护脚本改为按本机实际解释器生成。
- **`install.py` 缺 `import re`**：第 6 步大盘数据注入被裸 `except` 吞掉，统计从未真正写入看板。
- **含空格安装目录被截断**：`%PY% "..."` 未加引号，`C:\Program Files\Python312\python.exe` 会被当作执行 `C:\Program`。
- 程序文件区（Program Files）安装时在环境检查阶段就做写权限探测，不再等到备份步骤才报 PermissionError。
- 压缩包预览窗口里直接双击 `.bat` 时给出明确提示（先解压再运行），而不是模糊的路径错误。
- node 子进程输出统一按 UTF-8 解码，避免守护在 cp936 控制台下解码中文报错。
- 无人值守：`--yes` / 非终端 stdout 时自动确认，安装器不会再卡在 `input()` 上抛 EOFError。
