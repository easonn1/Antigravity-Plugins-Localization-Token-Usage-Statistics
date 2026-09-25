// Antigravity Chinese Localization Engine
(function() {
  const dictionary = {
    // === 命令面板（Fastpick）与快捷指令全量汉化 ===
    "Search for commands...": "搜索命令...",
    "Search for commands": "搜索命令",
    "Collapse All Folders": "折叠所有文件夹",
    "Expand All Folders": "展开所有文件夹",
    "Open Keyboard Shortcuts": "打开键盘快捷键",
    "Next Aux Pane Tab": "下一个辅助面板标签页",
    "Previous Aux Pane Tab": "上一个辅助面板标签页",
    "Download Diagnostics": "下载诊断信息",
    "Toggle Between Light/Dark Themes": "切换浅色/深色主题",
    "Toggle Light/Dark Theme": "切换浅色/深色主题",
    "New Terminal Tab": "新建终端标签页",
    "Split Terminal": "拆分终端",
    "Toggle Terminal": "切换终端面板",
    "Go Back": "后退",
    "Go Forward": "前进",
    "Close Tab": "关闭标签页",
    "Split Conversation Horizontally": "水平拆分对话",
    "Split Conversation Vertically": "垂直拆分对话",
    "New Editor Window": "新建编辑器窗口",
    "Open Conversation History": "打开对话历史",
    "Pin This Conversation": "固定当前对话",
    "Rename This Conversation": "重命名当前对话",
    "Archive This Conversation": "归档当前对话",
    "Copy Conversation Markdown": "复制对话 Markdown",
    "Find in Conversation": "在对话中查找",
    "Open Command Palette": "打开命令面板",
    "Open Project Picker": "打开项目选择器",
    "Antigravity Usage: Open Full Screen Dashboard": "Antigravity 用量：打开全屏仪表盘",
    "Open Full Screen Dashboard": "打开全屏仪表盘",
    "Search files by name": "按名称搜索文件",
    "Search symbols": "搜索符号",
    "Go to Line/Column": "跳转到行/列",
    "Show and Run Commands": "显示并运行命令",
    "Recently Used": "最近使用",
    "All Commands": "所有命令",

    // === 补充：浏览器迁移提示、WSL设置、版本与侧边栏控制 ===
    "Browser settings have moved": "浏览器设置已迁移",
    "Browser settings have moved.": "浏览器设置已迁移。",
    "Browser settings have moved to the Browser section of General settings.": "浏览器设置已移至常规设置中的“浏览器”部分。",
    "Browser settings have moved to the Browser section of General settings": "浏览器设置已移至常规设置中的“浏览器”部分",
    "Go to General settings": "前往常规设置",
    "Go to General settings.": "前往常规设置。",
    "Go to general settings": "前往常规设置",
    "Windows Subsystem for Linux": "Windows 适用 Linux 子系统 (WSL)",
    "Run the app against a Linux environment. Connecting relaunches the app into the selected WSL distro.": "在 Linux 环境中运行应用。连接后将在选定的 WSL 发行版中重新启动应用。",
    "Run the app against a Linux environment.": "在 Linux 环境中运行应用。",
    "Connecting relaunches the app into the selected WSL distro.": "连接后将在选定的 WSL 发行版中重新启动应用。",
    "Run the app against a Linux environment": "在 Linux 环境中运行应用",
    "Connecting relaunches the app into the selected WSL distro": "连接后将在选定的 WSL 发行版中重新启动应用",
    "Connect": "连接",
    "Connected": "已连接",
    "Connecting": "正在连接",
    "Connecting...": "正在连接...",
    "Disconnect": "断开连接",
    "Disconnecting...": "正在断开连接...",
    "Relaunch": "重新启动",
    "Relaunching...": "正在重新启动...",
    "App version": "应用版本",
    "App Version": "应用版本",
    "app version": "应用版本",
    "Show All": "显示全部",
    "Show all": "显示全部",
    "show all": "显示全部",
    "Show Less": "收起全部",
    "Show less": "收起全部",
    "show less": "收起全部",
    "Show More": "显示更多",
    "Show more": "显示更多",
    "Install IDE": "安装 IDE",
    "Install IDE Extension": "安装 IDE 插件",
    "Install Extension": "安装插件",

    // === 2026 增强词条：设置/权限/智能体行为/外观/技能 ===
    "Global Permissions": "全局权限",
    "Global permissions": "全局权限",
    "Global Permissions ": "全局权限 ",
    "Tool Permissions": "工具权限",
    "Tool permissions": "工具权限",
    "Tool Permissions ": "工具权限 ",
    "Plan Review Policy": "计划审查策略",
    "Plan review policy": "计划审查策略",
    "Security Preset": "安全预设",
    "Security preset": "安全预设",
    "Inherit Global": "继承全局",
    "Inherit global": "继承全局",
    "Inherit Global ": "继承全局 ",
    "Controls the actions the agent can take.": "控制智能体可以执行的操作。",
    "Controls the actions the agent can take": "控制智能体可以执行的操作",
    "Modify permissions for file, terminal, and MCP tools.": "修改文件、终端和 MCP 工具的权限。",
    "Modify permissions for file, terminal, and MCP tools": "修改文件、终端和 MCP 工具的权限",
    "Whether the agent asks you to review its documents.": "智能体是否要求您审查其文档。",
    "Whether the agent asks you to review its documents": "智能体是否要求您审查其文档",
    "Type / and select plan to have the agent generate a plan.": "输入 / 并选择 plan 让智能体生成计划。",
    "Type / and select plan to have the agent generate a plan": "输入 / 并选择 plan 让智能体生成计划",
    "Type / and select plan": "输入 / 并选择 plan",
    "to have the agent generate a plan.": "让智能体生成计划。",
    "to have the agent generate a plan": "让智能体生成计划",
    "Type /": "输入 /",
    "Type": "输入",
    "and select": "并选择",
    "select plan": "选择 plan",
    "Modified in": "已修改于",
    "Contrast": "对比度",
    "Strong": "强对比度",
    "High Contrast": "高对比度",
    "Medium Contrast": "中对比度",
    "Low Contrast": "低对比度",
    "Default Contrast": "默认对比度",
    "Learn more about Inherit Global": "了解更多关于继承全局",
    "Learn more about Inherit Global.": "了解更多关于继承全局。",
    "Also includes Global Permissions (when working in this project). Learn more.": "还包括全局权限（当在此项目中工作时）。了解更多。",
    "Also includes Global Permissions (when working in this project).": "还包括全局权限（当在此项目中工作时）。",
    "Also includes Global Permissions": "还包括全局权限",
    "when working in this project.": "（当在此项目中工作时）。",
    "when working in this project": "（当在此项目中工作时）",

    // === 补充词条（菜单/工作区/设置/项目/环境） ===
    "Copy project": "复制项目",
    "Copy Project": "复制项目",
    "Project Settings": "项目设置",
    "Project settings": "项目设置",
    "Archive Environment": "归档环境",
    "Archive environment": "归档环境",
    "Delete Environment": "删除环境",
    "Delete environment": "删除环境",
    "New Environment": "新建环境",
    "New environment": "新建环境",
    "Environment Settings": "环境设置",
    "Environment settings": "环境设置",
    "Copy environment": "复制环境",
    "Copy Environment": "复制环境",
    "Rename Environment": "重命名环境",
    "Rename environment": "重命名环境",
    "Active Environment": "当前环境",
    "Active environment": "当前环境",
    "Default Environment": "默认环境",
    "Default environment": "默认环境",
    "Export project": "导出项目",
    "Export Project": "导出项目",
    "Import project": "导入项目",
    "Import Project": "导入项目",
    "Rename project": "重命名项目",
    "Rename Project": "重命名项目",
    "Delete project": "删除项目",
    "Delete Project": "删除项目",
    "Archive project": "归档项目",
    "Archive Project": "归档项目",
    "Project Details": "项目详情",
    "Project details": "项目详情",
    "Worktrees": "工作区树",
    "Worktree Settings": "工作区树设置",
    "Worktree settings": "工作区树设置",
    "New Conversation in Workspace": "在工作区中新建对话",
    "New conversation in workspace": "在工作区中新建对话",
    "New Conversation in Project": "在项目中新建对话",
    "New conversation in project": "在项目中新建对话",
    "New Conversation": "新建对话",
    "New conversation": "新建对话",
    "Close Conversation": "关闭对话",
    "Close conversation": "关闭对话",
    "Clear Conversation": "清空对话",
    "Clear conversation": "清空对话",
    "Application": "应用",
    "App": "应用",
    "Manage Antigravity app settings.": "管理 Antigravity 应用设置。",
    "Manage Antigravity app settings": "管理 Antigravity 应用设置。",
    "Remote Control": "远程控制",
    "Enable Remote Control": "启用远程控制",
    "Work with local agents from another device.": "从其他设备与本地智能体协同工作。",
    "Work with local agents from another device": "从其他设备与本地智能体协同工作。",
    "Prevent Sleep": "阻止睡眠",
    "Prevent the computer from sleeping while the app is running.": "在应用运行时阻止计算机进入睡眠状态。",
    "Keep In Menu Bar": "保留在系统托盘",
    "The app will be accessible from the menu bar and will keep running in the background when all windows are closed.": "应用将可以从系统托盘访问，并在所有窗口关闭时继续在后台运行。",
    "Keep the app accessible from the menu bar and running in the background when all windows are closed.": "应用将可以从系统托盘访问，并在所有窗口关闭时继续在后台运行。",
    "Notification Settings": "通知设置",
    "To modify notification settings, open your operating system's system preferences.": "要修改通知设置，请打开操作系统的系统偏好设置。",
    "Open System Preferences": "打开系统偏好设置",
    "Select Model": "选择模型",
    "Select model": "选择模型",
    "Select Model Ctrl+/": "选择模型 Ctrl+/",
    "Fast": "快速",
    "fast": "快速",
    "View usage": "查看用量",
    "View Usage": "查看用量",

    // Top Bar & Global Navigation
    "Goals": "目标", "Tasks": "任务", "Artifacts": "工件", "Scratch": "草稿", "Chat": "对话",
    "Active": "进行中", "Inactive": "未激活", "Completed": "已完成", "Failed": "已失败",
    "History": "历史记录", "Settings": "设置", "System": "系统", "Network": "网络",
    "Model": "模型", "Memory": "记忆", "Tools": "工具", "Agents": "智能体",
    "Overview": "概览", "Logs": "日志", "Clear": "清除", "Save": "保存",
    "Cancel": "取消", "Submit": "提交", "Run": "运行", "Stop": "停止",
    "Edit": "编辑", "Delete": "删除", "Add": "添加", "Remove": "移除", "Download": "下载",
    "Monthly Limit": "每月限额", "Weekly Limit": "每周限额", "Five Hour Limit": "五小时限额",
    "Weekly Limit Remaining": "每周限额剩余", "Five Hour Limit Remaining": "五小时限额剩余",
    "limit": "限额", "limits": "限额", "weekly": "每周", "hourly": "每小时",
    "Sidebar": "侧边栏", "Display Options": "显示选项", "Message input": "消息输入框", "Record voice memo": "录制语音备忘",
    "Typeahead menu": "预输入菜单", "Group By": "分组方式", "Last Updated": "最后更新",
    "Alphabetical (A-Z)": "字母顺序 (A-Z)", "Date Added": "添加日期", "Subtitles": "副标题", "No Subtitle": "无副标题",
    "Filter": "筛选", "Scheduled": "已计划", "Environment": "环境", "None": "无", "Fast": "快速",
    "Project": "项目", "project": "项目", "projects": "项目", "Conversation": "对话", "conversation": "对话",
    "Workspace": "工作区", "workspace": "工作区", "Minimize": "最小化", "Maximize": "最大化", "Back": "返回",
    "Folders": "文件夹", "folders": "文件夹", "including": "包括",
    "Rename": "重命名", "Mark Unread": "标记为未读", "Mark Read": "标记为已读", "Duplicate": "制作副本",
    "Export": "导出", "Import": "导入", "Pin": "置顶", "Archive": "归档",
    "Create New Project": "创建新项目", "Archive Conversation": "归档对话", "now": "刚刚",
    "Conversation Name": "对话名称", "Conversation ID": "对话 ID", "Project Name": "项目名称",
    "Toggle Auxiliary Pane": "切换辅助面板", "User cancelled agent execution.": "用户取消了智能体执行。",
    "Open Antigravity IDE": "打开 Antigravity IDE", "Create Project": "创建项目", 
    "Command Palette": "命令面板", "Zoom In": "放大", "Zoom Out": "缩小", "Reset Zoom": "重置缩放",
    "Delete Conversation": "删除对话", "Are you sure you want to delete this conversation? This action cannot be undone.": "您确定要删除此对话吗？此操作无法撤销。",
    "Confirm Undo": "确认撤销", "This undo action will not make any code changes.": "此撤销操作不会对代码做出任何更改。",
    "Confirm Redo": "确认重做", "This redo action will not make any code changes.": "此重做操作不会对代码做出任何更改。",
    "Undo changes up to this point": "撤销更改至此处", "Redo changes up to this point": "重做更改至此处",
    "Confirming this undo action will make the following changes:": "确认此撤销操作将做出以下更改：",
    "Confirming this undo action will not make any code changes.": "确认此撤销操作不会做出任何代码更改。",
    "Confirming this redo action will make the following changes:": "确认此重做操作将做出以下更改：",
    "Confirming this redo action will not make any code changes.": "确认此重做操作不会做出任何代码更改。",
    "Undo changes": "撤销更改", "Redo changes": "重做更改",
    "Record Audio": "录制音频", "Record Audio Ctrl+M": "录制音频 Ctrl+M",
    "Send message": "发送消息", "Send message Enter": "发送消息 Enter",
    "Getting started with a Project": "开始使用项目",
    "Now that you've created a project, configure your project's agent settings or start a conversation.": "现在您已经创建了一个项目，接下来请配置该项目的智能体设置，或者直接开始对话。",
    "Open Settings": "打开设置", "Start first conversation": "开始首次对话",
    "Main Agent": "主智能体", "Add Context": "添加上下文",
    "Loading Antigravity": "正在加载 Antigravity", "Loading": "正在加载",
    "+ New Conversation": "+ 新建对话", "New Conversation": "新建对话", "Conversation History": "历史对话", "Scheduled Tasks": "计划任务",
    "No conversations yet": "暂无对话", "Open IDE": "打开 IDE", "Window": "窗口",
    "Review": "审阅", "Email": "电子邮箱", "Upgrade": "升级", "Not in Project": "未分组项目",
    "Ask anything, @ to mention, / for actions": "输入任何问题，使用 @ 提及，使用 / 执行操作",
    "Status": "状态", "Sort Conversations": "对话排序", "Worktree": "工作区树",
    "New Project": "新建项目", "Quick Start": "快速开始",
    "Good response": "好的回答", "Bad response": "差的回答",

    // General Settings Page
    "General": "常规", "Appearance": "外观", "Theme": "主题", "Light": "浅色", "Dark": "深色",
    "Language": "语言", "Version": "版本", "Check for Updates": "检查更新", "About": "关于",
    "Advanced": "高级", "API Key": "API 密钥", "Account": "账号", "Profile": "个人资料",
    "Logout": "退出登录", "Sign Out": "退出登录", "Feedback": "反馈", "Privacy": "隐私",
    "Terms": "条款", "Auto-start": "开机自启", "Launch on startup": "开机时启动",
    "Notifications": "通知", "Shortcuts": "快捷键", "Keyboard Shortcuts": "键盘快捷键",
    "Global Shortcut": "全局快捷键", "Toggle Visibility": "切换显示/隐藏", "Proxy": "代理",
    "Update": "更新", "Updates": "更新", "Check for update": "检查更新",
    "Models": "模型", "Customizations": "自定义", "Browser": "浏览器", "App": "应用",
    "Projects": "项目", "Conversations": "对话", "Provide Feedback": "提供反馈",
    "Manage your plan, credentials, and general preferences.": "管理您的套餐、凭据和常规偏好设置。",
    "Enable Telemetry": "启用遥测",
    "When toggled on, Antigravity collects usage data to help Google enhance performance and features.": "开启后，Antigravity 将收集使用数据，以帮助 Google 提升性能和功能。",
    "Marketing Emails": "营销邮件",
    "Receive product updates, tips, and promotions from Google Antigravity via email.": "通过电子邮件接收来自 Google Antigravity 的产品更新、提示和促销信息。",
    "Your Plan: Google AI Pro": "当前计划：Google AI Pro", "Your Plan:": "当前计划：",
    "You can upgrade to a Google AI Ultra plan to receive higher rate limits.": "您可以升级至 Google AI Ultra 套餐以获得更高的使用限额。",
    "By using this app, you agree to its ": "使用本应用即表示您同意其 ",
    "Terms of Service": "服务条款",
    "Configure agent execution, queued message delivery, and permissions.": "配置智能体执行、排队消息发送以及权限。",
    "Execution": "执行", "Agent Settings": "智能体设置", "Agent Behavior": "智能体行为",
    "File Permissions": "文件权限", "Network Permissions": "网络权限",
    "Queued Messages": "排队消息", "Configure when follow-up messages are sent.": "配置发送后续消息的时机。",
    "Queue": "排队", "Send Immediately": "立即发送", "Keyboard shortcuts": "键盘快捷键",
    "Security Preset": "安全预设", 
    "Choose a predefined security preset for the agent. This controls terminal auto-execution policy, and file access policy.": "为智能体选择一个预定义的安全预设。这将控制终端自动执行策略和文件访问策略。",
    "Default": "默认", "Always Ask": "总是询问", "Always Proceed": "自动执行",
    "Artifact Review Policy": "工件审核策略",
    "Specifies Agent's behavior when asking for review on artifacts, which are documents it creates to enable a richer conversation experience.": "指定智能体在请求审核工件时的行为，工件是其为提供更丰富对话体验而创建的文档。",
    "File Access Rules": "文件访问规则", "Configure allowed and denied paths for file reads and writes.": "配置允许和拒绝的文件读取和写入路径。",
    "Network Access Rules": "网络访问规则", "Configure allowed and denied URLs for reading.": "配置允许和拒绝读取的 URL。",
    "Enter Queues after the turn": "Enter 键：在当前轮次后排队",
    "Alt+Enter Sends immediately": "Alt+Enter 键：立即发送",
    "Alt+Enter On empty prompt, sends next in queue": "Alt+Enter 键：在输入为空时，发送队列中的下一条",
    "Useful for typical development with an emphasis on security. It prioritizes safety over speed by requiring manual approval for all terminal commands and files outside the project directory.": "适用于注重安全的典型开发场景。它将安全性置于速度之上，要求对所有终端命令和项目目录之外的文件访问进行手动批准。",
    "Requires manual review for all terminal commands and file accesses outside of the working folders.": "要求对所有终端命令和工作文件夹之外的文件访问进行手动审阅。",
    "Full machine": "完整机器访问",
    "All terminal commands require review. The agent can read or write to any file in the machine.": "所有终端命令均需审阅。智能体可以读取或写入机器上的任何文件。",
    "Turbo mode": "极速模式",
    "Disables all safety barriers for maximal iteration velocity.": "禁用所有安全屏障，以获得最快的迭代速度。",
    "Custom": "自定义配置", "Manually customize individual settings.": "手动自定义各项设置。",
    "System Default": "跟随系统", "Zoom Level": "缩放比例", "Font Size": "字体大小",
    "Small": "小", "Medium": "中", "Large": "大", "Code Font": "代码字体", "Editor Font": "编辑器字体",
    "Default Model": "默认模型", "Temperature": "温度", "System Prompt": "系统提示词",
    "Search Engine": "搜索引擎", "Web Search": "网络搜索", "Enable Web Access": "启用网络访问",
    "Startup": "启动", "Launch at login": "登录时自动启动", "Hardware Acceleration": "硬件加速",
    "Current Version": "当前版本", "Up to date": "已是最新版本", "Downloading": "下载中...",
    "Restart to update": "重启以更新", "Danger Zone": "危险区域", "Clear History": "清除历史记录",
    "Delete All": "全部删除", "Reset to Default": "恢复默认设置", "Restore Defaults": "恢复默认设置", "Reset to default": "恢复默认", "Restore defaults": "恢复默认设置",
    "Keybindings": "快捷键绑定", "Command": "命令", "Shortcut": "快捷键", "Action": "操作",
    "Advanced Settings": "高级设置", "Developer Tools": "开发者工具", "Toggle Developer Tools": "切换开发者工具",
    "Open Logs": "打开日志", "Proxy Server": "代理服务器", "Enable Proxy": "启用代理",
    "Auto-Updater": "自动更新程序", "Always": "始终", "Never": "从不", "Ask": "询问",
    "Save changes": "保存更改", "Apply": "应用", "OK": "确定", "Features": "功能",
    "Experimental Features": "实验性功能", "Enable": "启用", "Disable": "禁用",
    "API Configuration": "API 配置", "Account Settings": "账号设置", "Profile Settings": "个人资料",
    "Workspace Settings": "工作区设置", "Manage Projects": "管理项目",
    "Terminal & Tooling Permissions": "终端与工具权限",
    "Terminal Commands": "终端命令", "Configure allowed terminal commands.": "配置允许执行的终端命令。",
    "Commands Outside Sandbox": "沙盒外命令", "Configure allowed commands outside the sandbox.": "配置允许在沙盒外执行的命令。",
    "MCP Tools": "MCP 工具", "Configure external tools via Model Context Protocol.": "通过模型上下文协议配置外部工具。",

    // Models & Usage Tab
    "Models & Usage": "模型与用量", "Manage your model quota and credits.": "管理您的模型配额和积分额度。",
    "Plan": "订阅计划", "Model Credits": "模型积分", "Enable AI Credit Overages": "启用 AI 积分超额使用",
    "When toggled on, Antigravity will use your AI credits to fulfill model requests once you're out of model quota. Antigravity will always use your model quota first before using AI credits.": "启用后，当您的模型配额用尽时，Antigravity 将使用您的 AI 积分来完成模型请求。Antigravity 将始终优先使用模型配额。",
    "See Activity": "查看活动", "Get More AI Credits": "获取更多 AI 积分",
    "Available AI Credits:": "可用 AI 积分：",
    "Gemini Models": "Gemini 模型", "Claude and GPT models": "Claude 和 GPT 模型",
    "Limited time": "限时", "Low": "低", "High": "高", "View Usage": "查看用量",

    // Customizations & Plugins
    "Configure default behaviors, skills, and MCP servers.": "配置默认行为、技能和 MCP 服务器。",
    "Learn more.": "了解更多。", "Learn more": "了解更多",
    "Token Usage": "Token 使用量",
    "The breakdown below shows token usage from customizations like skills, rules, and MCP. If the budget is exceeded, large customizations will be truncated automatically.": "下方的明细展示了来自技能、规则和 MCP 等自定义项的 Token 使用情况。如果超出预算，大型自定义项将被自动截断。",
    "Skills": "技能", "Rules": "规则",
    "Installed MCP Servers": "已安装的 MCP 服务器",
    "Add MCP +": "添加 MCP +", "Add MCP": "添加 MCP", "Add MCP Servers": "添加 MCP 服务器",
    "Search MCP servers by name": "按名称搜索 MCP 服务器",
    "Refresh": "刷新", "Open MCP Config": "打开 MCP 配置",
    "No MCP Servers": "无 MCP 服务器",
    "You currently don't have any MCP Servers installed. Add an MCP server above or add a custom one via the MCP Config.": "您目前尚未安装任何 MCP 服务器。请在上方添加 MCP 服务器，或通过 MCP 配置添加自定义服务器。",
    "Build With Google Plugins": "使用 Google 插件构建", "Build with Antigravity Plugins": "使用 Antigravity 插件构建",
    "Customize": "自定义", "Hide breakdown": "隐藏明细",
    "coding agent": "编程智能体",
    "Core tools and knowledge required to develop for Android": "开发 Android 所需的核心工具和知识",
    "Modern Web Guidance": "现代 Web 开发指南",
    "Keep your coding agent up to date with the latest web best practices.": "让您的编程智能体掌握最新的 Web 最佳实践。",
    "Google Antigravity SDK": "Google Antigravity SDK",
    "Using the Antigravity Python SDK to build AI agents": "使用 Antigravity Python SDK 构建 AI 智能体",
    "Science": "科学", "Curated collection of agent skills for science.": "精选的科学领域智能体技能集合。",
    "Firebase": "Firebase",
    "Prototype, build & run modern apps users love with Firebase's backend, AI, and operational infrastructure.": "借助 Firebase 的后端、AI 和运营基础设施，设计原型、构建并运行深受用户喜爱的现代应用。",
    "Chrome DevTools": "Chrome 开发者工具",
    "Reliable automation, in-depth debugging, and performance analysis in Chrome using Chrome DevTools and Puppeteer": "使用 Chrome DevTools 和 Puppeteer 在 Chrome 中实现可靠的自动化、深度调试和性能分析",
    "Google Kubernetes Engine (Remote)": "Google Kubernetes Engine (远程)",

    // Shortcuts Panel
    "Configure keyboard shortcuts.": "配置键盘快捷键。",
    "Keyboard shortcuts for quick navigation and control.": "用于快速导航和控制的键盘快捷键。",
    "RECOMMENDED": "推荐", "NAVIGATION": "导航", "Recommended": "推荐", "Navigation": "导航",
    "Open Conversation Picker": "打开对话选择器", "Open File Search": "打开文件搜索",
    "Focus Input": "聚焦输入框", "File Picker": "文件选择器",
    "Select Previous Conversation": "选择上一个对话", "Select Next Conversation": "选择下一个对话",
    "Previous Pane Tab": "上一个面板标签", "Next Pane Tab": "下一个面板标签",
    "Toggle Model Selector": "切换模型选择器", "Toggle Voice Recording": "切换语音录制",
    "Find in Pane": "在面板中查找", "Add to Chat/Quote": "添加到对话/引用",
    "LAYOUT CONTROLS": "布局控制", "Layout Controls": "布局控制", "Layout controls": "布局控制",
    "App Shortcuts": "应用快捷键", "Editor Shortcuts": "编辑器快捷键", 
    "Global Shortcuts": "全局快捷键", "Terminal Shortcuts": "终端快捷键", 
    "Chat Shortcuts": "对话快捷键", "Press desired key combination": "按下所需的组合键",

    // Feedback Panel
    "Feedback Type": "反馈类型", "Auth and Billing": "认证与计费", "Description": "描述",
    "Please describe the issue in detail. The more actionable your feedback, the quicker our team can address your request. Some helpful information includes:": "请详细描述您的问题。您的反馈越具体，我们的团队就能越快处理您的请求。一些有用的信息包括：",
    "Steps to reproduce the issue": "重现问题的步骤", "Expected behavior": "预期行为",
    "Actual behavior": "实际行为", "Any error messages": "任何错误消息", "Any relevant information": "任何相关信息",
    "Describe the bug you encountered...": "描述您遇到的错误...",
    "Steps to Reproduce": "重现步骤", "Please list the steps to reproduce the issue...": "请列出重现问题的步骤...",
    "Please list the steps to reproduce the issue": "请列出重现问题的步骤",
    "Attach a screenshot (optional)": "附加截图（可选）", "Attach Antigravity server logs": "附加 Antigravity 服务器日志",
    "We'd love to hear from you.": "我们期待您的反馈。", "How can we improve?": "我们该如何改进？",
    "Thinking...": "思考中...", "Thought": "思考过程", "Agent is thinking...": "智能体正在思考...",
    "Show thought process": "显示思考过程", "Hide thought process": "隐藏思考过程",
    "Generating...": "生成中...", "Planning...": "计划中...",
    "Issue Type": "问题类型", "Bug Report": "错误报告", "Feature Request": "功能请求",
    "General Feedback": "常规反馈", "Describe your issue or idea...": "描述您的问题或想法...",
    "Please provide details...": "请提供详细信息...", "Include diagnostic data": "包含诊断数据",
    "Include app logs": "包含应用日志", "Send Feedback": "发送反馈",

    // Browser Tab
    "Browser Settings": "浏览器设置", "Configure the browser subagent. It requires": "配置浏览器子智能体。需要安装",
    "to be installed. The browser subagent can be invoked by typing /browser in the conversation input box.": "。您可以在对话输入框中输入 /browser 来调用浏览器子智能体。",
    "Browser Javascript Execution Policy": "浏览器 JavaScript 执行策略",
    "Controls whether the agent can run custom JavaScript to automate complex browser actions.": "控制智能体是否可以运行自定义 JavaScript 来自动化复杂的浏览器操作。",
    "Disabled": "已禁用", "Block all browser JavaScript execution.": "阻止所有浏览器 JavaScript 执行。",
    "Request Review": "请求审阅", "Prompt for approval before running browser scripts.": "在运行浏览器脚本前提示批准。",
    "Allow full browser script execution without prompting.": "允许执行完整的浏览器脚本而不提示。",
    "Actuation Permissions": "操作权限", "Browser Actuation Rules": "浏览器操作规则",
    "Configure allowed and denied URLs for browser actuation.": "配置允许和拒绝进行浏览器操作的 URL。",

    // App Tab
    "App Settings": "应用设置", "Manage application settings.": "管理应用设置。",
    "Prevent Sleep": "阻止睡眠", "Prevent the computer from sleeping while the app is running.": "在应用运行时阻止计算机进入睡眠状态。",
    "Keep In Menu Bar": "保留在系统托盘", 
    "The app will be accessible from the menu bar and will keep running in the background when all windows are closed.": "应用将可以从系统托盘访问，并在所有窗口关闭时继续在后台运行。",
    "Keep the app accessible from the menu bar and running in the background when all windows are closed.": "应用将可以从系统托盘访问，并在所有窗口关闭时继续在后台运行。",
    "Notification Settings": "通知设置", "To modify notification settings, open your operating system's system preferences.": "要修改通知设置，请打开操作系统的系统偏好设置。",
    "Open System Preferences": "打开系统偏好设置",

    // Conversations Tab & Permissions
    "Agent settings and permissions for conversations outside of projects.": "针对项目外对话的智能体设置和权限。",
    "Inherit General": "继承全局设置", "Local Permissions": "本地权限",
    "Also includes": "还包括", "global settings": "全局设置",
    "when working in this project.": "（当在此项目中工作时）。",
    "Toggle Sidebar": "切换侧边栏", "View Split Diff": "分屏查看差异", "Collapse All": "全部折叠",
    "Learn more about": "了解更多关于",
    "Configure the agent's visual theme and display preferences.": "配置智能体的视觉主题和显示偏好。",
    "Chat Settings": "聊天设置", "Verbose Agent Chat": "详细的智能体对话",
    "Display and preserve intermediate thinking steps.": "显示并保留中间思考过程。",
    "Conversation Width": "对话宽度", "Configure the maximum width of the conversation panel.": "配置对话面板的最大宽度。",
    "Narrow": "较窄", "Wide": "较宽",
    "Select light, dark, or inherit system settings.": "选择浅色、深色，或跟随系统设置。",
    "Light Theme": "浅色主题", "Preset": "预设", "Default Light": "默认浅色",
    "Background": "背景颜色", "Foreground": "前景颜色", "Accent": "强调色",
    "Dark Theme": "深色主题", "Default Dark": "默认深色",
    "Allow write access to this path?": "允许写入此路径吗？",
    "Allow read access to this path?": "允许读取此路径吗？",
    "Allow execution of this command?": "允许执行此命令吗？",
    "Yes, allow this time": "是，仅本次允许",
    "Yes, and always allow in this conversation": "是，在本次对话中始终允许",
    "Yes, and always allow when not in a project": "是，在未分组项目中始终允许",
    "Yes, and always allow": "是，始终允许",
    "tell the agent what to do instead": "告诉智能体接下来该做什么",
    "(tell the agent what to do instead)": "(告诉智能体接下来该做什么)",
    "Skip": "跳过", "Working.": "运行中。", "Working...": "运行中...",
    "Edited": "已编辑", "Viewed": "已查看", "Created": "已创建", "Deleted": "已删除", "Executed": "已执行",
    "Save rule to always allow write access to this path?": "保存规则以始终允许写入此路径吗？",
    "Save rule to always allow read access to this path?": "保存规则以始终允许读取此路径吗？",
    "Save rule to always allow execution of this command?": "保存规则以始终允许执行此命令吗？",
    "Yes, save rule in this conversation": "是，在本次对话中保存规则",
    "Yes, save rule when not in a project": "是，在未分组项目中保存规则",
    "Yes, save rule globally": "是，全局保存规则",

    // Error & Diagnostics UI
    "Our servers are experiencing high traffic right now, please try again in a minute.": "我们的服务器当前负载较高，请稍后重试。",
    "Error ID:": "错误 ID：",
    "Agent terminated due to error": "智能体因错误而终止",
    "You can prompt the model to try again or start a new conversation if the error persists.": "您可以提示模型重试，或者如果错误仍然存在，可以开启新的对话。",
    "See our troubleshooting guide for more help.": "查看我们的排查指南以获取更多帮助。",
    "See our troubleshooting guide for more help": "查看我们的排查指南以获取更多帮助",
    "troubleshooting guide": "排查指南", "troubleshooting_guide": "排查指南",
    "See our": "查看我们的",
    "for more help.": "以获取更多帮助。", "for more help": "以获取更多帮助",
    "Dismiss": "忽略", "Copy debug info": "复制调试信息"
  };

  const coreWords = {
    "create": "创建", "delete": "删除", "new": "新建", "edit": "编辑", "save": "保存", "cancel": "取消", "confirm": "确认",
    "close": "关闭", "open": "打开", "stop": "停止", "start": "启动", "run": "运行", "add": "添加", "remove": "移除", "download": "下载",
    "update": "更新", "select": "选择", "clear": "清除", "search": "搜索", "find": "查找", "view": "查看", "show": "显示", "hide": "隐藏",
    "copy": "复制", "paste": "粘贴", "cut": "剪切", "rename": "重命名", "duplicate": "制作副本",
    "agent": "智能体", "agents": "智能体", "subagent": "子智能体", "subagents": "子智能体", "task": "任务", "tasks": "任务",
    "workspace": "工作区", "workspaces": "工作区", "directory": "目录", "folder": "文件夹", "file": "文件", "files": "文件",
    "command": "命令", "commands": "命令", "terminal": "终端", "console": "控制台", "output": "输出", "input": "输入",
    "error": "错误", "warning": "警告", "info": "信息", "success": "成功", "failed": "失败", "pending": "等待中", "running": "运行中",
    "yes": "是", "no": "否", "true": "真", "false": "假", "on": "开", "off": "关", "enable": "启用", "disable": "禁用",
    "global": "全局", "retry": "重试", "regenerate": "重新生成", "dismiss": "忽略"
  };

  // Structured Prefix & Content Match Rules for Complex / Truncated Text
  const textPrefixRules = [
    // === 技能（Skills）卡片完整前缀汉化 ===
    ["Add custom image, logo, or badge watermarks to all pictures/screenshots inside Word documents", "为 Word 文档 (.docx) 内的所有图片和屏幕截图添加自定义图片、Logo 或徽章水印。支持批量处理、自适应缩放、透明度调节、圆形抗锯齿裁剪、自定义边角位置定位，以及智能排除封面/页眉徽标。当用户需要给 Word 文档中的图片加水印、保护截图或盖章时使用。"],
    ["Standardize and polish Word document (.docx) typography and layout", "标准化并润色 Word 文档 (.docx) 的排版与布局。严格执行国内高校/工程学术报告格式规范：消除 AI 味（呈现自然的学生/工程师口吻），严格统一字体与字号（宋体/Times New Roman、纯黑、1.5 倍行距、小四 12pt 正文、四号 14pt 一级标题），清除 Word 段落黑点/定位符（keepNext 标记），清理多余空行，居中嵌入图片，独立封面页，添加居中页码，确保单文件交付。当用户要求格式化、润色、清理或排版 Word 文档时使用。"],
    ["How to render rich interactive HTML widgets inline in the chat or as standalone artifacts", "在对话中直接渲染丰富的交互式 HTML 小部件或作为独立工件。当需要向用户展示流程图表、数据可视化、交互式控件、教学演练或任何超越纯文本和 Markdown 的丰富视觉内容时使用。"],
    ["Convert various document and media formats (PDF, Word DOCX, PowerPoint PPTX, Excel XLSX/XLS", "将各种文档和媒体格式（PDF、Word DOCX、PowerPoint PPTX、Excel XLSX/XLS、HTML、图像、音频、CSV、JSON、XML、ZIP）转换为结构清晰的 Markdown，供大模型阅读、文本分析或文档转换。当用户要求将文件转为 Markdown、从 Office/PDF 中提取结构化内容或提及 markitdown 时使用。"],
    ["Automatically migrate legacy workflows to modern skills across global and workspace configurations", "在全局和工作区配置中，自动将旧版工作流（workflows）迁移为现代技能（skills）。扫描现存工作流，创建目标 SKILL.md 文件，并安全归档旧的工作流文件。"],
    ["Guidelines for interacting with GitHub and request permissions from the user", "与 GitHub 交互的规范准则，当命令因智能体环境限制而失败时向用户申请相应权限。"],
    ["Forces the laziest solution that actually works, simplest, shortest, most minimal", "推崇极简主义：寻找真正有效、最简单、代码量最少的最优解。秉持资深架构师视角：优先质疑需求必要性（YAGNI），首选标准库而非手写轮子，优先使用原生平台特性而非引入外部依赖，一行代码能搞定绝不写五十行。支持不同强度：lite、full（默认）、ultra。适用于任何编码、重构、修复、代码审查或依赖选型任务。"],
    ["Whole-repo audit for over-engineering. Like ponytail-review, but scans the entire codebase", "全仓库过度设计审计。扫描整个代码库，输出一份建议删除、简化或替换为标准库/原生方案的优先级清单。当用户要求“审计代码库”、“排查过度设计”、“查找冗余臃肿代码”或调用 /ponytail-audit 时使用。"],
    ["Harvest every ponytail: comment in the codebase into a debt ledger", "汇总代码库中的所有 ponytail: 标记为技术债务清单，追踪有意为之的极简跳过与待办事项，避免“以后再做变成再也不做”。当用户询问技术债务、待办清单或调用 /ponytail-debt 时使用。"],
    ["Show ponytail's measured impact as a compact scoreboard", "以紧凑计分板展示极简模式的实际收益：更少的代码、更低的 Token 消耗、更快的运行速度。通过基准中位数展示成效。触发词：/ponytail-gain、“极简收益”、“极简计分板”。"],
    ["Quick-reference card for all ponytail modes, skills, and commands", "极简模式（Ponytail）所有模式、技能和命令的快速参考卡片。触发词：/ponytail-help、“极简帮助”、“有哪些极简命令”。"],
    ["Code review focused exclusively on over-engineering. Finds what to delete", "专门针对过度设计的代码审查。找出应该精简删除的内容：重复造标准库轮子、多余依赖、过度预想的抽象层、无用的死灵扩展性。每条建议指明位置、应删除内容及替代方案。触发词：“审查过度设计”、“精简代码”、“/ponytail-review”。"],
    ["AI-driven presentation workflow for generating editable PPTX decks", "AI 驱动的演示文稿工作流，用于生成可编辑的 PPTX 幻灯片、创建可复用的品牌/版式/工作区、填充原生 PPTX 模板以及美化增强成品 PPTX 文件。当用户要求创建、重制、填充模板或优化 PPT 演示文稿时使用。"],

    // Plugins & Customizations
    ["Plugins are packaged collections of skills and MCPs to help the Agent in", "插件是技能和 MCP 的打包集合，用于帮助 "],
    ["Plugins are packaged collections of skills and MCPs", "插件是技能和 MCP 的打包集合，用于帮助 "],
    ["work with Google developer products. You can always change your choices in Settings.", " 中的智能体与 Google 开发者产品协同工作。您可以随时在“设置”中更改您的选择。"],
    ["Provides a comprehensive guide", "提供 Google Antigravity (AGY) 的综合指南、快速参考和站点地图，包括 Antigravity CLI、Antigravity 2.0、IDE、Python SDK、斜杠命令、快捷键和自定义项。"],
    ["Comprehensive guide and reference for the Antigravity Customization System", "Antigravity 自定义系统的综合指南和参考。用于解释自定义项的工作原理、加载优先级、发现机制，并指导创建技能、规则、插件、钩子和 MCP 服务器。"],
    ["Skills providing tailored instructions for happy path", "提供 Dart 和 Flutter 开发主流程定制化指南的技能。"],
    ["Build and prototype location-aware applications with Google Maps Platform", "使用 Google Maps Platform 构建具有位置感知能力的应用并设计原型。"],
    ["Specialized suite of skills for data engineers and database", "专为 Google Cloud 上的数据工程师和数据库从业人员打造的专业技能套件。"],
    ["Build applications with the Gemini Interactions API and Live API", "使用 Gemini Interactions API 和 Live API 构建应用，包括文本生成、多轮对话等功能。"],

    // MCP Servers Descriptions
    ["Investigate and fix software issues using AI-powered root cause analysis", "使用 AI 驱动的根本原因分析来调查和修复软件问题。此 MCP 服务器连接到您的 Antimetal 账户..."],
    ["Query and act on your marketing, analytics, CRM, e-commerce", "跨 325 多个连接器查询并处理您的营销、分析、CRM、电子商务和仓库数据..."],
    ["Query your GitLab SDLC as a knowledge graph", "将您的 GitLab SDLC 作为知识图谱进行查询。Orbit 会建立相关索引..."],
    ["Enable Antigravity to deploy apps to Google Cloud Run", "使 Antigravity 能够将应用部署到 Google Cloud Run。"],
    ["Search and reference over 600,000 real-world app screens", "搜索并参考超过 600,000 个真实的应用程序屏幕、用户流程和 UI 模式..."],
    ["Build, edit, deploy, and manage full-stack web apps with Lovable", "使用自然语言，通过 Lovable 构建、编辑、部署和管理全栈 Web 应用..."],
    ["The GKE remote MCP server provides read write access to your GKE", "GKE 远程 MCP 服务器提供对您的 GKE Kubernetes 资源的读写访问权限。"],
    ["The Dart and Flutter MCP server exposes Dart (and Flutter)", "Dart 和 Flutter MCP 服务器向兼容的 AI 助手客户端公开相关开发工具操作。"],
    ["The Firebase Model Context Protocol (MCP) Server gives AI-powered", "Firebase MCP 服务器使 AI 工具能够处理您的 Firebase 项目和应用程序代码库。"],
    ["The Genkit Model Context Protocol (MCP) Server gives AI-powered", "Genkit MCP 服务器使 AI 工具能够构建、调试和检查您的 Genkit 应用。"],
    ["The gopls Model Context Protocol (MCP) server provides tools", "gopls MCP 服务器为您的 Go 代码库提供语义代码分析、实时诊断和转换工具。"],
    ["Interact with your BigQuery data using natural language", "使用自然语言与您的 BigQuery 数据交互。允许您安全地连接到您的数据集..."],
    ["The AlloyDB for PostgreSQL remote MCP server lets you access", "AlloyDB for PostgreSQL 远程 MCP 服务器允许您访问和运行 AlloyDB 工具..."],
    ["The Bigtable Admin remote MCP server lets you manage Bigtable", "Bigtable Admin 远程 MCP 服务器允许您管理 Bigtable 资源。"],
    ["The Cloud SQL remote MCP server lets you access and run Cloud SQL", "Cloud SQL 远程 MCP 服务器允许您访问和运行 Cloud SQL 工具..."],
    ["The Spanner remote MCP server lets you access and run Spanner", "Spanner 远程 MCP 服务器允许您访问和运行 Spanner 工具..."],
    ["The Apigee API hub remote MCP server lets you manage", "Apigee API hub 远程 MCP 服务器允许您管理 API、版本、规范、操作等。"],
    ["Connect your AI assistants to Looker business intelligence", "将您的 AI 助手连接到 Looker 商业智能，通过自然语言查询实现数据探索。"],
    ["Connect your AI assistants to the Knowledge Catalog", "将您的 AI 助手连接到 Knowledge Catalog，实现数据发现和治理。"],
    ["The MCP Toolbox for Databases is an open-source MCP server", "MCP Toolbox for Databases 是一个开源 MCP 服务器，旨在简化和保护用于与数据库交互的工具的开发。"],
    ["Interact with your Oracle Database data using natural language", "使用自然语言与您的 Oracle 数据库交互。此 MCP 服务器允许您安全地连接到您的数据库以执行 SQL 查询..."],
    ["The Dev Mode MCP Server brings Figma directly into your workflow", "Dev Mode MCP 服务器通过向从 Figma 生成代码的 AI 智能体提供重要的设计信息和上下文，将 Figma 直接带入您的工作流..."],
    ["The GitHub MCP Server is a Model Context Protocol (MCP) server", "GitHub MCP 服务器提供与 GitHub API 的无缝集成，从而实现高级自动化和..."],
    ["The Google Home Developer MCP server allows you to search", "Google Home Developer MCP 服务器允许您搜索 Google Home 文档、OpenThread 和 Matter 规范文档。"],
    ["Neon MCP Server is an open-source tool that lets you interact", "Neon MCP 服务器是一个开源工具，允许您使用自然语言与您的 Neon Postgres 数据库交互。"],
    ["The Stripe Model Context Protocol server allows you to integrate", "Stripe MCP 服务器允许您通过函数调用与 Stripe API 集成。该协议支持各种交互工具..."],
    ["Interact with Redis key-value stores", "与 Redis 键值存储交互。"],
    ["A Model Context Protocol server for interacting with MongoDB", "用于与 MongoDB Atlas 交互的模型上下文协议服务器。"],
    ["Official Notion MCP Server that allows interaction with Notion", "官方 Notion MCP 服务器，允许通过 Notion API 与 Notion 工作区、页面、数据库和评论进行交互。"],
    ["Official Linear.app MCP Server for interacting with Linear", "官方 Linear.app MCP 服务器，用于与 Linear 项目、议题和工作流进行交互。"],
    ["An MCP server implementation that integrates the Perplexity", "一个集成了 Perplexity Sonar API 的 MCP 服务器实现，以提供实时的、全网范围的研究能力。"],
    ["Official PayPal MCP Server that allows integration with PayPal", "官方 PayPal MCP 服务器，允许与 PayPal API 集成，用于支付处理、交易管理和账户操作。"],
    ["The Heroku Platform MCP Server enables seamless interaction", "Heroku Platform MCP 服务器可实现与 Heroku 平台资源的无缝交互，允许 LLM 读取、管理和操作应用程序..."],
    ["The Pinecone MCP Server enables AI tools to search Pinecone", "Pinecone MCP 服务器使 AI 工具能够搜索 Pinecone 文档、配置索引、根据索引配置生成代码..."],
    ["Connect your Supabase projects to AI assistants.", "将您的 Supabase 项目连接到 AI 助手。此 MCP 服务器允许管理表、获取配置、执行 SQL 查询、管理边缘函数等..."],
    ["The Prisma MCP Server enables AI tools to interact with Prisma", "Prisma MCP 服务器使 AI 工具能够与 Prisma 交互，从而轻松创建和管理 Postgres 数据库。"],
    ["The Locofy MCP Server", "Locofy MCP 服务器使 Locofy.ai 代码能够与您的 IDE 集成并进行扩展。"],
    ["Locofy MCP Server enables Locofy.ai code", "Locofy MCP 服务器使 Locofy.ai 代码能够与您的 IDE 集成并进行扩展。"],
    ["Airweave lets agents search any app.", "Airweave 允许智能体搜索任何应用程序。"],
    ["Atlassian MCP Server for interacting with Atlassian", "用于与 Atlassian 产品交互的 Atlassian MCP 服务器。"],
    ["Interact with your Harness account using natural language", "使用自然语言与您的 Harness 账户交互。此 MCP 服务器允许 AI 智能体检查和管理 CI/CD 流水线、执行、服务..."],
    ["SonarQube MCP Server enables AI assistants to interact", "SonarQube MCP 服务器使 AI 助手能够与 SonarQube 实例交互，进行代码质量分析、项目管理和质量门限操作。"],
    ["Perform searches on ingested data in Google-owned data stores", "在 Google 拥有的数据存储中，对已摄取的数据执行搜索。"],
    ["Interact with documents stored in a Firestore database", "使用自然语言与存储在 Firestore 数据库中的文档进行交互。"],
    ["Access resources in the Cloud Logging platform using natural", "使用自然语言访问 Cloud Logging 平台中的资源。"],
    ["Manage clusters for Managed Service for Apache Kafka", "使用自然语言管理 Apache Kafka 托管服务和 Kafka Connect 的集群。"],
    ["Access resources in the Cloud Monitoring platform using natural", "使用自然语言访问 Cloud Monitoring 平台中的资源。"],
    ["Manage Pub/Sub resources and publish messages. Create, list,", "管理 Pub/Sub 资源并发布消息。创建、列出、获取、更新和删除 Pub/Sub 主题、订阅和快照，以及发布消息..."],
    ["The Cloud Quotas MCP server allows you to view quota allocations", "Cloud Quotas MCP 服务器允许您查看配额分配、请求增加配额以及管理配额调整器配置。"],
    ["Enable Antigravity to control and inspect a live Chrome browser", "使 Antigravity 能够控制和检查实时 Chrome 浏览器，利用 Chrome DevTools 的强大功能进行可靠的自动化、深度调试..."],
    ["Netlify MCP Server enables AI assistants to interact", "Netlify MCP 服务器使 AI 助手能够与 Netlify 平台交互，以管理站点、部署、域名和其他 Web 开发工作流。"],
    ["A Model Context Protocol server that provides structured thinking", "一个模型上下文协议服务器，为 LLM 对话提供结构化思考和推理能力。"],
    ["Sonatype MCP server for interacting with our dependency management", "用于与我们的依赖项管理和安全情报平台交互的 Sonatype MCP 服务器。"],
    ["The Google Maps Platform Code Assist MCP server provides", "Google Maps Platform Code Assist MCP 服务器为您喜爱的 AI 编程助手提供最新、官方的 Google Maps Platform 文档、代码..."],
    ["This MCP server provides your LLM with docs and examples to instrument your AI apps with Arize AX", "此 MCP 服务器为您的 LLM 提供文档和示例，以便使用 Arize AX 检测您的 AI 应用。它还提供对 Arize 支持的访问。将其连接到您的 IDE..."],
    ["The Postman MCP Server connects Postman to AI tools", "Postman MCP 服务器将 Postman 连接到 AI 工具，使 AI 智能体和助手能够访问工作区、管理集合和环境..."],
    ["The Stitch MCP server enables AI assistants to interact with Stitch", "Stitch MCP 服务器使 AI 助手能够与 Stitch 交互以进行设计：从文本和图像生成 UI 设计，以及访问项目和屏幕..."],
    ["The ClickHouse MCP server enables agents to securely interact", "ClickHouse MCP 服务器使智能体能够安全地与 ClickHouse 数据库交互。它提供了一个通用接口来执行 SQL、探索数据和查看..."],
    ["Perform a range of infrastructure management tasks, including: manage virtual machine", "执行一系列基础设施管理任务，包括：管理虚拟机 (VM) 实例、管理实例组管理器和实例模板..."],
    ["Access enterprise mobility data using natural language queries", "使用关于设备队列的自然语言查询、策略合规性的自动审计以及设备集成来访问企业移动数据..."],
    ["Search your Google Cloud projects using natural language", "使用自然语言搜索您的 Google Cloud 项目。"],

    // Error and Fallback Links
    ["Confirming this undo action will make the following changes", "确认此撤销操作将做出以下更改："],
    ["Confirming this undo action will not make any code changes", "确认此撤销操作不会做出任何代码更改。"],
    ["Confirming this redo action will make the following changes", "确认此重做操作将做出以下更改："],
    ["Confirming this redo action will not make any code changes", "确认此重做操作不会做出任何代码更改。"],
    ["Undo changes up to this point", "撤销更改至此处"],
    ["Redo changes up to this point", "重做更改至此处"],
    ["Our servers are experiencing high traffic", "我们的服务器当前负载较高，请稍后重试。"],
    ["Agent terminated due to error", "智能体因错误而终止"],
    ["You can prompt the model to try again", "您可以提示模型重试，或者如果错误仍然存在，可以开启新的对话。"],
    ["for more help", " 以获取更多帮助。"],
    ["See our", "查看我们的 "]
  ];

  function translateText(text) {
    if (!text || typeof text !== 'string') return text;
    let trimmed = text.trim();
    if (!trimmed) return text;

    if (dictionary[trimmed]) {
      return text.replace(trimmed, dictionary[trimmed]);
    }
    
    // Dynamic Regex Translations
    // 针对设置与权限的动态正则替换
    // 浏览器设置迁移提示动态替换
    if (text.indexOf("Browser settings have moved") !== -1) {
      text = text.replace(/Browser settings have moved to the Browser section of General settings\.?/gi, "浏览器设置已移至常规设置中的“浏览器”部分。");
      text = text.replace(/Browser settings have moved/gi, "浏览器设置已迁移");
    }
    if (text.indexOf("Go to General settings") !== -1 || text.indexOf("Go to general settings") !== -1) {
      text = text.replace(/Go to General settings\.?/gi, "前往常规设置");
    }

    // WSL 设置动态替换
    if (text.indexOf("Windows Subsystem for Linux") !== -1) {
      text = text.replace(/Windows Subsystem for Linux/g, "Windows 适用 Linux 子系统 (WSL)");
    }
    if (text.indexOf("Run the app against a Linux environment") !== -1 || text.indexOf("selected WSL distro") !== -1) {
      text = text.replace(/Run the app against a Linux environment\.?\s*Connecting relaunches the app into the selected WSL distro\.?/gi, "在 Linux 环境中运行应用。连接后将在选定的 WSL 发行版中重新启动应用。");
      text = text.replace(/Run the app against a Linux environment\.?/gi, "在 Linux 环境中运行应用。");
      text = text.replace(/Connecting relaunches the app into the selected WSL distro\.?/gi, "连接后将在选定的 WSL 发行版中重新启动应用。");
    }

    // 项目侧边栏 Show All / Show Less 独立文本替换
    if (/^Show All$/i.test(trimmed)) {
      return text.replace(trimmed, "显示全部");
    }
    if (/^Show Less$/i.test(trimmed)) {
      return text.replace(trimmed, "收起全部");
    }
    if (/^Show More$/i.test(trimmed)) {
      return text.replace(trimmed, "显示更多");
    }

    // 精确按钮与版本项
    if (/^Connect$/i.test(trimmed)) {
      return text.replace(trimmed, "连接");
    }
    if (/^Connected$/i.test(trimmed)) {
      return text.replace(trimmed, "已连接");
    }
    if (/^App version$/i.test(trimmed)) {
      return text.replace(trimmed, "应用版本");
    }
    if (/^Install IDE$/i.test(trimmed)) {
      return text.replace(trimmed, "安装 IDE");
    }

    if (text.indexOf("Modified in") !== -1) {
      text = text.replace(/Modified in (\d+) (projects?|项目)/g, "已在 $1 个项目中修改");
      text = text.replace(/Modified in (\d+)/g, "已在 $1 个项目中修改");
      text = text.replace(/^Modified in$/g, "已修改于");
      text = text.replace(/Modified in\s*$/g, "已修改于 ");
    }
    if (text.indexOf("Controls the actions the agent can take") !== -1) {
      text = text.replace(/Controls the actions the agent can take\.?/g, "控制智能体可以执行的操作。");
    }
    if (text.indexOf("Whether the agent asks you to review its documents") !== -1) {
      text = text.replace(/Whether the agent asks you to review its documents\.?/g, "智能体是否要求您审查其文档。");
    }
    if (text.indexOf("Modify permissions for file, terminal, and MCP tools") !== -1) {
      text = text.replace(/Modify permissions for file, terminal, and MCP tools\.?/g, "修改文件、终端和 MCP 工具的权限。");
    }
    if (text.indexOf("Type / and select plan") !== -1 || text.indexOf("to have the agent generate a plan") !== -1) {
      text = text.replace(/Type\s+\/\s+and select\s+plan\s+to have the agent generate a plan\.?/gi, "输入 / 并选择 plan 让智能体生成计划。");
      text = text.replace(/to have the agent generate a plan\.?/gi, "让智能体生成计划。");
      text = text.replace(/Type\s+\/\s+and select\s+plan/gi, "输入 / 并选择 plan");
    }
    if (text.indexOf("Global Permissions") !== -1) {
      text = text.replace(/Global Permissions/g, "全局权限");
    }
    if (text.indexOf("Tool Permissions") !== -1) {
      text = text.replace(/Tool Permissions/g, "工具权限");
    }
    if (text.indexOf("Plan Review Policy") !== -1) {
      text = text.replace(/Plan Review Policy/g, "计划审查策略");
    }
    if (text.indexOf("Inherit Global") !== -1) {
      text = text.replace(/Inherit Global/g, "继承全局");
    }
    let m;
    if (text.indexOf("of the customization budget is available") !== -1) {
      text = text.replace(/(\d+(?:\.\d+)?)% of the customization budget is available\.?/g, "自定义项预算可用额度为 $1%。");
      text = text.replace(/%\s*of the customization budget is available\.?/g, "% 的自定义项预算可用额度。");
      text = text.replace(/(^\s*)of the customization budget is available\.?/g, "$1的自定义项预算可用额度。");
    }
    if ((m = trimmed.match(/^Show (\d+) breakdowns?$/))) {
      return text.replace(trimmed, "显示 " + m[1] + " 项明细");
    }
    if ((m = trimmed.match(/^Learn more about (.+)$/))) {
      return text.replace(trimmed, "了解更多关于 " + (dictionary[m[1]] || m[1]) + " 的信息");
    }
    if ((m = trimmed.match(/^You have used some of your weekly limit, it will fully refresh in (.*)\.$/))) {
      let timeStr = m[1].replace(/days?/g, "天").replace(/hours?/g, "小时").replace(/minutes?/g, "分钟").replace(/,/g, "");
      return text.replace(trimmed, "您已使用部分每周限额，它将在 " + timeStr + " 后完全重置。");
    }
    if ((m = trimmed.match(/^You have used some of your 5-hour limit, it will fully refresh in (.*)\.$/))) {
      let timeStr = m[1].replace(/days?/g, "天").replace(/hours?/g, "小时").replace(/minutes?/g, "分钟").replace(/,/g, "");
      return text.replace(trimmed, "您已使用部分五小时限额，它将在 " + timeStr + " 后完全重置。");
    }
    if ((m = trimmed.match(/^Available AI Credits: ([\d,]+)$/))) {
      return text.replace(trimmed, "可用 AI 积分: " + m[1]);
    }
    if ((m = trimmed.match(/^Send feedback as (.+)$/))) {
      return text.replace(trimmed, "以 " + m[1] + " 的身份发送反馈");
    }
    if ((m = trimmed.match(/^(\+?\d+) more lines$/))) {
      return text.replace(trimmed, "更多 " + m[1] + " 行");
    }
    if ((m = trimmed.match(/^(\d+) files? changed$/))) {
      return text.replace(trimmed, m[1] + " 个文件已修改");
    }
    if ((m = trimmed.match(/^Version ([\d\.]+(-\w+)?)$/))) {
      return text.replace(trimmed, "版本 v" + m[1]);
    }
    if ((m = trimmed.match(/^(\d+)s$/))) return text.replace(trimmed, m[1] + "秒前");
    if ((m = trimmed.match(/^(\d+)m$/))) return text.replace(trimmed, m[1] + "分钟前");
    if ((m = trimmed.match(/^(\d+)h$/))) return text.replace(trimmed, m[1] + "小时前");
    if ((m = trimmed.match(/^(\d+)d$/))) return text.replace(trimmed, m[1] + "天前");

    // Dynamic Time Formatter
    if (text.indexOf("Worked for") !== -1) {
      return text.replace(/Worked for ([\d\.a-z ]+)/gi, function(_, timeStr) {
        let t = timeStr.replace(/ms/g, "毫秒").replace(/s/g, "秒").replace(/m/g, "分").replace(/h/g, "小时");
        return "运行耗时 " + t;
      });
    }
    if (text.indexOf("Thought for") !== -1) {
      return text.replace(/Thought for ([\d\.a-z ]+)/gi, function(_, timeStr) {
        let t = timeStr.replace(/ms/g, "毫秒").replace(/s/g, "秒").replace(/m/g, "分").replace(/h/g, "小时");
        return "思考耗时 " + t;
      });
    }
    if (text.indexOf("Working") !== -1) {
      text = text.replace(/Working(\.*)/g, "运行中$1");
    }

    // Special Multi-segment Matches
    if (text.indexOf("Google Developer Knowledge") !== -1 || text.indexOf("official developer documentation and retrieve") !== -1) {
      return "Google Developer Knowledge MCP 服务器使 AI 驱动的开发工具能够搜索 Google 的官方开发者文档并检索相关内容...";
    }
    if (text.indexOf("Ask questions. Get answers") !== -1) {
      if (text.indexOf("PostHog") !== -1) {
        return "提出问题。获取答案。该 MCP 是您的编程智能体与之对话的服务器。用英语提问，它会针对您的 PostHog 数据运行查询并返回结果。";
      }
      return "提出问题。获取答案。该 MCP 是您的 ";
    }
    if (text.indexOf("talks to. Ask a question in English") !== -1 || text.indexOf("runs the query against your") !== -1) {
      return " 与之对话的服务器。用英语提问，它会针对您的 ";
    }
    if (text.indexOf("The answer lands") !== -1 || text.indexOf("data. The answer") !== -1) {
      return " 数据运行查询并返回结果。";
    }

    if (text.indexOf("Configure the browser subagent") !== -1) {
      text = text.replace(/Configure the browser subagent\.?/g, "配置浏览器子智能体。");
    }
    if (text.indexOf("It requires") !== -1 && text.indexOf("Configure") === -1) {
      text = text.replace(/It requires\s?/g, "需要安装 ");
    }
    if (text.indexOf("to be installed.") !== -1) {
      text = text.replace(/\s?to be installed\./g, "");
    }
    if (text.indexOf("The browser subagent can be invoked by typing") !== -1) {
      text = text.replace(/The browser subagent can be invoked by typing \/browser in the conversation input box\./g, "您可以在对话输入框中输入 /browser 来调用浏览器子智能体。");
    }

    if (text.indexOf("You currently don't have any MCP Servers installed.") !== -1) {
      text = text.replace(/You currently don't have any MCP Servers installed\./g, "您目前尚未安装任何 MCP 服务器。");
    }
    if (text.indexOf("Add an MCP server above") !== -1) {
      text = text.replace(/Add an MCP server above or add a custom one via the MCP Config\./g, "请在上方添加 MCP 服务器，或通过 MCP 配置添加自定义服务器。");
    }

    // Prefix Rules Matching
    for (let i = 0; i < textPrefixRules.length; i++) {
      if (text.indexOf(textPrefixRules[i][0]) !== -1) {
        return textPrefixRules[i][1];
      }
    }

    // Short Word Exact Replacement
    let wordsCount = trimmed.split(/\s+/).length;
    if (wordsCount <= 3) {
      let lowerText = trimmed.toLowerCase();
      if (coreWords[lowerText]) {
        return text.replace(trimmed, coreWords[lowerText]);
      }
    }
    
    return text;
  }

  const immuneTags = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'SVG', 'PATH', 'G', 'CIRCLE', 'RECT', 'CANVAS', 'IMG', 'I', 'USE', 'SYMBOL']);

  function isImmuneNode(el) {
    if (!el) return false;
    let curr = el.nodeType === 1 ? el : el.parentElement;
    while (curr) {
      if (immuneTags.has(curr.tagName)) return true;
      if (curr.id === 'ag-token-counter-badge') return true;

      if (curr.classList) {
        if (curr.classList.contains('monaco-editor') ||
            curr.classList.contains('view-lines') ||
            curr.classList.contains('code-content') ||
            curr.classList.contains('codicon') ||
            curr.classList.contains('icon') ||
            curr.classList.contains('notranslate')) {
          return true;
        }
      }
      if (curr.getAttribute && curr.getAttribute('contenteditable') === 'true') return true;
      curr = curr.parentElement;
    }
    return false;
  }

  function processNode(node) {
    if (!node) return;
    if (isImmuneNode(node)) return;

    if (node.nodeType === 3) {
      // TEXT_NODE
      let text = node.textContent;
      if (text && text.trim()) {
        const translated = translateText(text);
        if (translated !== text) {
          node.textContent = translated;
        }
      }
      return;
    }

    if (node.nodeType === 1) {
      // ELEMENT_NODE
      if (immuneTags.has(node.tagName)) return;

      if (node.placeholder) {
        const tr = translateText(node.placeholder);
        if (tr !== node.placeholder) node.placeholder = tr;
      }
      if (node.title) {
        const tr = translateText(node.title);
        if (tr !== node.title) node.title = tr;
      }
      if (node.getAttribute) {
        const aria = node.getAttribute('aria-label');
        if (aria) {
          const tr = translateText(aria);
          if (tr !== aria) node.setAttribute('aria-label', tr);
        }
      }

      let child = node.firstChild;
      while (child) {
        processNode(child);
        child = child.nextSibling;
      }
    }
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          processNode(node);
        });
      } else if (mutation.type === 'characterData') {
        processNode(mutation.target);
      }
    });
  });

  function injectLocalizationStyles() {
    if (document.getElementById('ag-localization-styles')) return;
    const style = document.createElement('style');
    style.id = 'ag-localization-styles';
    style.textContent = `
      /* Fix Fastpick Command Palette mode prefix button vertical text wrapping */
      [data-testid="fastpick-prefix-trigger"],
      [data-testid="fastpick-prefix-trigger"] span,
      [data-testid="fastpick"] [role="combobox"],
      [data-testid="fastpick"] button {
        white-space: nowrap !important;
        display: inline-flex !important;
        flex-direction: row !important;
        align-items: center !important;
        width: auto !important;
        max-width: none !important;
        flex-shrink: 0 !important;
      }
    `;
    const target = document.head || document.documentElement || document.body;
    if (target) target.appendChild(style);
  }

  function startTranslator() {
    injectLocalizationStyles();
    const rootEl = document.body || document.documentElement;
    if (rootEl) {
      processNode(rootEl);
      observer.observe(rootEl, {
        childList: true,
        subtree: true,
        characterData: true
      });
      console.log('[Antigravity] Chinese DOM localization active.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTranslator);
  } else {
    startTranslator();
  }

  // Continuous periodic check for dynamic menus & popups
  setInterval(() => {
    injectLocalizationStyles();
    const rootEl = document.body || document.documentElement;
    if (rootEl) processNode(rootEl);
  }, 500);
})();