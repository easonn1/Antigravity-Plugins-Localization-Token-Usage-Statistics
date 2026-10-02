/**
 * Antigravity Universal Patch Engine (Node.js)
 * 功能: 自动解包 app.asar，注入 内置双重防丢失汉化、Token 计数器、原生菜单汉化及外部插件加载器。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function resolveResourcesDir() {
  const customArg = process.argv[3];
  if (customArg && fs.existsSync(customArg) && (fs.existsSync(path.join(customArg, 'app.asar')) || fs.existsSync(path.join(customArg, 'app.asar.bak')))) {
    return customArg;
  }
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'resources'),
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'antigravity', 'resources'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'antigravity', 'resources'),
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'antigravity', 'resources')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && (fs.existsSync(path.join(c, 'app.asar')) || fs.existsSync(path.join(c, 'app.asar.bak')))) {
      return c;
    }
  }
  return path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'resources');
}

const RESOURCES_DIR = resolveResourcesDir();
const APP_DIR = path.dirname(RESOURCES_DIR);
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

// Paths the source archive stores *outside* the asar ("unpacked": true, bytes live in
// resources/app.asar.unpacked/...). Since Antigravity 2.18.1 those entries exist - 293 of
// them, the whole chrome-devtools-mcp package - and they carry no "offset" field, so the
// old extractor skipped them silently and the repacked archive lost them: the main process
// then died on require() and Antigravity would not start at all.
let UNPACKED_PATHS = new Set();

function extractAsarPure(asarPath, destDir) {
  const fd = fs.openSync(asarPath, 'r');
  const buf16 = Buffer.alloc(16);
  fs.readSync(fd, buf16, 0, 16, 0);
  const headerSize = buf16.readUInt32LE(12);
  const headerBuf = Buffer.alloc(headerSize);
  fs.readSync(fd, headerBuf, 0, headerSize, 16);
  const header = JSON.parse(headerBuf.toString('utf8'));
  // The file data section starts at the next 4-byte boundary after the header JSON.
  // Antigravity 2.17.0 happened to emit a header whose length was already a multiple of 4,
  // so 16 + headerSize looked correct; 2.18.1's header is 276013 bytes, which made every
  // extracted file start 3 bytes early (dist/menu.js began with ");" from the previous
  // entry) and the repacked archive was pure syntax errors - Antigravity would not launch.
  let baseOffset = 16 + headerSize;
  baseOffset += (4 - (baseOffset % 4)) % 4;
  const sidecar = path.join(path.dirname(asarPath), 'app.asar.unpacked');
  let lost = 0;

  function walk(node, curPath, rel) {
    if (!fs.existsSync(curPath)) fs.mkdirSync(curPath, { recursive: true });
    for (const name of Object.keys(node)) {
      const info = node[name];
      const targetPath = path.join(curPath, name);
      const subRel = rel ? rel + '/' + name : name;
      if (info.files) {
        walk(info.files, targetPath, subRel);
      } else if (info.unpacked) {
        UNPACKED_PATHS.add(subRel);
        const src = path.join(sidecar, ...subRel.split('/'));
        if (fs.existsSync(src)) {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.copyFileSync(src, targetPath);
        } else {
          lost++;
        }
      } else if (info.offset !== undefined) {
        const offset = baseOffset + parseInt(info.offset, 10);
        const size = parseInt(info.size, 10);
        const fileBuf = Buffer.alloc(size);
        fs.readSync(fd, fileBuf, 0, size, offset);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, fileBuf);
      }
    }
  }

  walk(header.files || {}, destDir, '');
  fs.closeSync(fd);
  if (lost) log('WARNING: ' + lost + ' unpacked entries had no file in app.asar.unpacked/');
  if (UNPACKED_PATHS.size) log('Extracted ' + UNPACKED_PATHS.size + ' unpacked entries from the sidecar archive.');
}

function packAsarPure(srcDir, destFile) {
  const fileList = [];
  const sidecarList = [];
  const sidecarDir = destFile + '.unpacked';

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
        if (UNPACKED_PATHS.has(subRel)) {
          // keep it out of the archive body, exactly like the official package does
          node[entry.name] = { size: stat.size, unpacked: true };
          sidecarList.push({ fullPath, rel: subRel, size: stat.size });
        } else {
          fileList.push({ fullPath, size: stat.size });
          node[entry.name] = { size: stat.size, offset: '0' };
        }
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
      } else if (item.size !== undefined && !item.unpacked) {
        item.offset = String(curOffset);
        curOffset += item.size;
      }
    }
  }
  updateOffsets(rootFiles);

  const headerObj = { files: rootFiles };
  let headerJson = JSON.stringify(headerObj);
  
  // Ensure header JSON byte length is strictly a multiple of 4 (100% mathematically convergent)
  let headerBuf = Buffer.from(headerJson, 'utf8');
  let padCount = 0;
  while (headerBuf.length % 4 !== 0) {
    padCount++;
    headerObj.__pad = ' '.repeat(padCount);
    headerJson = JSON.stringify(headerObj);
    headerBuf = Buffer.from(headerJson, 'utf8');
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

  // the unpacked entries must still be present on disk next to the new archive
  for (const f of sidecarList) {
    const dst = path.join(sidecarDir, ...f.rel.split('/'));
    let same = false;
    try { same = fs.existsSync(dst) && fs.statSync(dst).size === f.size; } catch (e) { same = false; }
    if (!same) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(f.fullPath, dst);
    }
  }
  if (sidecarList.length) log('Kept ' + sidecarList.length + ' files in app.asar.unpacked/.');
}

// ---------------------------------------------------------------------------
// Integrity gate
//
// The 2026-10-01 brick: this engine repacked app.asar after Antigravity's silent
// auto-update, the archive was byte-shifted throughout (package.json no longer parsed,
// every .js was a SyntaxError), yet the run logged "SUCCESS" and the guard logged
// "Verification PASSED" - because both only asked whether the files *exist*.
// verifyArchive() actually reads the archive back and compares it, file by file, to the
// tree it was built from, so any alignment/offset/truncation bug fails closed instead of
// deploying over a working install.
// ---------------------------------------------------------------------------

function asarIndex(archiveFile) {
  const fd = fs.openSync(archiveFile, 'r');
  const buf16 = Buffer.alloc(16);
  fs.readSync(fd, buf16, 0, 16, 0);
  const headerSize = buf16.readUInt32LE(12);
  if (headerSize <= 0 || headerSize > fs.fstatSync(fd).size) {
    fs.closeSync(fd);
    throw new Error('implausible header size ' + headerSize);
  }
  const headerBuf = Buffer.alloc(headerSize);
  fs.readSync(fd, headerBuf, 0, headerSize, 16);
  let header;
  try { header = JSON.parse(headerBuf.toString('utf8')); }
  catch (e) { fs.closeSync(fd); throw new Error('header JSON does not parse: ' + e.message); }
  let base = 16 + headerSize;
  base += (4 - (base % 4)) % 4;
  return { fd, header, base, size: fs.fstatSync(fd).size };
}

function flattenIndex(header, out) {
  (function walk(node, rel) {
    for (const name of Object.keys(node)) {
      const info = node[name];
      const r = rel ? rel + '/' + name : name;
      if (info && info.files) walk(info.files, r);
      else if (info && info.size !== undefined) out[r] = info;   // ignores the __pad key
    }
  })(header.files || {}, '');
  return out;
}

function listTree(dir, rel, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const r = rel ? rel + '/' + entry.name : entry.name;
    if (entry.isDirectory()) listTree(full, r, out);
    else if (entry.isFile()) out.push(r);
  }
  return out;
}

// Compare a packed archive against the tree it claims to have been built from.
// srcDir may be null, in which case only self-consistency is checked.
function verifyArchive(srcDir, archiveFile) {
  const problems = [];
  let idx;
  try { idx = asarIndex(archiveFile); }
  catch (e) { return { ok: false, problems: ['cannot read ' + path.basename(archiveFile) + ': ' + e.message] }; }

  try {
    const entries = flattenIndex(idx.header, {});
    const sidecar = archiveFile + '.unpacked';

    // a) no entry may point past the end of the archive
    let maxEnd = 0;
    for (const rel of Object.keys(entries)) {
      const info = entries[rel];
      if (info.unpacked) {
        if (!fs.existsSync(path.join(sidecar, ...rel.split('/')))) problems.push('unpacked entry missing on disk: ' + rel);
        continue;
      }
      maxEnd = Math.max(maxEnd, idx.base + Number(info.offset) + Number(info.size));
    }
    if (maxEnd > idx.size) problems.push(`content spans ${maxEnd} bytes but archive is ${idx.size} (truncated)`);

    // b) package.json must parse and its "main" must resolve inside the archive
    const pkg = entries['package.json'];
    if (!pkg) problems.push('package.json is not in the archive');
    else {
      const raw = Buffer.alloc(Number(pkg.size));
      fs.readSync(idx.fd, raw, 0, raw.length, idx.base + Number(pkg.offset));
      let meta = null;
      try { meta = JSON.parse(raw.toString('utf8')); }
      catch (e) { problems.push('package.json does not parse: ' + e.message + ' (first bytes ' + raw.subarray(0, 6).toString('hex') + ')'); }
      if (meta && meta.main) {
        const main = meta.main.replace(/\\/g, '/').replace(/^\.\//, '');
        if (!entries[main]) problems.push('package.json main "' + main + '" is not in the archive');
      }
    }

    // c) every .js must still look like JavaScript (a shift shows up as leading junk)
    let jsChecked = 0, jsFlagged = 0;
    for (const rel of Object.keys(entries)) {
      if (!rel.endsWith('.js') || entries[rel].unpacked) continue;
      if (jsChecked++ > 400 || jsFlagged >= 5) break;
      const info = entries[rel];
      const head = Buffer.alloc(Math.min(64, Number(info.size)));
      fs.readSync(idx.fd, head, 0, head.length, idx.base + Number(info.offset));
      const first = head.toString('utf8').replace(/^\uFEFF/, '').trimStart().slice(0, 1);
      if (info.size > 0 && !/["'/*(a-zA-Z_$]/.test(first)) {
        jsFlagged++;
        problems.push('js starts with junk: ' + rel + ' (' + head.subarray(0, 8).toString('hex') + ')');
      }
    }
    if (jsFlagged >= 5) problems.push('(more shifted .js files suppressed)');

    // d) the gold standard: byte-compare against the source tree
    if (srcDir && fs.existsSync(srcDir)) {
      const srcFiles = listTree(srcDir, '', []).sort();
      const archFiles = Object.keys(entries).sort();
      const srcSet = new Set(srcFiles), archSet = new Set(archFiles);
      for (const rel of srcFiles) if (!archSet.has(rel)) problems.push('dropped from archive: ' + rel);
      for (const rel of archFiles) if (!srcSet.has(rel)) problems.push('in archive but not in source: ' + rel);
      let compared = 0;
      for (const rel of srcFiles) {
        const info = entries[rel];
        if (!info || problems.length > 40) continue;
        const srcBuf = fs.readFileSync(path.join(srcDir, ...rel.split('/')));
        if (Number(info.size) !== srcBuf.length) { problems.push(`size drift ${rel}: source ${srcBuf.length} vs archive ${info.size}`); continue; }
        if (info.unpacked) {
          const side = path.join(sidecar, ...rel.split('/'));
          if (!fs.existsSync(side)) continue;                 // already reported in (a)
          if (!fs.readFileSync(side).equals(srcBuf)) problems.push('sidecar bytes differ: ' + rel);
        } else {
          const buf = Buffer.alloc(srcBuf.length);
          fs.readSync(idx.fd, buf, 0, buf.length, idx.base + Number(info.offset));
          if (!buf.equals(srcBuf)) problems.push('bytes differ: ' + rel);
        }
        compared++;
      }
      log(`Verified ${compared} files against the source tree.`);
    }
  } finally {
    fs.closeSync(idx.fd);
  }
  return { ok: problems.length === 0, problems };
}

function abortIfBroken(archiveFile, srcDir, stage) {
  const v = verifyArchive(srcDir, archiveFile);
  if (v.ok) return;
  log(`FATAL - ${stage}: archive failed verification, nothing was deployed.`);
  for (const p of v.problems.slice(0, 25)) log('  * ' + p);
  if (v.problems.length > 25) log(`  ... and ${v.problems.length - 25} more`);
  process.exitCode = 1;
  throw new Error('integrity gate: ' + v.problems[0]);
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

            const envSync = process.env;
            function tryAbs(p) {
                try { return !!(p && fsSync.existsSync(p)); } catch (e) { return false; }
            }
            function resolvePythonBin() {
                const cands = [];
                if (envSync.ANTIGRAVITY_PYTHON) cands.push(envSync.ANTIGRAVITY_PYTHON);
                const pf = envSync.ProgramFiles || pathSync.join('C:', 'Program Files');
                const lap = envSync.LOCALAPPDATA || '';
                const vers = ['313', '312', '311', '310'];
                for (const v of vers) cands.push(pathSync.join(pf, 'Python' + v, 'python.exe'));
                if (lap) {
                    for (const v of vers) cands.push(pathSync.join(lap, 'Programs', 'Python', 'Python' + v, 'python.exe'));
                }
                for (const p of cands) {
                    if (tryAbs(p)) return p;
                }
                // PATH-resolved names cannot be checked with existsSync; actually run them.
                for (const name of ['python', 'python3', 'py']) {
                    try {
                        cpSync.execFileSync(name, ['--version'], { windowsHide: true, stdio: 'ignore', timeout: 8000 });
                        return name;
                    } catch (e) {}
                }
                // No system Python at all: use the frozen dispatcher shipped by the
                // installer, which runs a .py through the bundled interpreter.
                const exeCands = [];
                if (envSync.ANTIGRAVITY_PLUGINS_EXE) exeCands.push(envSync.ANTIGRAVITY_PLUGINS_EXE);
                if (lap) exeCands.push(pathSync.join(lap, 'AntigravityPlugins', 'bin', 'AntigravityPlugins.exe'));
                for (const p of exeCands) {
                    if (tryAbs(p)) return p;
                }
                return null;
            }
            const pythonBin = resolvePythonBin();
            if (!pythonBin) {
                return { success: false, error: '未找到可用的 Python 解释器：请设置环境变量 ANTIGRAVITY_PYTHON 指向 python.exe，或重新运行安装器以部署随包运行时' };
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

  // 8b. Integrity gate - refuse to ship an archive that could not boot.
  abortIfBroken(TEMP_ASAR, EXTRACT_DIR, 'repacked archive');

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

  // 9b. Re-check what actually landed, so a locked or half-written copy (antivirus,
  // a still-running Antigravity) cannot be reported as a successful patch.
  abortIfBroken(ASAR_PATH, EXTRACT_DIR, 'installed app.asar');

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
  const v = verifyArchive(null, ASAR_PATH);
  if (!v.ok) {
    log('WARNING - the restored app.asar still does not verify:');
    for (const p of v.problems.slice(0, 10)) log('  * ' + p);
    log('  Reinstall Antigravity from the official installer if it will not start.');
    process.exitCode = 1;
    return;
  }
  log('SUCCESS: Restored to official state (archive verified).');
}

const action = process.argv[2] || 'patch';
if (action === 'patch') {
  applyPatch();
} else if (action === 'restore') {
  restoreOriginal();
} else if (action === 'check') {
  const patched = checkIsPatched();
  console.log(patched ? 'PATCHED' : 'UNPATCHED');
} else if (action === 'verify') {
  // doctor mode: is the archive that is currently installed actually bootable?
  const v = verifyArchive(null, ASAR_PATH);
  const entries = (() => { try { const i = asarIndex(ASAR_PATH); const n = Object.keys(flattenIndex(i.header, {})).length; fs.closeSync(i.fd); return n; } catch (e) { return 0; } })();
  console.log(`app.asar: ${ASAR_PATH}`);
  console.log(`entries: ${entries}`);
  console.log(v.ok ? 'VERIFY OK - archive is structurally sound and should boot.'
                   : 'VERIFY FAILED - Antigravity cannot start with this archive:');
  for (const p of v.problems.slice(0, 15)) console.log('  * ' + p);
  if (v.problems.length > 15) console.log(`  ... and ${v.problems.length - 15} more problem(s)`);
  process.exitCode = v.ok ? 0 : 1;
} else {
  console.log('Usage: node patch_engine.js [patch|restore|check|verify] [resourcesDir]');
}
