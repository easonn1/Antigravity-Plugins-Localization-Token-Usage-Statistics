/**
 * Antigravity Universal Patch Engine (Node.js)
 * 功能: 自动解包 app.asar，注入 内置双重防丢失汉化、Token 计数器、原生菜单汉化及外部插件加载器。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const APP_DIR = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity');
const RESOURCES_DIR = path.join(APP_DIR, 'resources');
const ASAR_PATH = path.join(RESOURCES_DIR, 'app.asar');
const BAK_PATH = path.join(RESOURCES_DIR, 'app.asar.bak');

const WORK_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'manager', 'workspace');
const EXTRACT_DIR = path.join(WORK_DIR, 'extracted');
const TEMP_ASAR = path.join(WORK_DIR, 'app.asar.patched');

function log(msg) {
  console.log('[PatchEngine] ' + msg);
}

function cleanUpdaterCache() {
  const updaterDir = path.join(process.env.LOCALAPPDATA || '', 'antigravity-updater');
  try {
    const pendingDir = path.join(updaterDir, 'pending');
    if (fs.existsSync(pendingDir)) {
      fs.rmSync(pendingDir, { recursive: true, force: true });
      log('Cleaned updater pending directory.');
    }
    const installerExe = path.join(updaterDir, 'installer.exe');
    if (fs.existsSync(installerExe)) {
      fs.unlinkSync(installerExe);
      log('Removed pending installer.exe.');
    }
  } catch (e) {
    log('Updater cleanup note: ' + e.message);
  }
}

function checkIsPatched() {
  if (!fs.existsSync(ASAR_PATH)) return false;
  try {
    const preloadInApp = path.join(RESOURCES_DIR, 'app', 'dist', 'preload.js');
    if (fs.existsSync(preloadInApp)) {
      const content = fs.readFileSync(preloadInApp, 'utf8');
      if (content.includes('__antigravity_token_counter_injected') || content.includes('Antigravity Chinese Localization Engine')) return true;
    }
  } catch (e) {}
  return false;
}

function extractAsarPure(asarPath, destDir) {
  const fd = fs.openSync(asarPath, 'r');
  const buf16 = Buffer.alloc(16);
  fs.readSync(fd, buf16, 0, 16, 0);
  const headerSize = buf16.readUInt32LE(12);
  const headerBuf = Buffer.alloc(headerSize);
  fs.readSync(fd, headerBuf, 0, headerSize, 16);
  const header = JSON.parse(headerBuf.toString('utf8'));
  const baseOffset = 16 + headerSize;

  function walk(node, curPath) {
    if (!fs.existsSync(curPath)) fs.mkdirSync(curPath, { recursive: true });
    for (const name of Object.keys(node)) {
      const info = node[name];
      const targetPath = path.join(curPath, name);
      if (info.files) {
        walk(info.files, targetPath);
      } else if (info.offset !== undefined) {
        const offset = baseOffset + parseInt(info.offset, 10);
        const size = parseInt(info.size, 10);
        const fileBuf = Buffer.alloc(size);
        fs.readSync(fd, fileBuf, 0, size, offset);
        fs.writeFileSync(targetPath, fileBuf);
      }
    }
  }

  walk(header.files || {}, destDir);
  fs.closeSync(fd);
}

function packAsarPure(srcDir, destFile) {
  const fileList = [];
  
  function walkDir(dir, relPath) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const node = {};
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const subRel = relPath ? `${relPath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        node[entry.name] = { files: walkDir(fullPath, subRel) };
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        fileList.push({ fullPath, size: stat.size });
        node[entry.name] = { size: stat.size, offset: '0' };
      }
    }
    return node;
  }

  const rootFiles = walkDir(srcDir, '');
  
  let curOffset = 0;
  function updateOffsets(node) {
    for (const key of Object.keys(node)) {
      const item = node[key];
      if (item.files) {
        updateOffsets(item.files);
      } else if (item.size !== undefined) {
        item.offset = String(curOffset);
        curOffset += item.size;
      }
    }
  }
  updateOffsets(rootFiles);

  const headerObj = { files: rootFiles };
  let headerJson = JSON.stringify(headerObj);
  
  // Ensure header JSON byte length is strictly a multiple of 4
  let headerBuf = Buffer.from(headerJson, 'utf8');
  const remainder = headerBuf.length % 4;
  if (remainder !== 0) {
    const padCount = 4 - remainder;
    headerObj.__pad = ' '.repeat(padCount > 10 ? padCount : padCount + 4);
    headerJson = JSON.stringify(headerObj);
    headerBuf = Buffer.from(headerJson, 'utf8');
    const rem2 = headerBuf.length % 4;
    if (rem2 !== 0) {
      headerObj.__pad = ' '.repeat(headerObj.__pad.length + 4 - rem2);
      headerJson = JSON.stringify(headerObj);
      headerBuf = Buffer.from(headerJson, 'utf8');
    }
  }

  const headerSize = headerBuf.length;
  const header16 = Buffer.alloc(16);
  header16.writeUInt32LE(4, 0);
  header16.writeUInt32LE(headerSize + 8, 4);
  header16.writeUInt32LE(headerSize + 4, 8);
  header16.writeUInt32LE(headerSize, 12);

  const outFd = fs.openSync(destFile, 'w');
  fs.writeSync(outFd, header16);
  fs.writeSync(outFd, headerBuf);

  const copyBuf = Buffer.alloc(1024 * 1024);
  for (const f of fileList) {
    const inFd = fs.openSync(f.fullPath, 'r');
    let bytesRead = 0;
    while ((bytesRead = fs.readSync(inFd, copyBuf, 0, copyBuf.length, null)) > 0) {
      fs.writeSync(outFd, copyBuf, 0, bytesRead);
    }
    fs.closeSync(inFd);
  }
  fs.closeSync(outFd);
}

function applyPatch() {
  log('Starting patch process...');
  if (!fs.existsSync(RESOURCES_DIR)) {
    throw new Error('Antigravity resources directory not found at: ' + RESOURCES_DIR);
  }

  // 1. Clean updater
  cleanUpdaterCache();

  // 2. Prepare workspace
  if (fs.existsSync(EXTRACT_DIR)) {
    fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(EXTRACT_DIR, { recursive: true });

  // 3. Smart Backup & Source selection:
  // If ASAR_PATH is an official clean update (doesn't contain our markers),
  // update BAK_PATH with this new official version, so we extract from the NEW version!
  let isCurrentAsarPatched = false;
  if (fs.existsSync(ASAR_PATH)) {
    try {
      const fd = fs.openSync(ASAR_PATH, 'r');
      const sampleBuf = Buffer.alloc(Math.min(1024 * 1024 * 4, fs.statSync(ASAR_PATH).size));
      fs.readSync(fd, sampleBuf, 0, sampleBuf.length, 0);
      fs.closeSync(fd);
      const str = sampleBuf.toString('utf8');
      if (str.includes('ag-token-counter-badge') || str.includes('Antigravity Chinese Localization Engine')) {
        isCurrentAsarPatched = true;
      }
    } catch (e) {}
  }

  if (!isCurrentAsarPatched && fs.existsSync(ASAR_PATH)) {
    fs.copyFileSync(ASAR_PATH, BAK_PATH);
    log('Detected fresh official update. Updated backup: ' + BAK_PATH);
  } else if (!fs.existsSync(BAK_PATH) && fs.existsSync(ASAR_PATH)) {
    fs.copyFileSync(ASAR_PATH, BAK_PATH);
    log('Created initial backup: ' + BAK_PATH);
  }

  const srcAsar = fs.existsSync(BAK_PATH) ? BAK_PATH : ASAR_PATH;
  log('Extracting asar archive from: ' + srcAsar);
  extractAsarPure(srcAsar, EXTRACT_DIR);
  log('Extract complete.');

  // 4.1 Inject IPC Handlers for token:get-count & usage:get-stats in ipcHandlers.js
  const ipcPath = path.join(EXTRACT_DIR, 'dist', 'ipcHandlers.js');
  if (fs.existsSync(ipcPath)) {
    let ipcCode = fs.readFileSync(ipcPath, 'utf8');
    
    // Check if token:get-count already defined
    const hasToken = ipcCode.includes("token:get-count");
    const hasUsage = ipcCode.includes("usage:get-stats");
    
    if (!hasToken || !hasUsage) {
      const cacheDef = "\n    let tokenCache = { uuid: null, mtime: 0, count: 0, file: null };\n    let usageStatsCache = { data: null, time: 0 };\n";
      const targetFn = "function registerIpcHandlers(storageManager) {";
      if (!ipcCode.includes("let tokenCache =") && ipcCode.includes(targetFn)) {
        ipcCode = ipcCode.replace(targetFn, targetFn + cacheDef, 1);
      }
      
      let newHandlers = '';
      if (!hasToken) {
        newHandlers += `
    // Custom Token counter handler
    electron_1.ipcMain.handle('token:get-count', async (_event, activeUuid) => {
        try {
            const fsSync = require('fs');
            const pathSync = require('path');
            const osSync = require('os');
            const brainDir = pathSync.join(osSync.homedir(), '.gemini', 'antigravity', 'brain');
            if (!fsSync.existsSync(brainDir)) return { count: 0, file: null };
            
            let latestFile = null;
            let latestMtime = 0;
            let targetUuid = activeUuid;
            
            if (targetUuid && typeof targetUuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) {
                const logFile = pathSync.join(brainDir, targetUuid, '.system_generated', 'logs', 'transcript.jsonl');
                if (fsSync.existsSync(logFile)) {
                    latestFile = logFile;
                    const stat = fsSync.statSync(logFile);
                    latestMtime = stat.mtimeMs;
                }
            }
            
            if (!latestFile) {
                const dirs = fsSync.readdirSync(brainDir);
                for (const dir of dirs) {
                    const logFile = pathSync.join(brainDir, dir, '.system_generated', 'logs', 'transcript.jsonl');
                    if (fsSync.existsSync(logFile)) {
                        const stat = fsSync.statSync(logFile);
                        if (stat.mtimeMs > latestMtime) {
                            latestMtime = stat.mtimeMs;
                            latestFile = logFile;
                            targetUuid = dir;
                        }
                    }
                }
            }
            
            if (!latestFile) return { count: 0, file: null };
            
            if (typeof tokenCache !== 'undefined' && 
                tokenCache.file === latestFile && 
                tokenCache.mtime === latestMtime && 
                tokenCache.uuid === targetUuid &&
                tokenCache.count > 0) {
                return { count: tokenCache.count, file: latestFile, mtime: latestMtime };
            }
            
            const content = fsSync.readFileSync(latestFile, 'utf8');
            const lines = content.split('\\n');
            let totalChinese = 0;
            let totalEnglish = 0;
            
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    if (data.content) {
                        for (let i = 0; i < data.content.length; i++) {
                            const char = data.content[i];
                            if (char >= '\\u4e00' && char <= '\\u9fff') {
                                totalChinese += 1;
                            } else {
                                totalEnglish += 1;
                            }
                        }
                    }
                    if (data.thinking) {
                        for (let i = 0; i < data.thinking.length; i++) {
                            const char = data.thinking[i];
                            if (char >= '\\u4e00' && char <= '\\u9fff') {
                                totalChinese += 1;
                            } else {
                                totalEnglish += 1;
                            }
                        }
                    }
                    if (data.tool_calls) {
                        const tcStr = JSON.stringify(data.tool_calls);
                        for (let i = 0; i < tcStr.length; i++) {
                            const char = tcStr[i];
                            if (char >= '\\u4e00' && char <= '\\u9fff') {
                                totalChinese += 1;
                            } else {
                                totalEnglish += 1;
                            }
                        }
                    }
                } catch (e) {}
            }
            
            const tokens = Math.round((totalEnglish / 4) + (totalChinese * 1.5));
            
            if (typeof tokenCache !== 'undefined') {
                tokenCache = {
                    uuid: targetUuid || null,
                    mtime: latestMtime,
                    count: tokens,
                    file: latestFile
                };
            }
            
            return { count: tokens, file: latestFile, mtime: latestMtime };
        } catch (err) {
            return { count: 0, file: null, error: err.message };
        }
    });
`;
      }

      if (!hasUsage) {
        newHandlers += `
    // Usage Intelligence Stats Handlers
    electron_1.ipcMain.handle('usage:get-stats', async (_event, options) => {
        try {
            const forceRefresh = options && options.forceRefresh;
            const now = Date.now();
            if (!forceRefresh && typeof usageStatsCache !== 'undefined' && usageStatsCache.data && (now - usageStatsCache.time < 15000)) {
                return { success: true, data: usageStatsCache.data, cached: true };
            }

            const fsSync = require('fs');
            const pathSync = require('path');
            const osSync = require('os');
            const cpSync = require('child_process');

            const homeDir = osSync.homedir();
            const candidatesCollector = [
                pathSync.join(homeDir, '.gemini', 'antigravity', 'plugins', 'collector.py')
            ];
            let collectorPath = null;
            for (const p of candidatesCollector) {
                if (fsSync.existsSync(p)) {
                    collectorPath = p;
                    break;
                }
            }
            if (!collectorPath) {
                return { success: false, error: 'collector.py 未在插件目录中找到' };
            }

            const candidatesPy = [
                'C:\\\\Program Files\\\\Python312\\\\python.exe',
                'C:\\\\Program Files\\\\Python311\\\\python.exe',
                'C:\\\\Program Files\\\\Python310\\\\python.exe',
                'python',
                'py'
            ];
            let pythonBin = 'python';
            for (const py of candidatesPy) {
                try {
                    if (py.includes('\\\\') && fsSync.existsSync(py)) {
                        pythonBin = py;
                        break;
                    }
                } catch(e) {}
            }

            return new Promise((resolve) => {
                cpSync.execFile(pythonBin, [collectorPath, '--json'], {
                    maxBuffer: 25 * 1024 * 1024,
                    timeout: 25000,
                    windowsHide: true
                }, (err, stdout, stderr) => {
                    if (err) {
                        console.error('[UsageIntel:Main] Collector failed:', err);
                        if (typeof usageStatsCache !== 'undefined' && usageStatsCache.data) {
                            return resolve({ success: true, data: usageStatsCache.data, fallback: true, error: err.message });
                        }
                        return resolve({ success: false, error: err.message, stderr: stderr });
                    }
                    try {
                        const json = JSON.parse(stdout.trim());
                        if (typeof usageStatsCache !== 'undefined') {
                            usageStatsCache = { data: json, time: Date.now() };
                        }
                        resolve({ success: true, data: json });
                    } catch (parseErr) {
                        console.error('[UsageIntel:Main] JSON parse error:', parseErr);
                        resolve({ success: false, error: 'JSON parse error: ' + parseErr.message });
                    }
                });
            });
        } catch (fatalErr) {
            console.error('[UsageIntel:Main] Exception in usage:get-stats:', fatalErr);
            return { success: false, error: fatalErr.message };
        }
    });

    electron_1.ipcMain.handle('usage:open-dashboard', async () => {
        try {
            const fsSync = require('fs');
            const pathSync = require('path');
            const osSync = require('os');
            const homeDir = osSync.homedir();
            const candidates = [
                pathSync.join(homeDir, '.gemini', 'antigravity', 'plugins', 'dashboard.html')
            ];
            let targetHtml = null;
            for (const p of candidates) {
                if (fsSync.existsSync(p)) {
                    targetHtml = p;
                    break;
                }
            }
            if (targetHtml) {
                try {
                    let statsToInject = (typeof usageStatsCache !== 'undefined' && usageStatsCache.data) ? usageStatsCache.data : null;
                    if (statsToInject) {
                        let htmlContent = fsSync.readFileSync(targetHtml, 'utf8');
                        const dataPattern = /const statsData = \{[\s\S]*?\};/;
                        const newStatement = 'const statsData = ' + JSON.stringify(statsToInject) + ';';
                        if (dataPattern.test(htmlContent)) {
                            htmlContent = htmlContent.replace(dataPattern, () => newStatement);
                            fsSync.writeFileSync(targetHtml, htmlContent, 'utf8');
                        }
                    }
                } catch(e) {}
                if (electron_1.shell && typeof electron_1.shell.openPath === 'function') {
                    await electron_1.shell.openPath(targetHtml);
                } else if (electron_1.shell && typeof electron_1.shell.openExternal === 'function') {
                    await electron_1.shell.openExternal('file:///' + targetHtml.replace(/\\\\/g, '/'));
                }
                return { success: true, path: targetHtml };
            }
            return { success: false, error: 'dashboard.html 未找到' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });
`;
      }

      const lastBrace = ipcCode.lastIndexOf("}");
      if (lastBrace !== -1) {
        ipcCode = ipcCode.substring(0, lastBrace) + newHandlers + '\n}';
        fs.writeFileSync(ipcPath, ipcCode, 'utf8');
        log('ipcHandlers.js injected with token and usage intelligence IPC handlers.');
      }
    }
  }

  // 5. Inject complete Chinese Localization + Token Counter + Usage Intelligence directly into preload.js
  const preloadPath = path.join(EXTRACT_DIR, 'dist', 'preload.js');
  if (!fs.existsSync(preloadPath)) {
    throw new Error('preload.js not found in extracted asar!');
  }
  let preloadCode = fs.readFileSync(preloadPath, 'utf8');
  
  // Clean any old injected markers
  const cleanMarkers = [
    '// ================= Antigravity Universal Plugin Loader =================',
    '// ==================== Context Token Counter Plugin ====================',
    '// Antigravity Plugin: 📊 用量智脑 (Usage Intelligence)',
    '// Antigravity Chinese Localization Engine'
  ];
  for (const m of cleanMarkers) {
    const idx = preloadCode.indexOf(m);
    if (idx !== -1) {
      preloadCode = preloadCode.substring(0, idx).trimEnd();
    }
  }

  // Read the latest active plugins
  const p1_path = path.join(os.homedir(), '.gemini', 'antigravity', 'plugins', '01-chinese-localization.js');
  const p2_path = path.join(os.homedir(), '.gemini', 'antigravity', 'plugins', '02-context-token-counter.js');
  const p3_path = path.join(os.homedir(), '.gemini', 'antigravity', 'plugins', '03-usage-intelligence.js');
  
  const p1_code = fs.existsSync(p1_path) ? fs.readFileSync(p1_path, 'utf8') : '';
  const p2_code = fs.existsSync(p2_path) ? fs.readFileSync(p2_path, 'utf8') : '';
  const p3_code = fs.existsSync(p3_path) ? fs.readFileSync(p3_path, 'utf8') : '';

  preloadCode = preloadCode + '\n\n' + p1_code + '\n\n' + p2_code + '\n\n' + p3_code + '\n';
  fs.writeFileSync(preloadPath, preloadCode, 'utf8');
  log('preload.js injected with complete Chinese Localization, Token Counter & Usage Intelligence.');

  // 6. Inject Menu localization
  const menuPath = path.join(EXTRACT_DIR, 'dist', 'menu.js');
  if (fs.existsSync(menuPath)) {
    let menuCode = fs.readFileSync(menuPath, 'utf8');
    const menuStartMarker = '// Antigravity Native Menu Translator';
    const mIdx = menuCode.indexOf(menuStartMarker);
    if (mIdx !== -1) {
      menuCode = menuCode.substring(0, mIdx).trimEnd();
    }
    const menuInjection = `
// Antigravity Native Menu Translator
const menuTranslationMap = {
  'File': '文件', 'Edit': '编辑', 'View': '视图', 'Window': '窗口', 'Help': '帮助',
  'New Window': '新建窗口', 'New Conversation': '新建对话', 'Close Window': '关闭窗口',
  'Docs': '使用文档', 'Docs & API Reference': '文档与 API 参考',
  'Toggle Developer Tools': '开发者工具', 'Check for Updates': '检查更新',
  'Checking for Updates...': '正在检查更新...', 'Downloading Update...': '正在下载更新...',
  'Restart to Update': '重启以应用更新', 'Undo': '撤销', 'Redo': '重做',
  'Cut': '剪切', 'Copy': '复制', 'Paste': '粘贴', 'Select All': '全选',
  'Minimize': '最小化', 'Close': '关闭', 'Quit Antigravity': '退出 Antigravity',
  'About Antigravity': '关于 Antigravity', 'Services': '服务', 'Hide Antigravity': '隐藏 Antigravity',
  'Hide Others': '隐藏其他', 'Show All': '显示全部', 'Force Reload': '强制重新加载',
  'Reload': '重新加载', 'Actual Size': '实际大小', 'Zoom In': '放大', 'Zoom Out': '缩小',
  'Toggle Full Screen': '切换全屏'
};
function translateMenu(menuItem) {
  if (menuItem.label && menuTranslationMap[menuItem.label]) {
    menuItem.label = menuTranslationMap[menuItem.label];
  }
  if (menuItem.submenu && menuItem.submenu.items) {
    menuItem.submenu.items.forEach(translateMenu);
  }
  if (menuItem.submenu && Array.isArray(menuItem.submenu)) {
    menuItem.submenu.forEach(translateMenu);
  }
}
try {
  const electron_menu = require('electron');
  if (electron_menu && electron_menu.Menu && electron_menu.Menu.buildFromTemplate && !electron_menu.Menu.__isTranslated) {
    const origBuild = electron_menu.Menu.buildFromTemplate;
    electron_menu.Menu.buildFromTemplate = function(tpl) {
      if (tpl && Array.isArray(tpl)) tpl.forEach(translateMenu);
      return origBuild.call(this, tpl);
    };
    electron_menu.Menu.__isTranslated = true;
  }
} catch(e) {}
`;
    menuCode = menuCode + '\n\n' + menuInjection + '\n';
    if (!menuCode.includes('if (typeof translateMenu === "function")')) {
      menuCode = menuCode.replace(
        'electron_1.Menu.setApplicationMenu(menu);',
        'if (typeof translateMenu === "function") { menu.items.forEach(translateMenu); } electron_1.Menu.setApplicationMenu(menu);'
      );
    }
    fs.writeFileSync(menuPath, menuCode, 'utf8');
    log('menu.js native translation updated.');
  }

  // 7. Inject Tray & Loading
  const trayPath = path.join(EXTRACT_DIR, 'dist', 'tray.js');
  if (fs.existsSync(trayPath)) {
    let tc = fs.readFileSync(trayPath, 'utf8');
    tc = tc.replace(/'Show Antigravity'/g, "'显示 Antigravity'").replace(/'Quit'/g, "'退出'");
    fs.writeFileSync(trayPath, tc, 'utf8');
    log('tray.js updated.');
  }

  const loadingPath = path.join(EXTRACT_DIR, 'dist', 'loadingOverlay.js');
  if (fs.existsSync(loadingPath)) {
    let lc = fs.readFileSync(loadingPath, 'utf8');
    lc = lc.replace(/>Loading Antigravity</g, '>正在加载 Antigravity<');
    fs.writeFileSync(loadingPath, lc, 'utf8');
    log('loadingOverlay.js updated.');
  }

  // 8. Repack into asar with pure JS 4-byte aligned packer
  log('Repacking asar with perfect 4-byte alignment...');
  if (fs.existsSync(TEMP_ASAR)) fs.unlinkSync(TEMP_ASAR);
  packAsarPure(EXTRACT_DIR, TEMP_ASAR);

  // 9. Deploy to resources/app.asar and resources/app
  log('Deploying patched package...');
  fs.copyFileSync(TEMP_ASAR, path.join(RESOURCES_DIR, 'app.asar.patched'));
  try {
    fs.copyFileSync(TEMP_ASAR, ASAR_PATH);
    log('Updated app.asar in place.');
  } catch (e) {
    log('app.asar in-place notice: ' + e.message);
  }

  const appUnpacked = path.join(RESOURCES_DIR, 'app');
  if (fs.existsSync(appUnpacked)) {
    try { fs.rmSync(appUnpacked, { recursive: true, force: true }); } catch (e) {}
  }
  fs.cpSync(EXTRACT_DIR, appUnpacked, { recursive: true });
  log('Updated resources/app folder successfully.');

  log('SUCCESS: Antigravity Universal Plugin Loader & Menus patched successfully!');
}

function restoreOriginal() {
  log('Restoring official backup...');
  if (fs.existsSync(BAK_PATH)) {
    try {
      fs.copyFileSync(BAK_PATH, ASAR_PATH);
      log('Restored official app.asar from backup.');
    } catch (e) {
      log('Error copying app.asar: ' + e.message);
    }
  }
  const appUnpacked = path.join(RESOURCES_DIR, 'app');
  if (fs.existsSync(appUnpacked)) {
    try { fs.rmSync(appUnpacked, { recursive: true, force: true }); } catch (e) {}
    log('Removed resources/app folder.');
  }
  log('SUCCESS: Restored to official state.');
}

const action = process.argv[2] || 'patch';
if (action === 'patch') {
  applyPatch();
} else if (action === 'restore') {
  restoreOriginal();
} else if (action === 'check') {
  const patched = checkIsPatched();
  console.log(patched ? 'PATCHED' : 'UNPATCHED');
} else {
  console.log('Usage: node patch_engine.js [patch|restore|check]');
}
