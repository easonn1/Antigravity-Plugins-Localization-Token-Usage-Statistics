# ⚡ Antigravity 插件增强套件 (Antigravity Plugins Suite)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](#)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg)](#)
[![Node.js: 18+](https://img.shields.io/badge/Node.js-18+-339933.svg)](#)

专为 **Google Antigravity** 打造的深度汉化、上下文 Token 实时统计徽标及插件化拓展套件。

---

## 🌟 核心特性

- 🌐 **深度中文汉化 (Chinese Localization)**
  - 全面覆盖菜单栏、设置面板、快捷键一览、快捷命令面板（Fastpick）、智能体交互提示等。
  - 智能修复命令面板“命令”按钮竖排折行问题，完美恢复横排优雅展示。
  - 动态监听 DOM 变化，异步加载内容秒级自适应翻译。
- 📊 **上下文 Token 实时统计徽标 (Context Token Counter)**
  - 位于输入框右下角，清晰显示当前对话 Token 实际消耗量与上限模型比例（如 `上下文: 156.9k / 1.0M`）。
  - 双重同步架构：支持底层真实日志逐行高精度统计 + CDP WebSocket 秒级热推。
  - 点击徽章可一键复制当前活跃日志绝对路径，便于回溯调试。
- 🛡️ **双重防丢与守护机制 (Smart Patch & Guard)**
  - 自动备份官方原版 `app.asar.bak`。
  - 内置无感后台守护引擎（`auto_patch_guard.py`），实时监听官方版本更新并自动平滑补丁，绝不损坏原版文件。
  - 全流程系统调用启用隐藏窗体，0 弹框、0 闪退、100% 纯静默。
- 🧩 **高度模块化与热插拔 (Modular Extensible)**
  - 支持放入自定义 `.js` 脚本即可热加载第三方插件。

---

## 📁 目录结构

```text
antigravity-plugins/
├── 启动插件管理中心.bat            # 图形化管理面板入口
├── 一键安全注入(内存生效).bat       # 纯内存 CDP 注入（软件已在运行时推荐）
├── 智能启动与汉化.bat              # 后台静默启动软件并自动注入
├── 一键恢复官方原版.bat             # 一秒回退为官方纯净版
├── Antigravity-Plugin-Manager.py  # 图形化管理工具 (Tkinter)
├── plugins/
│   ├── 01-chinese-localization.js # 深度汉化插件核心
│   ├── 02-context-token-counter.js# 上下文 Token 实时统计插件
│   ├── 03-usage-intelligence.js   # 用量智脑大盘插件
│   ├── collector.py               # 本地用量遥测采集器
│   ├── plugins.json               # 插件列表与启用配置
│   └── _template-plugin.js        # 插件开发参考模板
└── manager/
    ├── patch_engine.js            # Node 注入与打包引擎 (含原生菜单与 asar 重打包)
    ├── auto_patch_guard.py        # 后台守护进程 (防更新失效 + CDP 实时推送)
    └── AntigravityPluginGuard.vbs # 开机静默后台常驻脚本
```

---

## 🚀 快速上手

### 方式 1：软件已打开时，一键注入（最推荐，零风险）
在 Antigravity 正在运行时，双击运行 **`一键安全注入(内存生效).bat`** 即可！
- 采用 **Chrome DevTools Protocol (CDP)** 内存级安全注入。
- 零修改磁盘文件，无需重启软件，窗口瞬间生效。

### 方式 2：图形化插件管理面板
双击运行 **`启动插件管理中心.bat`**：
- 可视化勾选或禁用任一插件；
- 支持一键注入、一键启动、一键打补丁、以及打开插件目录放入新插件。

### 方式 3：永久内嵌与自动守护（官方更新不失效）
1. 双击运行 `manager/patch_engine.js` 或通过管理中心点击【深度打入补丁】；
2. 将 `manager/AntigravityPluginGuard.vbs` 快捷方式放入 Windows 开机自启文件夹（`shell:startup`），即可实现开机全静默自动守护。

---

## 🛠️ 一键卸载与安全回退

若需要恢复官方纯净状态：
- 双击运行 **`一键恢复官方原版.bat`**，即可一键替换还原为官方纯净版 `app.asar`，干净彻底。

---

## 📄 开源许可

本项目基于 [MIT License](LICENSE) 开源发布。
