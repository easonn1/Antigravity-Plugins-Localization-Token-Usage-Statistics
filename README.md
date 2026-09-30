# ⚡ Antigravity 插件增强套件 (Antigravity Plugins Suite)
### 深度中文汉化 · 上下文 Token 实时统计 · 用量智脑大盘分析

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](#)
[![Python: 3.8+](https://img.shields.io/badge/Python-3.8+-3776AB.svg)](#)
[![Node.js: 18+](https://img.shields.io/badge/Node.js-18+-339933.svg)](#)
[![Antigravity: Supported](https://img.shields.io/badge/Antigravity-Latest-4285F4.svg)](#)

专为 **Google Antigravity** 桌面客户端打造的一站式终极增强套件。只需双击运行一键安装，即可同时激活 **全局深度中文汉化**、**上下文 Token 实时显示** 以及 **Token 用量智脑大盘统计** 三大核心模块！

---

## 🌟 三大核心功能

### 1. 🌐 全局深度中文汉化 (Chinese Localization)
- **100% 覆盖**：覆盖 Antigravity 客户端菜单栏、设置面板、侧边栏、快捷键一览、智能体对话提示等。
- **命令面板排版修复 (Fastpick)**：针对官方快捷命令面板（Fastpick）存在的样式换行 Bug 进行了修复，解决“命令”二字竖排折行错位问题，恢复优雅平整的横向排版，并翻译了 60+ 项内置快捷命令。
- **智能动态监听**：基于 DOM Mutation 深度优化，动态加载的新建会话、对话流、工具卡片均实现毫秒级自适应翻译。

### 2. ⚡ 上下文 Token 实时显示与进度条 (Context Token Counter)
- **常驻输入框底部**：清晰直观呈现当前会话的上下文 Token 消耗量与模型最大窗口比例（如 `● 上下文: 15.8k / 1.0M (1.6%)`）。
- **实时热推送 (CDP 引擎)**：后台静默守护进程毫秒级监听底层数据库日志，一旦有新内容生成立即通过 DevTools 协议热推到界面，无需手动刷新。
- **便捷回溯**：点击徽章即可一键复制当前会话的底层日志绝对路径，排查问题更高效。

### 3. 📊 Token 用量智脑大盘分析 (Usage Intelligence)
- **客户端内原生徽章**：输入框旁常驻 `📊用量智脑` 快捷按钮，点击即可呼出暗黑毛玻璃悬浮看板。
- **7 大关键指标卡 (KPI)**：总 Token 处理量、输入/输出 Token 分布、Prompt 上下文缓存命中量、缓存节省率、深度思考 Reasoning Token 用量、工具调用总次数与成功率。
- **丰富的数据可视化**：
  - **每日消耗趋势柱状图**：按输入、缓存复用、生成输出、思考推理 4 色堆叠展示。
  - **24 小时活跃作息分布图**：直观展示您与智能体协作的高峰时段分布。
  - **前沿模型份额占比**：Claude Opus、Claude Sonnet、Gemini 3.8/3.7 Flash 等多模型配额与思考 Token 消耗占比。
  - **智能体活跃打卡热力图**：GitHub 风格的年度打卡点阵图，记录连续编码天数与历史最高连击。
- **独立浏览器完整大屏**：一键在 Chrome/Edge 浏览器中打开全屏沉浸式仪表盘（`dashboard.html`），支持按今日/昨日/近7天/近30天/全部历史筛选，支持一键复制 Markdown 周报、导出 CSV 表格或 JSON 报表。

---

## 🚀 一键全量部署（极简安装，绝不出错）

本套件经过严格的跨平台与环境适配测试，提供全自动化的防呆安装器，零命令行门槛。

### 📋 前置要求
1. **Windows 10 / 11** 操作系统
2. 已安装 [Node.js](https://nodejs.org/) (推荐 LTS 18 或 20+)
3. 已安装 [Python](https://www.python.org/) 3.8+ (安装时请务必勾选 `Add Python to PATH`)

> ⚠️ **必须先解压再运行**：不要直接在 WinRAR / 7-Zip 压缩包里双击 `.bat`。
> 预览模式只会释放脚本本身，`manager\` 目录并不存在，安装必然失败。
> 另：新装完 Node.js / Python 后请**关闭原窗口重新双击**，旧窗口读不到刷新后的 PATH。

### ⚡ 部署步骤
1. **下载或克隆本仓库**：
   ```bash
   git clone https://github.com/easonn1/Antigravity-Plugins-Localization-Token-Usage-Statistics.git
   ```
2. **一键全量安装**：
   - 直接双击仓库根目录下的 **`一键全量部署(汉化+Token+用量大盘).bat`**（或执行 `install.bat`）。
3. **全自动执行流 (7步闭环)**：
   - `[1/7]` 自动检测 Node.js、Python 及 Antigravity 安装路径；
   - `[2/7]` 自动安全关闭正在运行的 Antigravity 客户端（防止文件占用锁死）；
   - `[3/7]` 自动创建官方原版备份（`app.asar.bak`），保障随时可一秒完整回退；
   - `[4/7]` 自动部署三大插件核心与管理引擎至用户系统目录；
   - `[5/7]` 调用底层 Pure ASAR 补丁引擎完成代码注入与 4 字节 Header 严格对齐重打包；
   - `[6/7]` 首次自动运行数据采集器，初始化专属于您的本地真实看板数据；
   - `[7/7]` 安装 Windows 开机静默防失效守护（全流程 0 控制台黑框弹窗），并启动 Antigravity！

---

## 🛠️ 管理与卸载

| 快捷入口 | 功能说明 |
| :--- | :--- |
| **`一键全量部署(汉化+Token+用量大盘).bat`** | 一键自动完成三大功能全量安装、打补丁与自启守护配置 |
| **`启动插件管理中心.bat`** | 打开可视化管理窗口 (Tkinter)，自由启用/禁用各插件 |
| **`一键恢复官方原版.bat`** | 一键从官方备份 (`app.asar.bak`) 秒级还原，完全卸载补丁与自启 |
| **`install.bat` / `uninstall.bat`** | 命令行英文别名快捷入口，便于脚本批量调用 |

---

## 📁 仓库文件结构

```text
Antigravity-Plugins-Localization-Token-Usage-Statistics/
├── 一键全量部署(汉化+Token+用量大盘).bat    # ★ 推荐：一键安装全部功能
├── 启动插件管理中心.bat                   # 可视化插件开关与管理控制台
├── 一键恢复官方原版.bat                   # ★ 秒级无损还原官方原生版本
├── install.bat                          # 英文别名一键安装脚本
├── uninstall.bat                        # 英文别名一键卸载脚本
├── Antigravity-Plugin-Manager.py         # 图形化插件管理器源码 (GUI)
├── plugins/                             # 三大插件核心包
│   ├── 01-chinese-localization.js       # 核心 1：深度中文汉化与 Fastpick 横排排版
│   ├── 02-context-token-counter.js      # 核心 2：上下文 Token 实时显示与进度条
│   ├── 03-usage-intelligence.js         # 核心 3：用量智脑悬浮看板与大屏前端
│   ├── collector.py                     # 本地会话数据库高精度遥测采集引擎
│   ├── dashboard.html                   # 独立沉浸式 Web 仪表盘模板 (全中文)
│   ├── plugins.json                     # 插件注册与配置表
│   └── _template-plugin.js              # 自定义插件开发模板
└── manager/                             # 底层补丁与防更新守护系统
    ├── install.py                       # 高稳定性自动化部署核心驱动
    ├── uninstall.py                     # 安全回退与反安装核心驱动
    ├── patch_engine.js                  # Pure ASAR 打包与底层 IPC 挂载引擎
    ├── auto_patch_guard.py              # 后台静默守护进程 (防更新失效 + CDP 实时推送)
    └── AntigravityPluginGuard.vbs       # 开机静默启动引导 (0 黑框)
```

---

## 🤝 开源致敬与来源说明 (Attribution & Credits)

本项目中的 **Token 用量智脑大盘 (Usage Intelligence)** 模块，其数据遥测理念与大屏可视化设计源自优秀的开源项目：

- 📌 **原始项目**：[antigravity-usage-intelligence](https://github.com/Nir-Bhay/antigravity-usage-intelligence)
- 👤 **原始作者**：**Nirbhay Hiwse** ([@Nir-Bhay](https://github.com/Nir-Bhay))
- 📜 **开源协议**：[MIT License](https://github.com/Nir-Bhay/antigravity-usage-intelligence/blob/main/LICENSE)

### 本项目所做的深度二次研发与原生适配：
1. **脱离 VS Code 限制，原生嵌入 Electron 桌面端**：
   原始项目为 VS Code 扩展（`.vsix`）。本项目通过逆向工程将其核心遥测算法与前端面板重构为 Antigravity Electron 桌面客户端的原生内置插件（`03-usage-intelligence.js`），支持在主界面输入框旁一键呼出悬浮弹窗与全屏大屏，零 VS Code 外部依赖。
2. **100% 深度中文本地化**：
   将全部 7 大 KPI 指标、每日趋势堆叠图、作息分布、模型配额与打卡热力图等所有英文文本、图例、Tooltip 进行全面中文润色与本地化适配。
3. **攻克 Chromium 严格沙盒与 Pure ASAR Header 打包**：
   解决了 Electron 沙盒环境下原生模块拦截问题，通过主进程 IPC 异步解耦，并自研了 4 字节严格对齐的 Pure ASAR 归档引擎，杜绝重打包语法报错与客户端崩溃风险。

特此向原作者 **Nirbhay Hiwse** 的开创性工作致以崇高的敬意与感谢！

---

## ❓ 常见问题 (FAQ)

<details>
<summary><b>Q1: 软件更新后，汉化和 Token 统计会不会失效？</b></summary>

**完全不用担心！**
安装程序已将开机守护脚本（`AntigravityPluginGuard.vbs`）部署至系统自启项中。在后台，守护引擎会静默监控 Antigravity 版本文件变动。一旦官方发生自动覆盖更新，守护引擎会在后台自动重新打入增强补丁，全程全静默无感，无需用户再次手动重装。
</details>

<details>
<summary><b>Q2: 运行过程中会不会时不时跳出黑色 CMD 命令行黑框？</b></summary>

**绝对不会！**
本项目的所有子进程调用（包含 Node 打包、Python 数据采集、守护轮询）均显式声明了 `CREATE_NO_WINDOW` 与 `windowsHide: true`，开机通过轻量 VBS 脚本隐蔽引导，实现 100% 纯净无黑框运行。

> 补充：`node.exe` 现在不再只依赖 PATH。安装器与开机守护都会自动探测
> `Program Files\nodejs`、nvm-windows、fnm、volta、scoop、chocolatey 以及便携目录，
> 全部找不到时也可以手动粘贴 `node.exe` 路径继续安装。
> 若希望守护进程长期稳定，仍建议把 Node.js 正常加入系统 PATH。
</details>

<details>
<summary><b>Q3: 如果我想彻底恢复官方原版，该怎么操作？</b></summary>

直接双击运行 **`一键恢复官方原版.bat`** 即可。安装时系统会自动创建官方原版的 `app.asar.bak`。恢复工具会一秒将官方备份完整替换回位，并清理自启动项，不残留任何修改。
</details>

<details>
<summary><b>Q4: 在别人电脑上一闪而过，报 “'xxx' 不是内部或外部命令 / 系统找不到指定的路径” 还带乱码？</b></summary>

**这是启动脚本的文件编码问题，与 Node.js 无关。**
`.bat` 是 UTF-8 且内含中文时，脚本里那句 `chcp 65001` 会在 cmd.exe 自己读取批处理文件的中途切换控制台代码页，
导致 cmd 的字节偏移错位、从半行开始执行，于是出现 `'cho'`、`'neq'`、`'噺部署'` 这类“不是内部或外部命令”。

本仓库的启动脚本已重构为**纯 ASCII**：所有中文提示改由 Python 输出（Python 端使用 UTF-8 并跟随 `chcp 65001` 正常显示），
批处理本身不再含有任何非 ASCII 字节，因此在 GBK(936)、UTF-8(65001) 两种控制台代码页下都能稳定运行。
如果你是自行改脚本，请遵守：**不要往 `.bat` 里写中文**。
</details>

<details>
<summary><b>Q5: 提示“未检测到 Node.js”，但本机其实装了 Node？</b></summary>

常见三种原因：
1. Node 装在 nvm / fnm / volta / scoop / 便携目录，PATH 里没有 `node.exe`（新版本安装器已支持自动探测与手动指定路径）；
2. 安装 Node 之前就已经打开了脚本窗口 —— PATH 广播只对新进程生效，**关掉重新双击**；
3. 以**管理员身份**运行时用的是管理员账号的环境变量，普通用户装的 Node 可能看不见。

另外，若 Antigravity 安装在 `C:\Program Files\`，写入 `app.asar` 必须管理员权限；
安装器现在会在环境检查阶段直接做写权限探测并明确提示，而不是等到备份那一步才失败。
</details>

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 许可证开源发布。
