/**
 * Antigravity 插件开发模板 (_template-plugin.js)
 *
 * 【如何添加新插件】
 * 1. 复制本文件并重命名为 `03-my-plugin.js`（文件名不以 `_` 开头即可自动识别）。
 * 2. 在下方编写您的自定义 JS 逻辑（支持 DOM 操作、Node.js 内置模块如 fs/path/os 等）。
 * 3. 打开【Antigravity 插件管理中心】即可看到新插件，并支持一键启用/禁用！
 */
(function() {
  if (window.__my_custom_plugin_injected) return;
  window.__my_custom_plugin_injected = true;

  console.log('[Antigravity Plugin: Custom Plugin] Initializing...');

  function init() {
    console.log('[Antigravity Plugin: Custom Plugin] Ready!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
