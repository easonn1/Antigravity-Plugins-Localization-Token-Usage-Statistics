# 更新日志

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
