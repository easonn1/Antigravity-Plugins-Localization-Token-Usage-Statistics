/**
 * Antigravity Plugin: 上下文 Token 实时统计徽章 (Context Token Counter)
 * 版本: 8.2.0 (Native IPC Bridge, Zero-Reset Guard, Safe Right-Side Alignment)
 */
(function() {
  if (window.__ag_token_injected_v82) return;
  window.__ag_token_injected_v82 = true;

  let currentTokens = 0;
  let currentLimit = 1000000;
  let currentDisplay = '1.0M';
  let currentLogPath = '';
  let _lastRenderedText = '';
  let _lastDotColor = '';

  function detectExactModel() {
    try {
      const allButtons = Array.from(document.querySelectorAll('button'));
      for (const b of allButtons) {
        if (b.closest('[role="menu"], [role="listbox"], [data-radix-popper-content-wrapper], [data-floating-ui-portal]')) continue;
        const t = (b.innerText || '').trim();
        if (t.startsWith('Gemini') || t.startsWith('Claude') || t.startsWith('GPT-OSS')) {
          if (t.includes('Pro')) return { name: t, limit: 2000000, display: '2.0M' };
          if (t.includes('Flash')) return { name: t, limit: 1000000, display: '1.0M' };
          if (t.includes('Sonnet') || t.includes('Opus') || t.includes('Claude')) return { name: t, limit: 200000, display: '200k' };
          if (t.includes('GPT-OSS')) return { name: t, limit: 128000, display: '128k' };
        }
      }
    } catch (e) {}
    return { name: 'Gemini 3.8 Flash', limit: 1000000, display: '1.0M' };
  }

  function findModelTriggerButton() {
    try {
      const testIdBtn = document.querySelector('[data-testid="model-selector-trigger"]');
      if (testIdBtn) return testIdBtn;

      const allButtons = Array.from(document.querySelectorAll('button'));
      return allButtons.find(b => {
        if (b.closest('[role="menu"], [role="listbox"], [data-radix-popper-content-wrapper], [data-floating-ui-portal]')) {
          return false;
        }
        if (b.getAttribute('role') === 'menuitem') return false;
        const t = (b.innerText || '').trim();
        return t.startsWith('Gemini') || t.startsWith('Claude') || t.startsWith('GPT-OSS');
      });
    } catch (e) {
      return null;
    }
  }

  function getActiveUuid() {
    try {
      const m = location.href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      return m ? m[0] : null;
    } catch (e) {
      return null;
    }
  }

  async function fetchTokensFromIPC() {
    try {
      const electron = typeof electron_1 !== 'undefined' ? electron_1 : (typeof require === 'function' ? require('electron') : null);
      if (electron && electron.ipcRenderer) {
        const uuid = getActiveUuid();
        const res = await electron.ipcRenderer.invoke('token:get-count', uuid);
        if (res && typeof res.count === 'number' && res.count > 0) {
          currentTokens = res.count;
          if (res.file) currentLogPath = res.file;
          renderBadgeUI();
        }
      }
    } catch (e) {}
  }

  function renderBadgeUI() {
    try {
      const oldWrapper = document.getElementById('ag-token-wrapper');
      if (oldWrapper && oldWrapper.parentNode) {
        while (oldWrapper.firstChild) {
          oldWrapper.parentNode.insertBefore(oldWrapper.firstChild, oldWrapper);
        }
        oldWrapper.remove();
      }

      const modelBtn = findModelTriggerButton();
      if (!modelBtn || !modelBtn.parentElement) return;

      const parent = modelBtn.parentElement;
      if (parent.style.display !== 'inline-flex') {
        parent.style.display = 'inline-flex';
        parent.style.alignItems = 'center';
        parent.style.verticalAlign = 'middle';
      }

      let badge = document.getElementById('ag-token-counter-badge');
      let textNode = document.getElementById('ag-token-counter-text');

      if (currentTokens === 0 && textNode && textNode.innerText && !textNode.innerText.includes(': 0 /')) {
        return;
      }

      const modelInfo = detectExactModel();
      currentLimit = modelInfo.limit;
      currentDisplay = modelInfo.display;

      const tokensNum = currentTokens;
      let dispVal = tokensNum >= 1000000
        ? (tokensNum / 1000000.0).toFixed(2) + 'M'
        : tokensNum >= 1000
          ? (tokensNum / 1000.0).toFixed(1) + 'k'
          : String(tokensNum);
      const pct = ((tokensNum / currentLimit) * 100).toFixed(1);
      const dispText = '\u4e0a\u4e0b\u6587: ' + dispVal + ' / ' + currentDisplay + ' (' + pct + '%)';

      let dotColor = '#10b981';
      let dotGlow = '0 0 6px rgba(16, 185, 129, 0.6)';
      if (tokensNum / currentLimit > 0.85) {
        dotColor = '#ef4444';
        dotGlow = '0 0 6px rgba(239, 68, 68, 0.6)';
      } else if (tokensNum / currentLimit > 0.6) {
        dotColor = '#f59e0b';
        dotGlow = '0 0 6px rgba(245, 158, 11, 0.6)';
      }

      const tooltip = '\u5f53\u524d\u6a21\u578b: ' + modelInfo.name +
        '\n\u771f\u5b9e\u4e0a\u4e0b\u6587\u4e0a\u9650: ' + currentLimit.toLocaleString() + ' Tokens (' + currentDisplay + ')' +
        '\n\u5f53\u524d\u5df2\u6d88\u8017: ' + tokensNum.toLocaleString() + ' Tokens (' + pct + '%)' +
        (currentLogPath ? '\n\u6d3b\u8dc3\u65e5\u5fd7: ' + currentLogPath + '\n(\u70b9\u51fb\u4e00\u952e\u590d\u5236\u65e5\u5fd7\u8def\u5f84)' : '');

      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'ag-token-counter-badge';
        Object.assign(badge.style, {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '0 8px',
          marginLeft: '6px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#cbd5e1',
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
          transition: 'color 0.4s ease, background 0.4s ease'
        });

        const dot = document.createElement('span');
        dot.id = 'ag-token-counter-dot';
        Object.assign(dot.style, {
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: dotColor,
          display: 'inline-block',
          boxShadow: dotGlow,
          flexShrink: '0',
          transition: 'background 0.4s ease, box-shadow 0.4s ease'
        });
        badge.appendChild(dot);

        textNode = document.createElement('span');
        textNode.id = 'ag-token-counter-text';
        textNode.style.transition = 'opacity 0.25s ease';
        textNode.innerText = dispText;
        badge.appendChild(textNode);

        badge.title = tooltip;

        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          if (currentLogPath) {
            navigator.clipboard.writeText(currentLogPath).then(() => {
              const oldT = textNode.innerText;
              textNode.innerText = '\u5df2\u590d\u5236\u65e5\u5fd7\u8def\u5f84!';
              dot.style.background = '#3b82f6';
              setTimeout(() => {
                textNode.innerText = oldT;
                dot.style.background = dotColor;
              }, 1200);
            });
          }
        });

        modelBtn.insertAdjacentElement('afterend', badge);
        _lastRenderedText = dispText;
        _lastDotColor = dotColor;
      } else {
        if (badge.previousElementSibling !== modelBtn) {
          modelBtn.insertAdjacentElement('afterend', badge);
        }

        if (dispText !== _lastRenderedText) {
          if (textNode) {
            textNode.style.opacity = '0.4';
            setTimeout(() => {
              textNode.innerText = dispText;
              textNode.style.opacity = '1';
            }, 150);
          }
          badge.title = tooltip;
          _lastRenderedText = dispText;
        }

        if (dotColor !== _lastDotColor) {
          const dot = document.getElementById('ag-token-counter-dot');
          if (dot) {
            dot.style.background = dotColor;
            dot.style.boxShadow = dotGlow;
          }
          _lastDotColor = dotColor;
        }
      }
    } catch (e) {}
  }

  window.__ag_setExactTokens = function(num, logFile) {
    if (typeof num === 'number' && num > 0) {
      currentTokens = num;
      if (logFile) currentLogPath = logFile;
      renderBadgeUI();
    }
  };

  window.addEventListener('ag-set-tokens', function(e) {
    if (e.detail && typeof e.detail.tokens === 'number' && e.detail.tokens > 0) {
      currentTokens = e.detail.tokens;
      if (e.detail.logPath) currentLogPath = e.detail.logPath;
      renderBadgeUI();
    }
  });

  function update() {
    fetchTokensFromIPC();
    renderBadgeUI();
  }

  update();

  if (window.__ag_token_timer) clearInterval(window.__ag_token_timer);
  window.__ag_token_timer = setInterval(update, 2000);
})();
