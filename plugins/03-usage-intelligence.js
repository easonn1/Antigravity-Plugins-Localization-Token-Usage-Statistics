/**
 * Antigravity Usage Intelligence - Desktop Client Native Plugin
 * --------------------------------------------------------------------------
 * Original Concept: https://github.com/Nir-Bhay/antigravity-usage-intelligence
 * Original Author : Nirbhay Hiwse (https://github.com/Nir-Bhay)
 * License         : MIT License
 * Ported & Adapted: Reverse-engineered and adapted into Antigravity Electron
 *                   native preload/IPC architecture with 100% full Chinese localization
 *                   by easonn1 (https://github.com/easonn1)
 * --------------------------------------------------------------------------
 */
/**
 * Antigravity Plugin: 📊 用量智脑 (Usage Intelligence)
 * 版本: 1.2.0 (Pure Sandbox IPC Architecture, High-Definition Dark Glassmorphism)
 * 功能: 深度分析 Antigravity 交互日志与配额，提供实时 Token 消耗、Prompt 缓存节省、思考 Token 占比、活跃热力图与 24h 峰值时段分析。
 */
(function() {
  if (window.__ag_usage_intelligence_injected) return;
  window.__ag_usage_intelligence_injected = true;

  // 渲染进程严格沙盒环境，仅允许使用 electron 的 IPC Bridge
  const electron = typeof electron_1 !== 'undefined' ? electron_1 : (typeof require === 'function' ? (function() {
    try { return require('electron'); } catch (e) { return null; }
  })() : (window.electron || null));

  let cachedStats = null;
  let isFetching = false;
  let modalVisible = false;

  // 格式化数字 (如 933.2M, 1.2B, 15.4k)
  function formatNum(num) {
    if (num == null) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  // 查找模型切换按钮（作为定位参考点）
  function findModelTriggerButton() {
    try {
      const testIdBtn = document.querySelector('[data-testid="model-selector-trigger"]');
      if (testIdBtn) return testIdBtn;

      const allButtons = Array.from(document.querySelectorAll('button'));
      return allButtons.find(b => {
        if (b.closest('[role="menu"], [role="listbox"], [data-radix-popper-content-wrapper], [data-floating-ui-portal]')) return false;
        if (b.getAttribute('role') === 'menuitem') return false;
        const t = (b.innerText || '').trim();
        return t.startsWith('Gemini') || t.startsWith('Claude') || t.startsWith('GPT-OSS');
      });
    } catch (e) {
      return null;
    }
  }

  // 通过主进程 IPC 异步获取用量数据
  async function fetchStats(forceRefresh, callback) {
    if (isFetching) return;
    if (cachedStats && !forceRefresh) {
      if (callback) callback(cachedStats);
      return;
    }

    if (!electron || !electron.ipcRenderer) {
      console.warn('[UsageIntel] electron.ipcRenderer not available in renderer.');
      return;
    }

    isFetching = true;
    try {
      const res = await electron.ipcRenderer.invoke('usage:get-stats', { forceRefresh: !!forceRefresh });
      if (res && res.success && res.data) {
        cachedStats = res.data;
        updateBadgeSummary(cachedStats);
        if (callback) callback(cachedStats);
        if (modalVisible) renderModalContent(cachedStats);
      } else {
        console.warn('[UsageIntel] Failed to get stats from IPC:', res ? res.error : 'Unknown response');
        if (modalVisible) renderErrorContent(res ? res.error : '无法获取统计数据');
      }
    } catch (err) {
      console.error('[UsageIntel] IPC call exception:', err);
      if (modalVisible) renderErrorContent(err.message);
    } finally {
      isFetching = false;
    }
  }

  // 通过主进程 IPC 打开独立网页大屏看板
  async function openBrowserDashboard() {
    try {
      if (electron && electron.ipcRenderer) {
        await electron.ipcRenderer.invoke('usage:open-dashboard');
      }
    } catch (err) {
      console.error('[UsageIntel] Failed to open browser dashboard:', err);
    }
  }

  // 更新徽标上的微标签与提示文案
  function updateBadgeSummary(data) {
    try {
      const badge = document.getElementById('ag-usage-intelligence-badge');
      if (!badge || !data) return;

      const total = (data.summary && data.summary.total_tokens) || 0;
      const formatted = formatNum(total);

      let tag = document.getElementById('ag-usage-intel-tag');
      if (!tag) {
        tag = document.createElement('span');
        tag.id = 'ag-usage-intel-tag';
        Object.assign(tag.style, {
          marginLeft: '4px',
          fontSize: '10px',
          fontWeight: '600',
          padding: '1px 5px',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.22)',
          color: '#bae6fd',
          lineHeight: '1.2'
        });
        badge.appendChild(tag);
      }
      tag.textContent = formatted;

      const s = data.summary || {};
      const st = data.streaks || {};
      badge.title = `Antigravity 用量与配额智脑\n● 总用量: ${formatNum(s.total_tokens || 0)} Tokens (Prompt 缓存节省: ${s.cache_hit_rate_pct || 0}%)\n● 连续活跃: ${st.current_streak || 0} 天 · 累计活跃: ${st.active_days || 0} 天\n● 会话总计: ${s.total_sessions || 0} 个 · 对话轮次: ${s.total_turns || 0} 轮\n● 工具可靠率: ${s.tool_success_rate_pct || 97}%\n\n【点击打开】查看多维度交互智脑看板`;
    } catch (e) {}
  }

  // 注入底部工具栏徽章与事件绑定
  function ensureBadgeInDOM() {
    try {
      const modelBtn = findModelTriggerButton();
      const contextBadge = document.getElementById('ag-token-counter-badge');

      // 1. 给现有的 Context Token 徽标增加点击打开看板能力
      if (contextBadge && !contextBadge.__ag_intel_bound) {
        contextBadge.__ag_intel_bound = true;
        contextBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          openModal();
        });
        contextBadge.style.cursor = 'pointer';
        contextBadge.title = (contextBadge.title || '') + '\n\n【点击打开】Antigravity 用量与配额智脑看板';
      }

      // 2. 检查并注入独立的「用量智脑」徽标
      const existingBadge = document.getElementById('ag-usage-intelligence-badge');
      if (existingBadge && document.body.contains(existingBadge)) {
        if (cachedStats) updateBadgeSummary(cachedStats);
        return;
      }

      // 挂载点首选在 contextBadge 后面，其次在 modelBtn 后面
      const mountTarget = contextBadge || modelBtn;
      if (!mountTarget || !mountTarget.parentElement) return;

      const parent = mountTarget.parentElement;
      if (parent.style.display !== 'inline-flex') {
        parent.style.display = 'inline-flex';
        parent.style.alignItems = 'center';
        parent.style.verticalAlign = 'middle';
      }

      const badge = document.createElement('span');
      badge.id = 'ag-usage-intelligence-badge';
      badge.innerHTML = '<span style="font-size:12px;margin-right:3px;">📊</span>用量智脑';
      Object.assign(badge.style, {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 8px',
        marginLeft: '6px',
        borderRadius: '12px',
        background: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        color: '#38bdf8',
        fontSize: '11px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
        fontWeight: '500',
        height: '24px',
        lineHeight: '24px',
        boxSizing: 'border-box',
        verticalAlign: 'middle',
        cursor: 'pointer',
        userSelect: 'none',
        pointerEvents: 'auto',
        flexShrink: '0',
        whiteSpace: 'nowrap',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      });

      badge.title = 'Antigravity 用量与配额智脑\n点击打开实时用量统计、模型分布与活跃热力图看板';

      badge.addEventListener('mouseenter', () => {
        badge.style.background = 'rgba(56, 189, 248, 0.24)';
        badge.style.borderColor = 'rgba(56, 189, 248, 0.55)';
        badge.style.boxShadow = '0 0 8px rgba(56, 189, 248, 0.35)';
      });

      badge.addEventListener('mouseleave', () => {
        badge.style.background = 'rgba(56, 189, 248, 0.12)';
        badge.style.borderColor = 'rgba(56, 189, 248, 0.3)';
        badge.style.boxShadow = 'none';
      });

      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal();
      });

      mountTarget.insertAdjacentElement('afterend', badge);
      if (cachedStats) updateBadgeSummary(cachedStats);
    } catch (e) {
      console.error('[UsageIntel] Badge injection error:', e);
    }
  }

  // 打开弹窗模态框
  function openModal() {
    createOrShowModal();
    modalVisible = true;
    if (cachedStats) {
      renderModalContent(cachedStats);
    }
    fetchStats(false, (data) => {
      renderModalContent(data);
    });
  }

  // 关闭弹窗模态框
  function closeModal() {
    const modal = document.getElementById('ag-ui-modal-overlay');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      setTimeout(() => {
        modal.style.display = 'none';
        modalVisible = false;
      }, 200);
    }
  }

  // 创建或显示模态框
  function createOrShowModal() {
    let overlay = document.getElementById('ag-ui-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ag-ui-modal-overlay';
      Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: '999999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: '0',
        transition: 'opacity 0.22s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#f8fafc',
        userSelect: 'none'
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalVisible) closeModal();
      });

      const dialog = document.createElement('div');
      dialog.id = 'ag-ui-modal-dialog';
      Object.assign(dialog.style, {
        width: '900px',
        maxWidth: '92vw',
        maxHeight: '88vh',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      });

      dialog.innerHTML = `
        <!-- 头部导航与操作 -->
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; background: rgba(30, 41, 59, 0.6);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">📊</div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 15px; font-weight: 600; color: #f8fafc; letter-spacing: -0.2px;">Antigravity 用量与配额智脑</span>
                <span style="font-size: 10px; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 1px 6px; border-radius: 10px; font-weight: 500;">● 本地实时</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">100% 离线隐私分析 · 实时模型推理与 Prompt 缓存监控</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="ag-ui-btn-browser" style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-size: 12px; padding: 6px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: background 0.2s; font-weight: 500;">
              <span>🌐</span> 浏览器大屏
            </button>
            <button id="ag-ui-btn-refresh" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #e2e8f0; font-size: 12px; padding: 6px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: background 0.2s; font-weight: 500;">
              <span id="ag-ui-refresh-icon">🔄</span> 刷新
            </button>
            <button id="ag-ui-btn-close" style="background: transparent; border: none; color: #94a3b8; font-size: 18px; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; transition: all 0.2s;">✕</button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div id="ag-ui-modal-body" style="padding: 20px; overflow-y: auto; flex: 1;">
          <div style="text-align: center; padding: 40px 0; color: #94a3b8; font-size: 13px;">
            <div style="display: inline-block; width: 22px; height: 22px; border: 2px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: ag-spin 0.8s linear infinite; margin-bottom: 12px;"></div>
            <div>正在深度聚合 Antigravity 交互日志与配额数据...</div>
          </div>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // 绑定头部按钮事件
      document.getElementById('ag-ui-btn-close').onclick = closeModal;

      document.getElementById('ag-ui-btn-refresh').onclick = () => {
        const icon = document.getElementById('ag-ui-refresh-icon');
        if (icon) icon.style.display = 'inline-block';
        if (icon) icon.style.animation = 'ag-spin 0.8s linear infinite';

        fetchStats(true, (data) => {
          if (icon) icon.style.animation = 'none';
          renderModalContent(data);
        });
      };

      document.getElementById('ag-ui-btn-browser').onclick = () => {
        openBrowserDashboard();
      };

      // 注入旋转动画
      const style = document.createElement('style');
      style.innerHTML = `@keyframes ag-spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    });
  }

  // 渲染错误提示
  function renderErrorContent(msg) {
    const body = document.getElementById('ag-ui-modal-body');
    if (!body) return;
    body.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #f87171;">
        <div style="font-size: 32px; margin-bottom: 10px;">⚠️</div>
        <div style="font-size: 15px; font-weight: 600; color: #fca5a5; margin-bottom: 6px;">用量数据采集受阻</div>
        <div style="font-size: 12px; color: #94a3b8; max-width: 500px; margin: 0 auto; line-height: 1.6;">${msg || '未知错误，请检查后台 Python 环境或重新启动 Antigravity。'}</div>
      </div>
    `;
  }

  // 渲染弹窗内部核心数据
  function renderModalContent(data) {
    const body = document.getElementById('ag-ui-modal-body');
    if (!body || !data) return;

    const s = data.summary || {};
    const c = data.costs || {};
    const st = data.streaks || {};
    const models = data.models_list || [];
    const hourly = data.hourly || [];
    const daily = data.all_daily || [];

    const totalTokens = s.total_tokens || 0;
    const inputTokens = s.total_input_tokens || 0;
    const cachedTokens = s.total_cached_tokens || 0;
    const outputTokens = s.total_output_tokens || 0;
    const thinkingTokens = s.total_thinking_tokens || 0;
    const cacheHitPct = s.cache_hit_rate_pct != null ? s.cache_hit_rate_pct : 0;
    const thinkingPct = outputTokens > 0 ? ((thinkingTokens / outputTokens) * 100).toFixed(1) : '0';

    const recentDaily = daily.slice(-35);

    let html = `
      <!-- 4 大核心 KPI 卡片 -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
        <div style="background: rgba(255, 255, 255, 0.035); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px;">
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">🔢 总处理 Tokens</div>
          <div style="font-size: 20px; font-weight: 700; color: #38bdf8;">${formatNum(totalTokens)}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">输入: ${formatNum(inputTokens)} · 缓存: ${formatNum(cachedTokens)}</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.035); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px;">
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">⚡ Prompt 缓存节省率</div>
          <div style="font-size: 20px; font-weight: 700; color: #10b981;">${cacheHitPct}%</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">已节省 $${c.dollars_saved || 0} (${c.savings_pct || 0}%)</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.035); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px;">
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">🧠 思考与输出 Tokens</div>
          <div style="font-size: 20px; font-weight: 700; color: #a855f7;">${formatNum(outputTokens)}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">思考: ${formatNum(thinkingTokens)} (${thinkingPct}%)</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.035); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px;">
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">🎯 活跃打卡与连击</div>
          <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${st.current_streak || 0} 天连击</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${s.total_sessions || 0} 次会话 · ${s.total_turns || 0} 轮对话</div>
        </div>
      </div>

      <!-- 活跃打卡热力图 -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; display: flex; align-items: center; gap: 6px;">
            <span>📅</span> 历史活跃热力打卡 (最近 35 天)
          </div>
          <div style="font-size: 11px; color: #94a3b8;">累计活跃 ${st.active_days || 0} 天 · 最长连击 ${st.longest_streak || 0} 天</div>
        </div>
        <div style="display: flex; gap: 5px; flex-wrap: wrap; align-items: center;">
    `;

    for (const d of recentDaily) {
      const tot = d.total || 0;
      let bg = 'rgba(255, 255, 255, 0.05)';
      if (tot > 50000000) bg = '#10b981';
      else if (tot > 15000000) bg = '#059669';
      else if (tot > 2000000) bg = '#047857';
      else if (tot > 0) bg = '#065f46';

      const tip = `${d.date}: ${formatNum(tot)} Tokens (${d.sessions || 0} 会话, ${d.turns || 0} 轮)`;
      html += `<div title="${tip}" style="width: 18px; height: 18px; border-radius: 4px; background: ${bg}; cursor: pointer; transition: transform 0.15s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></div>`;
    }

    html += `
        </div>
      </div>

      <!-- 主力模型份额分布 -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          <span>🧠</span> 前沿模型份额与用量分布
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    for (const m of models.slice(0, 5)) {
      const share = m.share_pct || 0;
      html += `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span style="font-weight: 500; color: #f1f5f9;">${m.name}</span>
            <span style="color: #94a3b8;">${formatNum(m.total)} Tokens (${share}%)</span>
          </div>
          <div style="height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; width: ${share}%; background: linear-gradient(90deg, #38bdf8, #a855f7); border-radius: 3px;"></div>
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>

      <!-- 24 小时活跃时段分布 & 工具调用可靠率 -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>🕒</span> 24 小时峰值时段分布
          </div>
          <div style="display: flex; align-items: flex-end; gap: 3px; height: 60px; padding-top: 10px;">
    `;

    const maxH = Math.max(...hourly.map(h => h.tokens || 0), 1);
    for (let h = 0; h < 24; h++) {
      const hData = hourly[h] || { tokens: 0 };
      const barH = Math.max(Math.round(((hData.tokens || 0) / maxH) * 50), 3);
      const tip = `${h}:00 - ${h}:59: ${formatNum(hData.tokens || 0)} Tokens`;
      html += `<div title="${tip}" style="flex: 1; height: ${barH}px; background: #38bdf8; border-radius: 2px 2px 0 0; opacity: ${hData.tokens ? '0.85' : '0.2'};"></div>`;
    }

    html += `
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-top: 4px;">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>🛠️</span> 工具调用稳定性
          </div>
          <div style="font-size: 20px; font-weight: 700; color: #10b981; margin-bottom: 6px;">
            ${s.tool_success_rate_pct || 97.0}% 可靠率
          </div>
          <div style="font-size: 11px; color: #94a3b8;">
            累计执行 ${s.total_tool_calls || 0} 次工具调用 · 发生 ${s.total_tool_errors || 0} 次纠错重试
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #64748b;">
            主力工具: run_command · write_to_file · view_file · manage_task
          </div>
        </div>
      </div>
    `;

    body.innerHTML = html;
  }

  // 轮询维持 DOM 存在（适应单页路由与切换对话）
  setInterval(ensureBadgeInDOM, 1000);
  ensureBadgeInDOM();

  // 初始预拉取统计数据
  setTimeout(() => fetchStats(false), 1000);

  console.log('[UsageIntel] Antigravity Usage Intelligence plugin loaded successfully.');
})();
