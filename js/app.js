import { EditorState, Compartment } from 'https://esm.sh/@codemirror/state@6';
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  drawSelection, dropCursor, rectangularSelection, crosshairCursor,
  highlightSpecialChars
} from 'https://esm.sh/@codemirror/view@6';
import { defaultKeymap, history, historyKeymap, indentWithTab } from 'https://esm.sh/@codemirror/commands@6';
import {
  syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput,
  foldGutter, foldKeymap
} from 'https://esm.sh/@codemirror/language@6';
import { searchKeymap, highlightSelectionMatches } from 'https://esm.sh/@codemirror/search@6';
import {
  autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap
} from 'https://esm.sh/@codemirror/autocomplete@6';
import { html as langHtml } from 'https://esm.sh/@codemirror/lang-html@6';
import { css as langCss } from 'https://esm.sh/@codemirror/lang-css@6';
import { javascript as langJs } from 'https://esm.sh/@codemirror/lang-javascript@6';
import { json as langJson } from 'https://esm.sh/@codemirror/lang-json@6';
import { markdown as langMd } from 'https://esm.sh/@codemirror/lang-markdown@6';
import { python as langPy } from 'https://esm.sh/@codemirror/lang-python@6';
import { sql as langSql } from 'https://esm.sh/@codemirror/lang-sql@6';
import { xml as langXml } from 'https://esm.sh/@codemirror/lang-xml@6';

/* ============ Toast / 保存指示 ============ */
let toastTimer = null;
function showToast(msg, duration) {
  duration = duration === undefined ? 1600 : duration;
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  if (duration > 0) toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}
let saveIndicatorTimer = null;
function flashSaved() {
  const el = document.getElementById('saveIndicator');
  el.classList.add('show');
  if (saveIndicatorTimer) clearTimeout(saveIndicatorTimer);
  saveIndicatorTimer = setTimeout(() => el.classList.remove('show'), 1000);
}
window.addEventListener('error', (e) => console.error('[CodeView]', e.error || e.message));

/* ============ 确认弹窗 ============ */
let confirmCallback = null;
function showConfirm(opts) {
  document.getElementById('confirmTitle').textContent = opts.title || '确认操作';
  document.getElementById('confirmDesc').textContent = opts.desc || '';
  document.getElementById('confirmOk').textContent = opts.confirmText || '确定';
  confirmCallback = opts.onConfirm || null;
  document.getElementById('confirmMask').classList.add('show');
}
function hideConfirm() {
  document.getElementById('confirmMask').classList.remove('show');
  confirmCallback = null;
}
document.getElementById('confirmCancel').addEventListener('click', hideConfirm);
document.getElementById('confirmOk').addEventListener('click', () => {
  const cb = confirmCallback;
  hideConfirm();
  if (cb) cb();
});
document.getElementById('confirmMask').addEventListener('click', (e) => {
  if (e.target === document.getElementById('confirmMask')) hideConfirm();
});

/* ============ CodeMirror ============ */
const editorContainer = document.getElementById('editorContainer');
editorContainer.innerHTML = '';

const langCompartment = new Compartment();
const cmListeners = { input: [], keyup: [], click: [], keydown: [] };
let isSettingValue = false;

const cmView = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      EditorState.tabSize.of(2),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        indentWithTab
      ]),
      langCompartment.of([]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isSettingValue) {
          cmListeners.input.forEach(fn => { try { fn({ type: 'input' }); } catch(e){} });
        }
      }),
      EditorView.lineWrapping
    ]
  }),
  parent: editorContainer
});

cmView.dom.addEventListener('keyup', (e) => { cmListeners.keyup.forEach(fn => { try { fn(e); } catch(err){} }); });
cmView.dom.addEventListener('click', (e) => { cmListeners.click.forEach(fn => { try { fn(e); } catch(err){} }); });
cmView.dom.addEventListener('keydown', (e) => { cmListeners.keydown.forEach(fn => { try { fn(e); } catch(err){} }); });

const codeInput = {
  get view() { return cmView; },
  get value() { return cmView.state.doc.toString(); },
  set value(v) {
    v = v == null ? '' : String(v);
    if (v === cmView.state.doc.toString()) return;
    isSettingValue = true;
    cmView.dispatch({ changes: { from: 0, to: cmView.state.doc.length, insert: v } });
    isSettingValue = false;
  },
  get selectionStart() { return cmView.state.selection.main.from; },
  get selectionEnd() { return cmView.state.selection.main.to; },
  setSelectionRange(from, to) {
    const max = cmView.state.doc.length;
    if (from > max) from = max;
    if (to > max) to = max;
    cmView.dispatch({ selection: { anchor: from, head: to } });
  },
  focus() { cmView.focus(); },
  blur() { cmView.contentDOM.blur(); },
  select() { cmView.dispatch({ selection: { anchor: 0, head: cmView.state.doc.length } }); },
  addEventListener(type, fn) { if (cmListeners[type]) cmListeners[type].push(fn); },
  insertAtCursor(text) {
    const { from, to } = cmView.state.selection.main;
    cmView.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
    cmView.focus();
  },
  reconfigureLanguage(ext) { cmView.dispatch({ effects: langCompartment.reconfigure(ext) }); },
  replaceRange(from, to, text) {
    cmView.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
    cmView.focus();
  }
};

/* ============ IndexedDB ============ */
const DB_NAME = 'codeview-db';
const DB_VERSION = 2;
const STORE_NAME = 'appstate';
const STORE_KEY = 'current';
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveToDB(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, STORE_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}
async function loadFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(STORE_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
setTimeout(() => { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {} }, 0);
let saveTimer = null;
function scheduleSave() {
  if (!projects.length) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try { await saveToDB({ projects, currentProjectId }); flashSaved(); } catch (e) {}
  }, 500);
}
async function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { await saveToDB({ projects, currentProjectId }); flashSaved(); } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
window.addEventListener('pagehide', () => { saveNow(); });

/* ============ 数据模型 ============ */
const DEFAULT_TEMPLATE = [
'<!DOCTYPE html>', '<html lang="zh-CN">', '<head>',
'  <meta charset="UTF-8">',
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
'  <title>示例</title>',
'  <style>',
'    body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f7f9fc; }',
'    .card { background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); text-align: center; max-width: 320px; }',
'    h1 { margin: 0 0 12px; font-size: 22px; }',
'    p { color: #666; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }',
'    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }',
'    button { background: #FE592D; color: #fff; border: none; padding: 10px 24px; border-radius: 999px; font-size: 15px; font-weight: 600; cursor: pointer; }',
'  </style>',
'</head>', '<body>',
'  <main class="card">',
'    <h1>Hello, 示例!</h1>',
'    <p>编辑这个 <code>index.html</code> 开始你的项目。</p>',
'    <button id="cta" type="button">Click me</button>',
'  </main>',
'  <scr' + 'ipt>',
'    document.getElementById("cta").addEventListener("click", function() { alert("按钮被点击了！"); });',
'  </scr' + 'ipt>',
'</body>', '</html>'
].join('\n');

const TRASH_RETENTION_DAYS = 30;
let projects = [];
let currentProjectId = null;
let project = null;
let fileIdSeq = 1;

function newFileId() { return 'f' + (fileIdSeq++) + '_' + Date.now().toString(36); }
function newProjectId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function createFile(name, content, isEntry) {
  content = content === undefined ? '' : content;
  isEntry = isEntry === undefined ? false : isEntry;
  return { id: newFileId(), name, content, isEntry, updatedAt: Date.now() };
}
function createProject(name) {
  const p = {
    id: newProjectId(),
    name,
    files: [createFile('index.html', DEFAULT_TEMPLATE, true)],
    activeFileId: null,
    updatedAt: Date.now(),
    deletedAt: null,
    pinnedAt: null
  };
  p.activeFileId = p.files[0].id;
  return p;
}

function setCurrentProject(id) {
  currentProjectId = id;
  project = projects.find(p => p.id === id) || null;
}

function loadActiveFileToEditor() {
  if (!project) {
    isSettingValue = true;
    codeInput.value = '';
    isSettingValue = false;
    return;
  }
  const f = getActiveFile();
  if (f) {
    isSettingValue = true;
    codeInput.value = f.content;
    isSettingValue = false;
    document.getElementById('tabName').textContent = f.name;
    document.getElementById('editorTitle').textContent = project.name;
    updateStatusLang(f.name);
  }
  updateStatus();
}

function getActiveFile() {
  if (!project) return null;
  return project.files.find(f => f.id === project.activeFileId) || null;
}
function getEntryFile(p) {
  p = p || project;
  if (!p) return null;
  return p.files.find(f => f.isEntry) || p.files[0] || null;
}
function liveProjects() { return projects.filter(p => !p.deletedAt); }
function trashedProjects() { return projects.filter(p => p.deletedAt); }
function projectLastUpdated(p) {
  if (!p.files || !p.files.length) return p.updatedAt || Date.now();
  return Math.max(...p.files.map(f => f.updatedAt || 0), p.updatedAt || 0);
}
function daysLeft(p) {
  if (!p.deletedAt) return TRASH_RETENTION_DAYS;
  const ms = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const left = p.deletedAt + ms - Date.now();
  return Math.max(0, Math.ceil(left / (24 * 60 * 60 * 1000)));
}

/* ============ 工具 ============ */
function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + ' 分钟前';
  const hour = Math.floor(min / 60);
  if (hour < 24) return hour + ' 小时前';
  const day = Math.floor(hour / 24);
  if (day < 30) return day + ' 天前';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}
function escapeHtmlText(s) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}

/* ============ 图标 ============ */
const ICON_HTML = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <path fill="#E34F26" d="M107 48h298l-27 306L256 464 134 354z"/>
  <path fill="#EF652A" d="M256 48v416l122-110 27-306z"/>
  <path fill="#fff" d="M256 192h-75l-5-56h80v-40H135l11 136h110z"/>
  <path fill="#fff" d="M256 328l-58-16-4-40h-42l7 76 97 27z"/>
  <path fill="#fff" d="M256 192v40h73l-7 84-66 18v42l104-29 7-90zM256 96v40h118l4-40z"/>
</svg>`;
const ICON_CSS = `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="120" height="120" rx="22" fill="#663399"/>
  <text x="80" y="82" font-family="Arial Black, sans-serif" font-weight="900" font-size="44" fill="#fff" text-anchor="middle" dominant-baseline="middle">CSS</text>
</svg>`;
const ICON_JS = `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="120" height="120" rx="22" fill="#F7DF1E"/>
  <text x="80" y="82" font-family="Arial Black, sans-serif" font-weight="900" font-size="48" fill="#222" text-anchor="middle" dominant-baseline="middle">JS</text>
</svg>`;
const ICON_MD = `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="120" height="120" rx="22" fill="#2C3E50"/>
  <text x="80" y="82" font-family="Arial Black, sans-serif" font-weight="900" font-size="38" fill="#fff" text-anchor="middle" dominant-baseline="middle">MD</text>
</svg>`;
const ICON_JSON = `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="120" height="120" rx="22" fill="#E8A300"/>
  <text x="80" y="86" font-family="Arial Black, sans-serif" font-weight="900" font-size="34" fill="#fff" text-anchor="middle" dominant-baseline="middle">{}</text>
</svg>`;
const ICON_FILE = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#8E8E93" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M28 6H14a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V16z"/>
  <polyline points="28 6 28 16 38 16"/>
</svg>`;
const ICON_FOLDER_BLUE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
</svg>`;

const ICON_CTX = {
  rename: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  newfile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  import: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M4 19h16"/></svg>`,
  duplicate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`,
  export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-3V6a1 1 0 0 0-1-1H7.5a1 1 0 0 0-1 1v8z"/></svg>`,
  unpin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-3V6a1 1 0 0 0-1-1H7.5a1 1 0 0 0-1 1v8z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  entry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>`,
  unentry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
  move: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/><line x1="9" y1="15" x2="15" y2="15"/><polyline points="13 12 16 15 13 18"/></svg>`,
  copyto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><line x1="11" y1="14" x2="17" y2="14"/><polyline points="14 11 17 14 14 17"/></svg>`,
  copycontent: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8.01"/></svg>`
};

function iconForFile(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'html' || ext === 'htm') return ICON_HTML;
  if (ext === 'css' || ext === 'scss' || ext === 'less') return ICON_CSS;
  if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs' || ext === 'ts' || ext === 'tsx') return ICON_JS;
  if (ext === 'md' || ext === 'markdown') return ICON_MD;
  if (ext === 'json') return ICON_JSON;
  return ICON_FILE;
}
const HOME_MARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>`;
const PIN_MARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-3V6a1 1 0 0 0-1-1H7.5a1 1 0 0 0-1 1v8z"/></svg>`;
const ARROW_RIGHT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`;
const CHECK_WHITE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7"/></svg>`;

/* ============ 语言 ============ */
function langExtForFile(ext) {
  switch (ext) {
    case 'html': case 'htm': return langHtml();
    case 'css': case 'scss': case 'less': return langCss();
    case 'js': case 'mjs': case 'cjs': return langJs();
    case 'jsx': return langJs({ jsx: true });
    case 'ts': return langJs({ typescript: true });
    case 'tsx': return langJs({ typescript: true, jsx: true });
    case 'json': return langJson();
    case 'md': case 'markdown': return langMd();
    case 'py': return langPy();
    case 'sql': return langSql();
    case 'xml': case 'svg': return langXml();
    default: return [];
  }
}

/* ============ 上下文菜单 ============ */
const ctxMask = document.getElementById('ctxMask');
const ctxMenu = document.getElementById('ctxMenu');
let ctxOnSelect = null;

function showCtxMenu(opts) {
  ctxMenu.innerHTML = '';
  ctxOnSelect = opts.onSelect || null;

  if (opts.title) {
    const t = document.createElement('div');
    t.className = 'ctx-title';
    t.textContent = opts.title;
    ctxMenu.appendChild(t);
  }

  opts.groups.forEach(group => {
    const gEl = document.createElement('div');
    gEl.className = 'ctx-group';
    group.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'ctx-item' + (item.danger ? ' danger' : '');
      btn.type = 'button';
      btn.innerHTML = '<span>' + item.label + '</span>' + (item.icon || '');
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const cb = ctxOnSelect;
        hideCtxMenu();
        if (cb) cb(item.action);
      });
      gEl.appendChild(btn);
    });
    ctxMenu.appendChild(gEl);
  });

  ctxMenu.style.left = '0px';
  ctxMenu.style.top = '0px';
  ctxMask.classList.add('show');

  requestAnimationFrame(() => {
    const mw = ctxMenu.offsetWidth;
    const mh = ctxMenu.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const MARGIN = 12;
    const GAP = 12;

    let left = opts.x - mw / 2;
    if (left < MARGIN) left = MARGIN;
    if (left + mw > vw - MARGIN) left = vw - MARGIN - mw;

    let top;
    if (opts.y + GAP + mh + MARGIN <= vh) {
      top = opts.y + GAP;
    } else if (opts.y - GAP - mh >= MARGIN) {
      top = opts.y - GAP - mh;
    } else {
      top = Math.max(MARGIN, vh - MARGIN - mh);
    }

    ctxMenu.style.left = left + 'px';
    ctxMenu.style.top = top + 'px';
  });
}

function hideCtxMenu() {
  ctxMask.classList.remove('show');
  ctxOnSelect = null;
}
ctxMask.addEventListener('click', hideCtxMenu);
ctxMask.addEventListener('touchstart', (e) => {
  if (!ctxMenu.contains(e.target)) hideCtxMenu();
}, { passive: true });

/* ============ 页面切换 ============ */
const pageWorkspace = document.getElementById('pageWorkspace');
const pageTrash     = document.getElementById('pageTrash');
const pageEditor    = document.getElementById('pageEditor');
const pagePreview   = document.getElementById('pagePreview');
function showPage(name) {
  [pageWorkspace, pageTrash, pageEditor, pagePreview].forEach(p => p.classList.remove('active'));
  ({ workspace: pageWorkspace, trash: pageTrash, editor: pageEditor, preview: pagePreview })[name].classList.add('active');
  if (name === 'workspace') renderProjects();
}

/* ============ 工作区轮播 ============ */
let carouselContainer, carouselLogos;
function updateCarouselCenter() {
  if (!carouselContainer) return;
  const rect = carouselContainer.getBoundingClientRect();
  const center = rect.left + rect.width / 2;
  if (rect.width === 0) return;
  let closest = null, minDist = Infinity;
  carouselLogos.forEach(logo => {
    const lr = logo.getBoundingClientRect();
    if (lr.width === 0) return;
    const lc = lr.left + lr.width / 2;
    const d = Math.abs(center - lc);
    if (d < minDist) { minDist = d; closest = logo; }
  });
  carouselLogos.forEach(l => l.classList.remove('active'));
  if (closest) closest.classList.add('active');
}
(function initCarousel() {
  carouselContainer = document.getElementById('wsCarousel');
  carouselLogos = carouselContainer.querySelectorAll('.ws-logo');
  let scrolling = false;
  carouselContainer.addEventListener('scroll', () => {
    if (!scrolling) {
      window.requestAnimationFrame(() => { updateCarouselCenter(); scrolling = false; });
      scrolling = true;
    }
  });
  setTimeout(updateCarouselCenter, 50);
  setTimeout(updateCarouselCenter, 200);
  setTimeout(updateCarouselCenter, 600);
  window.addEventListener('load', () => setTimeout(updateCarouselCenter, 50));
})();

/* ============ 我的项目 ============ */
const wsSectionHeader = document.getElementById('wsSectionHeader');
const projectsList = document.getElementById('projectsList');
const expandedProjectIds = new Set();
let openSwipeCard = null;

function renderProjects() {
  const live = liveProjects();
  if (!projects.length) {
    wsSectionHeader.classList.remove('show');
    projectsList.innerHTML = '';
    return;
  }
  wsSectionHeader.classList.add('show');
  projectsList.innerHTML = '';

  if (!live.length) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'projects-empty';
    emptyEl.textContent = '暂无项目，回收站中还有已删除的项目';
    projectsList.appendChild(emptyEl);
    return;
  }

  const sorted = live.slice().sort((a, b) => {
    const ap = a.pinnedAt || 0;
    const bp = b.pinnedAt || 0;
    if (ap !== bp) return bp - ap;
    return projectLastUpdated(b) - projectLastUpdated(a);
  });

  sorted.forEach(p => {
    const wrap = document.createElement('div');
    wrap.className = 'project-swipe';

    const actionBtn = document.createElement('button');
    actionBtn.className = 'project-swipe-action';
    actionBtn.type = 'button';
    actionBtn.textContent = '删除';
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSwipe();
      confirmDeleteProject(p);
    });

    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = p.id;
    if (expandedProjectIds.has(p.id)) card.classList.add('expanded');

    const count = p.files.length;
    const time = formatRelativeTime(projectLastUpdated(p));
    const isPinned = !!p.pinnedAt;

    card.innerHTML =
      '<div class="project-head">' +
        '<div class="project-cover"><iframe sandbox="" title="' + escapeHtmlText(p.name) + '"></iframe></div>' +
        '<div class="project-info">' +
          '<div class="project-name">' +
            (isPinned ? '<span class="pin-mark">' + PIN_MARK + '</span>' : '') +
            '<span>' + escapeHtmlText(p.name) + '</span>' +
          '</div>' +
          '<div class="project-meta">' + count + ' 个文件 · ' + time + '</div>' +
        '</div>' +
        '<div class="project-chevron">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="6 9 12 15 18 9"/></svg>' +
        '</div>' +
      '</div>' +
      '<div class="project-body">' +
        '<div class="proj-file-list"></div>' +
        '<button class="proj-action" data-act="newfile">' +
          '<div class="proj-action-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
          '</div><span>新建文件</span></button>' +
        '<button class="proj-action" data-act="import">' +
          '<div class="proj-action-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M4 19h16"/></svg>' +
          '</div><span>导入文件</span></button>' +
      '</div>';

    const coverIframe = card.querySelector('iframe');
    renderCover(p, coverIframe);

    const fileList = card.querySelector('.proj-file-list');
    p.files.forEach(f => {
      const row = document.createElement('button');
      row.className = 'proj-file-row';
      row.type = 'button';
      const size = new Blob([f.content]).size;
      row.innerHTML =
        '<div class="proj-file-icon">' + iconForFile(f.name) + '</div>' +
        '<div class="proj-file-info">' +
          '<div class="proj-file-name">' +
            '<span>' + escapeHtmlText(f.name) + '</span>' +
            (f.isEntry ? '<span class="home-mark">' + HOME_MARK + '</span>' : '') +
          '</div>' +
          '<div class="proj-file-size">' + formatBytes(size) + '</div>' +
        '</div>' +
        '<div class="proj-file-arrow">' + ARROW_RIGHT + '</div>';
      row.addEventListener('click', (e) => { e.stopPropagation(); openFileInProject(p.id, f.id); });
      attachLongPress(row, (pos) => openFileContextMenu(p.id, f.id, pos));
      fileList.appendChild(row);
    });

    const headEl = card.querySelector('.project-head');
    headEl.addEventListener('click', (e) => {
      if (card.classList.contains('swiped')) {
        e.stopPropagation();
        closeSwipe();
        return;
      }
      if (expandedProjectIds.has(p.id)) expandedProjectIds.delete(p.id);
      else expandedProjectIds.add(p.id);
      card.classList.toggle('expanded');
    });
    attachLongPress(headEl, (pos) => openProjectContextMenu(p.id, pos));

    card.querySelector('[data-act="newfile"]').addEventListener('click', (e) => { e.stopPropagation(); openNewFileDialog(p.id); });
    card.querySelector('[data-act="import"]').addEventListener('click', (e) => { e.stopPropagation(); pendingImportProjectId = p.id; triggerImport('files'); });

    attachSwipeDelete(card, actionBtn);

    wrap.appendChild(actionBtn);
    wrap.appendChild(card);
    projectsList.appendChild(wrap);
  });
}

function closeSwipe() {
  if (openSwipeCard) {
    openSwipeCard.classList.remove('swiped');
    openSwipeCard = null;
  }
}

function attachSwipeDelete(card, actionBtn) {
  let startX = 0, startY = 0;
  let deltaX = 0;
  let dragging = false;
  let decided = false;
  let isHorizontal = false;
  let baseOffset = 0;
  const MOVE_THRESHOLD = 6;
  const OPEN_WIDTH = 90;

  const onStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX;
    startY = t.clientY;
    deltaX = 0;
    dragging = true;
    decided = false;
    isHorizontal = false;
    baseOffset = card.classList.contains('swiped') ? -OPEN_WIDTH : 0;
    if (openSwipeCard && openSwipeCard !== card) closeSwipe();
  };
  const onMove = (e) => {
    if (!dragging) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (!decided) {
      if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;
      decided = true;
      isHorizontal = Math.abs(dx) > Math.abs(dy);
      if (!isHorizontal) { dragging = false; return; }
      card.style.transition = 'none';
    }
    let offset = baseOffset + dx;
    if (offset > 0) offset = 0;
    if (offset < -OPEN_WIDTH) offset = -OPEN_WIDTH;
    card.style.transform = 'translateX(' + offset + 'px)';
    deltaX = offset;
    if (e.cancelable) e.preventDefault();
  };
  const onEnd = () => {
    if (!dragging && !decided) return;
    dragging = false;
    card.style.transition = '';
    card.style.transform = '';
    if (deltaX < -OPEN_WIDTH / 2) {
      card.classList.add('swiped');
      openSwipeCard = card;
    } else {
      card.classList.remove('swiped');
      if (openSwipeCard === card) openSwipeCard = null;
    }
    if (isHorizontal) {
      card.dataset.swipeJustEnded = '1';
      setTimeout(() => delete card.dataset.swipeJustEnded, 50);
    }
  };

  card.addEventListener('touchstart', onStart, { passive: true });
  card.addEventListener('touchmove', onMove, { passive: false });
  card.addEventListener('touchend', onEnd);
  card.addEventListener('touchcancel', onEnd);
}

document.addEventListener('touchstart', (e) => {
  if (!openSwipeCard) return;
  const swipeWrap = openSwipeCard.parentElement;
  if (!swipeWrap.contains(e.target)) closeSwipe();
}, { passive: true });
document.addEventListener('click', (e) => {
  if (!openSwipeCard) return;
  const swipeWrap = openSwipeCard.parentElement;
  if (!swipeWrap.contains(e.target)) closeSwipe();
});

function confirmDeleteProject(p) {
  showConfirm({
    title: '要删除“' + p.name + '”吗？',
    desc: '删除此项目将同时删除其数据。',
    confirmText: '删除',
    onConfirm: async () => {
      p.deletedAt = Date.now();
      p.pinnedAt = null;
      if (currentProjectId === p.id) {
        const live = liveProjects();
        if (live.length) {
          setCurrentProject(live[0].id);
        } else {
          currentProjectId = null; project = null;
        }
      }
      await saveNow();
      renderProjects();
      showToast('已移入回收站');
    }
  });
}

function renderCover(p, iframe) {
  const entry = getEntryFile(p);
  if (!entry) {
    iframe.srcdoc = '<!DOCTYPE html><html><body style="margin:0;background:#f5f5f7;"></body></html>';
    return;
  }
  iframe.srcdoc = buildPreviewDocForProject(p, entry.name, entry.content);
}

/* ============================================================
   【关键修复】切换项目时，先 sync 旧项目，再单纯切指针，最后加载新项目
   ============================================================ */
function openFileInProject(projectId, fileId) {
  const targetProject = projects.find(x => x.id === projectId);
  if (!targetProject) return;
  const targetFile = targetProject.files.find(x => x.id === fileId);
  if (!targetFile) return;

  // 1. 离开当前项目前，先保存当前编辑器内容
  if (project) syncActiveFile();

  // 2. 只切换 project 指针，不碰 codeInput
  setCurrentProject(projectId);
  if (!project) return;

  // 3. 更新目标项目的激活文件
  project.activeFileId = fileId;
  project.updatedAt = Date.now();

  // 4. 显式加载新文件到编辑器
  loadActiveFileToEditor();
  scheduleSave();
  showPage('editor');
}

/* ============ 长按事件 ============ */
function attachLongPress(el, cb) {
  let timer = null, longPressed = false;
  let startX = 0, startY = 0;
  const DURATION = 550;

  const start = (e) => {
    longPressed = false;
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX;
    startY = t.clientY;
    timer = setTimeout(() => {
      longPressed = true;
      if (navigator.vibrate) navigator.vibrate(15);
      cb({ x: startX, y: startY });
    }, DURATION);
  };
  const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };

  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchend', cancel);
  el.addEventListener('touchmove', cancel, { passive: true });
  el.addEventListener('touchcancel', cancel);
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', cancel);
  el.addEventListener('mouseleave', cancel);
  el.addEventListener('click', (e) => {
    if (longPressed) { e.preventDefault(); e.stopPropagation(); longPressed = false; }
  }, true);
}

/* ============ 项目上下文菜单 ============ */
function openProjectContextMenu(projectId, pos) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const isPinned = !!p.pinnedAt;

  showCtxMenu({
    title: p.name,
    x: pos.x,
    y: pos.y,
    groups: [
      [
        { action: 'rename', label: '重命名', icon: ICON_CTX.rename },
        { action: 'newfile', label: '新建文件', icon: ICON_CTX.newfile },
        { action: 'import', label: '导入文件', icon: ICON_CTX.import }
      ],
      [
        { action: 'duplicate', label: '复制一份', icon: ICON_CTX.duplicate },
        { action: 'export', label: '导出 ZIP', icon: ICON_CTX.export }
      ],
      [
        { action: 'togglePin', label: isPinned ? '取消置顶' : '置顶', icon: isPinned ? ICON_CTX.unpin : ICON_CTX.pin }
      ],
      [
        { action: 'delete', label: '删除项目', icon: ICON_CTX.delete, danger: true }
      ]
    ],
    onSelect: (action) => {
      if (action === 'rename') {
        openModal('projectRename', { initial: p.name, onConfirm: async (name) => {
          if (name === p.name) return;
          p.name = name;
          p.updatedAt = Date.now();
          if (currentProjectId === p.id) document.getElementById('editorTitle').textContent = p.name;
          renderProjects();
          await saveNow();
          showToast('已重命名');
        }});
      } else if (action === 'newfile') {
        openNewFileDialog(p.id);
      } else if (action === 'import') {
        pendingImportProjectId = p.id;
        triggerImport('files');
      } else if (action === 'duplicate') {
        duplicateProject(p.id);
      } else if (action === 'export') {
        exportProjectZipById(p.id);
      } else if (action === 'togglePin') {
        togglePinProject(p.id);
      } else if (action === 'delete') {
        confirmDeleteProject(p);
      }
    }
  });
}

/* ============ 文件上下文菜单 ============ */
function openFileContextMenu(projectId, fileId, pos) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;

  showCtxMenu({
    title: f.name,
    x: pos.x,
    y: pos.y,
    groups: [
      [
        { action: 'rename', label: '重命名', icon: ICON_CTX.rename },
        { action: 'toggleEntry', label: f.isEntry ? '取消入口标记' : '设为入口文件', icon: f.isEntry ? ICON_CTX.unentry : ICON_CTX.entry }
      ],
      [
        { action: 'duplicate', label: '复制一份', icon: ICON_CTX.duplicate },
        { action: 'move', label: '移动到…', icon: ICON_CTX.move },
        { action: 'copyto', label: '复制到…', icon: ICON_CTX.copyto }
      ],
      [
        { action: 'export', label: '导出文件', icon: ICON_CTX.export },
        { action: 'copyContent', label: '复制内容', icon: ICON_CTX.copycontent }
      ],
      [
        { action: 'info', label: '查看信息', icon: ICON_CTX.info }
      ],
      [
        { action: 'delete', label: '删除', icon: ICON_CTX.delete, danger: true }
      ]
    ],
    onSelect: (action) => {
      if (action === 'rename') {
        openModal('rename', { initial: f.name, onConfirm: async (name) => {
          if (name === f.name) return;
          if (p.files.some(x => x.name === name && x.id !== f.id)) { showToast('文件名已存在'); return; }
          f.name = name; f.updatedAt = Date.now(); p.updatedAt = Date.now();
          if (p.id === currentProjectId && p.activeFileId === f.id) {
            document.getElementById('tabName').textContent = f.name;
            updateStatusLang(f.name);
          }
          renderProjects(); await saveNow();
          showToast('已重命名');
        }});
      } else if (action === 'toggleEntry') {
        toggleEntryFile(p.id, f.id);
      } else if (action === 'duplicate') {
        duplicateFile(p.id, f.id);
      } else if (action === 'move') {
        openProjectPicker('move', p.id, f.id);
      } else if (action === 'copyto') {
        openProjectPicker('copy', p.id, f.id);
      } else if (action === 'export') {
        exportFile(p.id, f.id);
      } else if (action === 'copyContent') {
        copyFileContent(p.id, f.id);
      } else if (action === 'info') {
        showFileInfo(p.id, f.id);
      } else if (action === 'delete') {
        deleteFileFromProject(p.id, f.id);
      }
    }
  });
}

/* ============ 项目级新功能 ============ */
async function duplicateProject(projectId) {
  const src = projects.find(x => x.id === projectId);
  if (!src) return;
  const newP = {
    id: newProjectId(),
    name: src.name + ' 副本',
    files: src.files.map(f => ({
      id: newFileId(),
      name: f.name,
      content: f.content,
      isEntry: f.isEntry,
      updatedAt: Date.now()
    })),
    activeFileId: null,
    updatedAt: Date.now(),
    deletedAt: null,
    pinnedAt: null
  };
  newP.activeFileId = newP.files[0] ? newP.files[0].id : null;
  projects.unshift(newP);
  await saveNow();
  renderProjects();
  showToast('已复制项目');
}

async function togglePinProject(projectId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  p.pinnedAt = p.pinnedAt ? null : Date.now();
  await saveNow();
  renderProjects();
  showToast(p.pinnedAt ? '已置顶' : '已取消置顶');
}

/* ============ 文件级新功能 ============ */
async function toggleEntryFile(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;
  if (f.isEntry) f.isEntry = false;
  else { p.files.forEach(x => x.isEntry = false); f.isEntry = true; }
  f.updatedAt = Date.now();
  p.updatedAt = Date.now();
  renderProjects();
  await saveNow();
  showToast(f.isEntry ? '已设为入口' : '已取消入口');
}

async function duplicateFile(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;
  const newName = uniqueNameIn(p, f.name);
  const nf = createFile(newName, f.content, false);
  nf.updatedAt = Date.now();
  p.files.push(nf);
  p.updatedAt = Date.now();
  await saveNow();
  renderProjects();
  showToast('已复制为 ' + newName);
}

async function deleteFileFromProject(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  if (p.files.length <= 1) { showToast('至少保留一个文件'); return; }
  const idx = p.files.findIndex(x => x.id === fileId);
  if (idx < 0) return;
  const wasEntry = p.files[idx].isEntry;
  p.files.splice(idx, 1);
  if (wasEntry && p.files.length) p.files[0].isEntry = true;
  if (p.activeFileId === fileId) {
    p.activeFileId = p.files[0].id;
    if (p.id === currentProjectId) {
      loadActiveFileToEditor();
    }
  }
  p.updatedAt = Date.now();
  renderProjects();
  await saveNow();
  showToast('已删除');
}

function exportFile(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;
  const blob = new Blob([f.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast('已导出 ' + f.name);
}

async function copyFileContent(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;
  await copyToClipboard(f.content);
  showToast('已复制文件内容');
}

const infoSheet = document.getElementById('infoSheet');
const infoGrid = document.getElementById('infoGrid');
const infoTitle = document.getElementById('infoTitle');
function showFileInfo(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;
  const text = f.content;
  const size = new Blob([text]).size;
  const lines = text.split('\n').length;
  const nonEmpty = text.split('\n').filter(l => l.trim()).length;
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

  infoTitle.textContent = f.name;
  infoGrid.innerHTML = '';
  const rows = [
    ['大小', formatBytes(size)],
    ['字符数（含空格）', String(text.length)],
    ['字符数（不含空格）', String(text.replace(/\s/g, '').length)],
    ['行数', String(lines)],
    ['非空行数', String(nonEmpty)],
    ['中文字符数', String(chinese)],
    ['最后修改', formatRelativeTime(f.updatedAt)],
    ['是否入口文件', f.isEntry ? '是' : '否']
  ];
  rows.forEach(([k, v]) => {
    const kEl = document.createElement('div'); kEl.className = 'k'; kEl.textContent = k;
    const vEl = document.createElement('div'); vEl.className = 'v'; vEl.textContent = v;
    infoGrid.appendChild(kEl); infoGrid.appendChild(vEl);
  });
  infoSheet.classList.add('show');
}

/* ============ 回收站 ============ */
const trashList = document.getElementById('trashList');
const trashCount = document.getElementById('trashCount');
const trashBody = document.getElementById('trashBody');
const trashActionBar = document.getElementById('trashActionBar');
const trashSelectBtn = document.getElementById('trashSelectBtn');
const trashRestoreBtn = document.getElementById('trashRestoreBtn');
const trashDeleteBtn = document.getElementById('trashDeleteBtn');
let trashSelectMode = false;
let selectedTrashIds = new Set();

function openTrash() {
  trashSelectMode = false;
  selectedTrashIds.clear();
  trashSelectBtn.textContent = '选择';
  trashBody.classList.remove('select-mode');
  trashActionBar.classList.remove('show');
  renderTrash();
  showPage('trash');
}
document.getElementById('openTrashBtn').addEventListener('click', openTrash);
document.getElementById('trashBackBtn').addEventListener('click', () => showPage('workspace'));

trashSelectBtn.addEventListener('click', () => {
  trashSelectMode = !trashSelectMode;
  trashSelectBtn.textContent = trashSelectMode ? '完成' : '选择';
  trashBody.classList.toggle('select-mode', trashSelectMode);
  trashActionBar.classList.toggle('show', trashSelectMode);
  if (!trashSelectMode) selectedTrashIds.clear();
  renderTrash();
});

function updateTrashActions() {
  const n = selectedTrashIds.size;
  trashRestoreBtn.disabled = n === 0;
  trashDeleteBtn.disabled = n === 0;
  trashRestoreBtn.textContent = n > 0 ? '恢复 (' + n + ')' : '恢复';
  trashDeleteBtn.textContent = n > 0 ? '永久删除 (' + n + ')' : '永久删除';
}

function renderTrash() {
  const trashed = trashedProjects().slice().sort((a, b) => b.deletedAt - a.deletedAt);
  trashCount.textContent = String(trashed.length);
  trashList.innerHTML = '';
  if (!trashed.length) {
    trashList.innerHTML = '<div class="trash-empty">回收站为空</div>';
    updateTrashActions();
    return;
  }
  trashed.forEach(p => {
    const card = document.createElement('div');
    card.className = 'trash-card';
    if (selectedTrashIds.has(p.id)) card.classList.add('selected');
    card.innerHTML =
      '<div class="trash-select-circle">' + CHECK_WHITE + '</div>' +
      '<div class="trash-cover">' + ICON_FOLDER_BLUE + '</div>' +
      '<div class="trash-info">' +
        '<div class="trash-name">' + escapeHtmlText(p.name) + '</div>' +
        '<div class="trash-meta">' + p.files.length + ' 项 · ' + formatDate(p.deletedAt) + '</div>' +
      '</div>' +
      '<div class="trash-days">剩余 ' + daysLeft(p) + ' 天</div>';
    card.addEventListener('click', () => {
      if (trashSelectMode) {
        if (selectedTrashIds.has(p.id)) selectedTrashIds.delete(p.id);
        else selectedTrashIds.add(p.id);
        renderTrash();
        updateTrashActions();
      }
    });
    trashList.appendChild(card);
  });
  updateTrashActions();
}

trashRestoreBtn.addEventListener('click', async () => {
  if (!selectedTrashIds.size) return;
  const ids = Array.from(selectedTrashIds);
  ids.forEach(id => {
    const p = projects.find(x => x.id === id);
    if (p) p.deletedAt = null;
  });
  selectedTrashIds.clear();
  await saveNow();
  renderTrash();
  showToast('已恢复 ' + ids.length + ' 个项目');
});

trashDeleteBtn.addEventListener('click', () => {
  if (!selectedTrashIds.size) return;
  const n = selectedTrashIds.size;
  showConfirm({
    title: '永久删除这 ' + n + ' 个项目吗？',
    desc: '删除后无法恢复。',
    confirmText: '永久删除',
    onConfirm: async () => {
      const ids = Array.from(selectedTrashIds);
      ids.forEach(id => {
        const idx = projects.findIndex(x => x.id === id);
        if (idx >= 0) projects.splice(idx, 1);
      });
      selectedTrashIds.clear();
      await saveNow();
      renderTrash();
      showToast('已永久删除');
    }
  });
});

function cleanupExpired() {
  const ms = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const before = projects.length;
  projects = projects.filter(p => {
    if (p.deletedAt && now - p.deletedAt > ms) return false;
    return true;
  });
  return before !== projects.length;
}

/* ============ 通用弹窗 ============ */
const mask = document.getElementById('modalMask');
const input = document.getElementById('projectNameInput');
let modalCallback = null;

function openModal(mode, opts) {
  opts = opts || {};
  modalCallback = opts.onConfirm || null;
  const titleEl = document.getElementById('modalTitle');
  const descEl = document.getElementById('modalDesc');
  const btnEl = document.getElementById('createBtn');
  if (mode === 'project') {
    titleEl.textContent = '创建新项目';
    descEl.textContent = '输入您的项目的名称。里面会创建一个空白的 index.html。';
    btnEl.textContent = '创建';
    input.placeholder = 'My Project';
    input.value = '';
  } else if (mode === 'rename') {
    titleEl.textContent = '重命名';
    descEl.textContent = '输入新的文件名';
    btnEl.textContent = '确定';
    input.placeholder = 'filename';
    input.value = opts.initial || '';
  } else if (mode === 'projectRename') {
    titleEl.textContent = '重命名项目';
    descEl.textContent = '输入新的项目名称';
    btnEl.textContent = '确定';
    input.placeholder = 'My Project';
    input.value = opts.initial || '';
  }
  mask.classList.add('show');
  setTimeout(() => input.focus(), 50);
}
function closeModal() {
  mask.classList.remove('show');
  input.blur();
}
document.getElementById('cancelBtn').addEventListener('click', closeModal);
mask.addEventListener('click', (e) => { if (e.target === mask) closeModal(); });
document.getElementById('createBtn').addEventListener('click', () => {
  const name = input.value.trim();
  if (!name) { input.focus(); return; }
  const cb = modalCallback;
  closeModal();
  if (cb) cb(name);
});

/* ============ 项目选择器 ============ */
const projectPickerSheet = document.getElementById('projectPickerSheet');
const projectPickerTitle = document.getElementById('projectPickerTitle');
const projectPickerList = document.getElementById('projectPickerList');

function openProjectPicker(mode, sourceProjectId, fileId) {
  const source = projects.find(x => x.id === sourceProjectId);
  if (!source) return;
  const file = source.files.find(f => f.id === fileId);
  if (!file) return;

  if (mode === 'move' && source.files.length <= 1) {
    showToast('至少保留一个文件，无法移动');
    return;
  }

  const targets = projects.filter(p => !p.deletedAt && p.id !== sourceProjectId);
  projectPickerTitle.textContent = mode === 'move' ? '移动到' : '复制到';
  projectPickerList.innerHTML = '';

  if (!targets.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding: 40px 20px; text-align:center; color:#8E8E93; font-size:14px;';
    empty.textContent = '没有其他项目可以' + (mode === 'move' ? '移动' : '复制') + '到';
    projectPickerList.appendChild(empty);
  } else {
    targets.forEach(t => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'lang-item';
      row.innerHTML = '<span>' + escapeHtmlText(t.name) + '</span><span class="lang-ext">' + t.files.length + ' 个文件</span>';
      row.addEventListener('click', async () => {
        projectPickerSheet.classList.remove('show');
        if (mode === 'move') await moveFileToProject(sourceProjectId, fileId, t.id);
        else await copyFileToProject(sourceProjectId, fileId, t.id);
      });
      projectPickerList.appendChild(row);
    });
  }
  projectPickerSheet.classList.add('show');
}
document.getElementById('projectPickerClose').addEventListener('click', () => projectPickerSheet.classList.remove('show'));
projectPickerSheet.addEventListener('click', (e) => {
  if (e.target === projectPickerSheet) projectPickerSheet.classList.remove('show');
});

function uniqueNameIn(project, baseName) {
  if (!project.files.some(f => f.name === baseName)) return baseName;
  const dot = baseName.lastIndexOf('.');
  const base = dot > 0 ? baseName.slice(0, dot) : baseName;
  const ext = dot > 0 ? baseName.slice(dot) : '';
  let i = 1;
  while (project.files.some(f => f.name === base + '_' + i + ext)) i++;
  return base + '_' + i + ext;
}

async function moveFileToProject(srcId, fileId, dstId) {
  const src = projects.find(p => p.id === srcId);
  const dst = projects.find(p => p.id === dstId);
  if (!src || !dst) return;
  if (src.files.length <= 1) { showToast('至少保留一个文件'); return; }
  const idx = src.files.findIndex(f => f.id === fileId);
  if (idx < 0) return;
  const file = src.files[idx];
  const wasEntry = file.isEntry;

  src.files.splice(idx, 1);
  if (wasEntry && src.files.length) src.files[0].isEntry = true;

  file.name = uniqueNameIn(dst, file.name);
  file.updatedAt = Date.now();
  dst.files.push(file);
  if (!dst.files.some(f => f.isEntry)) dst.files[0].isEntry = true;

  src.updatedAt = Date.now();
  dst.updatedAt = Date.now();

  if (currentProjectId === srcId && src.activeFileId === fileId) {
    src.activeFileId = src.files[0].id;
    loadActiveFileToEditor();
  }

  await saveNow();
  renderProjects();
  showToast('已移动到「' + dst.name + '」');
}

async function copyFileToProject(srcId, fileId, dstId) {
  const src = projects.find(p => p.id === srcId);
  const dst = projects.find(p => p.id === dstId);
  if (!src || !dst) return;
  const file = src.files.find(f => f.id === fileId);
  if (!file) return;
  const newFile = createFile(uniqueNameIn(dst, file.name), file.content, false);
  newFile.updatedAt = Date.now();
  dst.files.push(newFile);
  if (!dst.files.some(f => f.isEntry)) dst.files[0].isEntry = true;
  dst.updatedAt = Date.now();
  await saveNow();
  renderProjects();
  showToast('已复制到「' + dst.name + '」');
}

/* ============ 创建 / 导入按钮 ============ */
document.getElementById('newProjectBtn').addEventListener('click', () => {
  openModal('project', { onConfirm: async (name) => {
    const p = createProject(name);
    projects.unshift(p);
    setCurrentProject(p.id);
    await saveNow();
    renderProjects();
    enterEditor();
    showToast('项目已创建');
  }});
});
let pendingImportProjectId = null;
document.getElementById('importFileBtn').addEventListener('click', () => { pendingImportProjectId = null; triggerImport('files'); });
document.getElementById('importFolderBtn').addEventListener('click', () => { pendingImportProjectId = null; triggerImport('folder'); });

/* ============ 编辑器 ============ */
function enterEditor() {
  if (!project) { showToast('请先创建项目'); return; }
  loadActiveFileToEditor();
  showPage('editor');
}
document.getElementById('backBtn').addEventListener('click', () => { if (project) syncActiveFile(); showPage('workspace'); });

const SYMBOLS = ['<', '>', '/', '"', "'", '=', '{', '}', '(', ')', '[', ']', ';', ':', '&', '|', '-', '_', '+', '*', '.', ',', '`', '!', '?'];
const symbolBar = document.getElementById('symbolBar');
SYMBOLS.forEach(sym => {
  const btn = document.createElement('button');
  btn.className = 'symbol-btn'; btn.type = 'button'; btn.textContent = sym;
  btn.addEventListener('click', () => insertSymbol(sym));
  symbolBar.appendChild(btn);
});
function insertSymbol(sym) {
  codeInput.insertAtCursor(sym);
  syncActiveFile();
  updateStatus();
}

function updateStatus() {
  const val = codeInput.value;
  const pos = codeInput.selectionStart;
  const before = val.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  document.getElementById('statusPos').textContent = '行 ' + line + ', 列 ' + col;
}
function updateStatusLang(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map = { html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', less: 'LESS', js: 'JavaScript', jsx: 'JSX', mjs: 'JS', cjs: 'JS', ts: 'TypeScript', tsx: 'TSX', json: 'JSON', md: 'Markdown', markdown: 'Markdown', txt: 'Text', svg: 'SVG' };
  document.getElementById('statusLang').textContent = map[ext] || (ext ? ext.toUpperCase() : 'TEXT');
  try { codeInput.reconfigureLanguage(langExtForFile(ext)); } catch (e) { console.warn('语言切换失败', e); }
}
function syncActiveFile() {
  if (!project) return;
  const f = getActiveFile();
  if (!f) return;
  const currentVal = codeInput.value;
  if (f.content === currentVal) return; // 避免无意义触发
  f.content = currentVal;
  f.updatedAt = Date.now();
  project.updatedAt = Date.now();
  scheduleSave();
}
codeInput.addEventListener('input', () => { syncActiveFile(); updateStatus(); });
codeInput.addEventListener('keyup', updateStatus);
codeInput.addEventListener('click', updateStatus);

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    if (tool === 'more') { openEditorMenu(); return; }
    if (tool === 'preview') { enterPreview(); return; }
    if (tool === 'export') { if (project) exportProjectZipById(project.id); return; }
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ============ 新建文件弹窗 ============ */
const LANGUAGES = [
  { name: 'HTML', ext: '.html' }, { name: 'CSS', ext: '.css' },
  { name: 'JavaScript', ext: '.js' }, { name: 'TypeScript', ext: '.ts' },
  { name: 'JSX', ext: '.jsx' }, { name: 'TSX', ext: '.tsx' },
  { name: 'JSON', ext: '.json' }, { name: 'Markdown', ext: '.md' },
  { name: 'SVG', ext: '.svg' }, { name: 'Vue', ext: '.vue' },
  { name: 'Svelte', ext: '.svelte' }, { name: 'Python', ext: '.py' },
  { name: 'Ruby', ext: '.rb' }, { name: 'Go', ext: '.go' },
  { name: 'Rust', ext: '.rs' }, { name: 'Java', ext: '.java' },
  { name: 'C', ext: '.c' }, { name: 'C++', ext: '.cpp' },
  { name: 'PHP', ext: '.php' }, { name: 'SQL', ext: '.sql' },
  { name: 'Shell', ext: '.sh' }, { name: 'YAML', ext: '.yml' },
  { name: 'XML', ext: '.xml' }, { name: '纯文本', ext: '.txt' }
];
const newfileMask = document.getElementById('newfileMask');
const nfInput = document.getElementById('nfInput');
const nfExtText = document.getElementById('nfExtText');
const nfCreateBtn = document.getElementById('nfCreateBtn');
const nfProjectName = document.getElementById('nfProjectName');
const nfInputIcon = document.getElementById('nfInputIcon');
const langMask = document.getElementById('langMask');
const langList = document.getElementById('langList');
let nfSelectedLang = LANGUAGES[0];
let nfTargetProjectId = null;

function updateNfIcon() { nfInputIcon.innerHTML = iconForFile('x' + nfSelectedLang.ext); }
function updateNfCreateState() { nfCreateBtn.disabled = nfInput.value.trim().length === 0; }
function openNewFileDialog(projectId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) { showToast('项目不存在'); return; }
  nfTargetProjectId = projectId;
  nfSelectedLang = LANGUAGES[0];
  nfExtText.textContent = nfSelectedLang.ext;
  nfInput.value = '';
  nfProjectName.textContent = p.name;
  updateNfIcon(); updateNfCreateState();
  newfileMask.classList.add('show');
  setTimeout(() => nfInput.focus(), 200);
}
function closeNewFileDialog() { newfileMask.classList.remove('show'); nfInput.blur(); }
document.getElementById('nfClose').addEventListener('click', closeNewFileDialog);
nfInput.addEventListener('input', updateNfCreateState);
document.getElementById('nfExtBtn').addEventListener('click', () => { renderLangList(); langMask.classList.add('show'); });
document.getElementById('langClose').addEventListener('click', () => langMask.classList.remove('show'));
langMask.addEventListener('click', (e) => { if (e.target === langMask) langMask.classList.remove('show'); });
function renderLangList() {
  langList.innerHTML = '';
  LANGUAGES.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'lang-item' + (lang.ext === nfSelectedLang.ext ? ' selected' : '');
    btn.type = 'button';
    btn.innerHTML = '<span>' + lang.name + '</span><span class="lang-ext">' + lang.ext + '</span>';
    btn.addEventListener('click', () => {
      nfSelectedLang = lang;
      nfExtText.textContent = lang.ext;
      updateNfIcon();
      langMask.classList.remove('show');
    });
    langList.appendChild(btn);
  });
}
nfCreateBtn.addEventListener('click', async () => {
  const baseName = nfInput.value.trim();
  if (!baseName) return;
  const p = projects.find(x => x.id === nfTargetProjectId); if (!p) return;
  let cleanBase = baseName;
  const lastDot = baseName.lastIndexOf('.');
  if (lastDot > 0) {
    const maybeExt = baseName.slice(lastDot).toLowerCase();
    if (LANGUAGES.some(l => l.ext === maybeExt)) cleanBase = baseName.slice(0, lastDot);
  }
  const fileName = uniqueNameIn(p, cleanBase + nfSelectedLang.ext);
  const f = createFile(fileName, '', false);
  p.files.push(f);
  p.activeFileId = f.id;
  p.updatedAt = Date.now();
  closeNewFileDialog();
  await saveNow();
  openFileInProject(p.id, f.id);
  showToast('已创建 ' + fileName);
});

/* ============ 导入 ============ */
const TEXT_EXT = /\.(html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|json|md|markdown|svg|txt|xml|yml|yaml|toml|ini|conf|sh|py|rb|go|rs|java|c|cc|cpp|h|hpp|php|lua|sql|vue|svelte|gitignore|env)$/i;

function guessProjectName(files) {
  const first = files.find(f => /\.(html?|htm)$/i.test(f.name)) || files[0];
  if (!first) return '导入项目';
  const base = first.name.replace(/\.[^.]+$/, '');
  return base || '导入项目';
}
async function handleImportedFiles(fileList) {
  const rawFiles = Array.from(fileList || []);
  if (!rawFiles.length) return;
  const files = [];
  let skip = 0;
  for (const file of rawFiles) {
    const isText = TEXT_EXT.test(file.name) || (file.type && file.type.startsWith('text/'));
    if (!isText) { skip++; continue; }
    let content = '';
    try { content = await file.text(); } catch (e) { skip++; continue; }
    files.push({ name: file.name, content });
  }
  if (!files.length) { showToast('未找到可导入的文本文件'); return; }

  if (pendingImportProjectId) {
    const p = projects.find(x => x.id === pendingImportProjectId);
    if (p) {
      let ok = 0;
      files.forEach(file => {
        const name = uniqueNameIn(p, file.name);
        p.files.push(createFile(name, file.content, false));
        ok++;
      });
      if (!p.files.some(f => f.isEntry)) {
        const idx = p.files.findIndex(f => f.name === 'index.html');
        p.files[idx >= 0 ? idx : 0].isEntry = true;
      }
      p.updatedAt = Date.now();
      pendingImportProjectId = null;
      await saveNow();
      renderProjects();
      showToast(skip ? '已导入 ' + ok + ' 个，跳过 ' + skip + ' 个' : '已导入 ' + ok + ' 个文件');
      return;
    }
    pendingImportProjectId = null;
  }

  const projectName = guessProjectName(files);
  const newP = {
    id: newProjectId(),
    name: projectName,
    files: [],
    activeFileId: null,
    updatedAt: Date.now(),
    deletedAt: null,
    pinnedAt: null
  };
  files.forEach(file => {
    const name = uniqueNameIn(newP, file.name);
    newP.files.push(createFile(name, file.content, false));
  });
  const entryIdx = newP.files.findIndex(f => f.name === 'index.html');
  if (entryIdx >= 0) newP.files[entryIdx].isEntry = true;
  else newP.files[0].isEntry = true;
  newP.activeFileId = newP.files[0].id;

  projects.unshift(newP);
  setCurrentProject(newP.id);
  await saveNow();
  renderProjects();
  showToast(skip ? '已导入 ' + files.length + ' 个，跳过 ' + skip + ' 个' : '已导入 ' + newP.files.length + ' 个文件');
}
function triggerImport(kind) {
  const input = document.getElementById(kind === 'files' ? 'importFilesInput' : 'importFolderInput');
  input.value = '';
  input.click();
}
document.getElementById('importFilesInput').addEventListener('change', (e) => handleImportedFiles(e.target.files));
document.getElementById('importFolderInput').addEventListener('change', (e) => handleImportedFiles(e.target.files));

/* ============ 导出 ZIP ============ */
let isExporting = false;
async function exportProjectZipById(projectId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  if (isExporting) return;
  isExporting = true;
  showToast('正在打包…', 0);
  try {
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    if (typeof JSZip === 'undefined') throw new Error('JSZip 未加载');
    const zip = new JSZip();
    const folderName = (p.name || 'project').replace(/[\\/:*?"<>|]/g, '_');
    const folder = zip.folder(folderName);
    p.files.forEach(file => {
      const safeName = file.name.replace(/[\\/:*?"<>|]/g, '_');
      folder.file(safeName, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const fileName = folderName + '.zip';
    const zipFile = new File([blob], fileName, { type: 'application/zip' });
    if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
      try { await navigator.share({ files: [zipFile], title: fileName }); showToast('已导出'); return; } catch (e) {}
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('已导出 ' + fileName);
  } catch (e) {
    showToast('导出失败：' + (e && e.message ? e.message : e), 2600);
  } finally { isExporting = false; }
}

/* ============ 多文件内联 ============ */
function isExternalUrl(url) {
  if (!url) return true;
  const t = url.trim();
  return /^(https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/|\/)/i.test(t);
}
function resolveLocalFileName(href) {
  let p = href.split('?')[0].split('#')[0];
  p = p.replace(/^\.\//, '');
  const parts = p.split('/');
  return parts[parts.length - 1];
}
function escapeStyleContent(s) { return s.replace(/<\/style>/gi, '<\\/style>'); }
function escapeScriptContent(s) { return s.replace(/<\/script>/gi, '<\\/script>'); }
function inlineResources(html, proj) {
  const fileMap = new Map();
  proj.files.forEach(f => fileMap.set(f.name, f.content));
  const inlined = [];

  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
    const m = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!m) return tag;
    const href = m[1];
    if (isExternalUrl(href)) return tag;
    const name = resolveLocalFileName(href);
    const content = fileMap.get(name);
    if (content === undefined) return tag;
    inlined.push(name);
    return '<style data-cv-inline="' + escapeHtmlText(name) + '">\n' + escapeStyleContent(content) + '\n</style>';
  });

  html = html.replace(/<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*?)>\s*<\/script>/gi, (tag, pre, src, post) => {
    if (isExternalUrl(src)) return tag;
    const name = resolveLocalFileName(src);
    const content = fileMap.get(name);
    if (content === undefined) return tag;
    inlined.push(name);
    const attrs = ((pre || '') + ' ' + (post || '')).replace(/\s+/g, ' ').trim();
    const attrStr = attrs ? ' ' + attrs : '';
    return '<scr' + 'ipt' + attrStr + ' data-cv-inline="' + escapeHtmlText(name) + '">\n' + escapeScriptContent(content) + '\n</scr' + 'ipt>';
  });

  html = html.replace(/<img\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (tag, pre, src, post) => {
    if (isExternalUrl(src)) return tag;
    const name = resolveLocalFileName(src);
    if (!/\.svg$/i.test(name)) return tag;
    const content = fileMap.get(name);
    if (content === undefined) return tag;
    inlined.push(name);
    try {
      const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(content)));
      return '<img' + pre + ' src="' + encoded + '"' + post + '>';
    } catch (e) { return tag; }
  });

  return { html, inlined };
}

/* ============ 预览页 ============ */
const previewFrame = document.getElementById('previewFrame');
const previewTitle = document.getElementById('previewTitle');
const previewMenuMask = document.getElementById('previewMenuMask');
const previewMenu = document.getElementById('previewMenu');
const fullscreenExit = document.getElementById('fullscreenExit');
let currentAppearance = 'white';
let currentZoom = 1;

function buildPreviewDocForProject(proj, fileName, content) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'html' || ext === 'htm') {
    if (proj && proj.files && proj.files.length > 1) {
      return inlineResources(content, proj).html;
    }
    return content;
  }
  if (ext === 'css') return buildCssDemoDoc(content);
  if (ext === 'js') return buildJsDemoDoc(content);
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    'body { font-family: -apple-system, sans-serif; padding: 16px; color: #666; }' +
    'pre { white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, monospace; }' +
    '</style></head><body><pre>' + escapeHtmlText(content) + '</pre></body></html>';
}
function enterPreview() {
  if (!project) return;
  syncActiveFile();
  const f = getActiveFile();
  if (!f) { showToast('没有可预览的文件'); return; }
  previewTitle.textContent = f.name;
  previewFrame.srcdoc = buildPreviewDocForProject(project, f.name, f.content);
  previewFrame.onload = () => { applyAppearance(currentAppearance); applyZoom(currentZoom); };
  pagePreview.classList.remove('fullscreen');
  showPage('preview');
}
function buildCssDemoDoc(css) {
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CSS 预览</title>' +
    '<style>' +
    'body { margin: 0; padding: 16px; font-family: -apple-system, sans-serif; }' +
    '.demo section { margin-bottom: 24px; }' +
    '.demo h1 { margin: 0 0 8px; } .demo h2 { margin: 16px 0 8px; } .demo h3 { margin: 12px 0 6px; }' +
    '.demo button, .demo input, .demo textarea, .demo select { font-family: inherit; font-size: 14px; padding: 8px 12px; margin: 4px 4px 4px 0; }' +
    '.demo table { border-collapse: collapse; width: 100%; }' +
    '.demo th, .demo td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }' +
    '.demo blockquote { margin: 8px 0; padding: 8px 14px; border-left: 3px solid #ccc; color: #555; }' +
    '.demo code { background: #f2f2f2; padding: 2px 6px; border-radius: 4px; font-size: 13px; }' +
    '</style><style>' + css + '</style></head>' +
    '<body><div class="demo">' +
    '<h1>Heading 1 一级标题</h1><h2>Heading 2 二级标题</h2><h3>Heading 3 三级标题</h3>' +
    '<section><p>普通段落，<strong>粗体</strong>，<em>斜体</em>，<a href="#">链接</a>，<code>inline code</code>。</p><blockquote>引用文字。</blockquote></section>' +
    '<section><ul><li>无序列表项一</li><li>无序列表项二</li></ul><ol><li>有序列表项一</li><li>有序列表项二</li></ol></section>' +
    '<section><button type="button">按钮 Button</button><input type="text" placeholder="输入框 Input"><textarea placeholder="多行文本"></textarea><select><option>选项 1</option><option>选项 2</option></select></section>' +
    '<section><div class="card"><h3>卡片 Card</h3><p>卡片内容。</p></div></section>' +
    '<section><table><thead><tr><th>列 1</th><th>列 2</th></tr></thead><tbody><tr><td>数据 1</td><td>数据 2</td></tr></tbody></table></section>' +
    '</div></body></html>';
}
function buildJsDemoDoc(js) {
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>JS 预览</title>' +
    '<style>body{margin:0;padding:16px;font-family:-apple-system,sans-serif;}#output{margin-top:12px;font-family:ui-monospace,monospace;font-size:13px;background:#f5f5f7;padding:12px;border-radius:8px;white-space:pre-wrap;}</style></head>' +
    '<body><h1>JS 预览</h1><div id="output"></div>' +
    '<scr' + 'ipt>(function(){var out=document.getElementById("output");var log=console.log;console.log=function(){var args=Array.prototype.slice.call(arguments).map(function(a){try{return typeof a==="object"?JSON.stringify(a):String(a);}catch(e){return String(a);}});out.textContent+=args.join(" ")+"\\n";log.apply(console,arguments);};try{' + js + '}catch(err){out.textContent+="[error] "+err.message+"\\n";}})();</scr' + 'ipt></body></html>';
}
document.getElementById('previewReloadBtn').addEventListener('click', () => {
  if (!project) return;
  syncActiveFile();
  const f = getActiveFile();
  if (!f) return;
  previewFrame.srcdoc = buildPreviewDocForProject(project, f.name, f.content);
  previewFrame.onload = () => { applyAppearance(currentAppearance); applyZoom(currentZoom); };
});
function applyAppearance(mode) {
  currentAppearance = mode;
  const doc = previewFrame.contentDocument;
  if (!doc || !doc.head) return;
  const old = doc.getElementById('__cv_appearance__');
  if (old) old.remove();
  if (mode === 'white') return;
  const style = doc.createElement('style');
  style.id = '__cv_appearance__';
  if (mode === 'dark') style.textContent = 'body, html { background: #111 !important; color: #eee !important; }';
  else if (mode === 'gray') style.textContent = 'body, html { background: #f0f0f0 !important; }';
  doc.head.appendChild(style);
}
function applyZoom(v) { currentZoom = v; previewFrame.style.zoom = (v === 1) ? '' : String(v); }
function toggleFullscreen() { pagePreview.classList.toggle('fullscreen'); }
fullscreenExit.addEventListener('click', () => { pagePreview.classList.remove('fullscreen'); });

async function capturePreview(mode) {
  if (typeof html2canvas === 'undefined') { alert('截屏库未加载'); return; }
  const doc = previewFrame.contentDocument;
  if (!doc || !doc.body) return;
  const vw = previewFrame.clientWidth;
  const vh = previewFrame.clientHeight;
  const options = {
    useCORS: true, allowTaint: true,
    backgroundColor: currentAppearance === 'dark' ? '#111' : '#fff',
    logging: false
  };
  if (mode === 'viewport') {
    options.width = vw; options.height = vh;
    options.windowWidth = vw; options.windowHeight = vh;
    options.x = doc.documentElement.scrollLeft || 0;
    options.y = doc.documentElement.scrollTop || 0;
  } else {
    options.width = Math.max(doc.documentElement.scrollWidth, vw);
    options.height = Math.max(doc.documentElement.scrollHeight, vh);
    options.windowWidth = options.width;
    options.windowHeight = options.height;
  }
  try {
    const canvas = await html2canvas(doc.body, options);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'preview.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: '预览截图' }); return; } catch (e) {}
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'preview-' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  } catch (err) { alert('截屏失败：' + err.message); }
}
document.getElementById('previewMenuBtn').addEventListener('click', () => {
  previewMenuMask.classList.add('show');
  showMenuPanel(previewMenu, 'main');
  syncPreviewMenuSelections();
});
previewMenuMask.addEventListener('click', (e) => { if (e.target === previewMenuMask) previewMenuMask.classList.remove('show'); });
function syncPreviewMenuSelections() {
  previewMenu.querySelectorAll('[data-appearance]').forEach(el => el.classList.toggle('selected', el.dataset.appearance === currentAppearance));
  previewMenu.querySelectorAll('[data-zoom]').forEach(el => el.classList.toggle('selected', parseFloat(el.dataset.zoom) === currentZoom));
}
previewMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || btn.disabled) return;
  if (btn.dataset.back !== undefined) { showMenuPanel(previewMenu, 'main'); return; }
  if (btn.dataset.submenu) { showMenuPanel(previewMenu, btn.dataset.submenu); return; }
  if (btn.dataset.appearance) { applyAppearance(btn.dataset.appearance); syncPreviewMenuSelections(); previewMenuMask.classList.remove('show'); return; }
  if (btn.dataset.zoom) { applyZoom(parseFloat(btn.dataset.zoom)); syncPreviewMenuSelections(); previewMenuMask.classList.remove('show'); return; }
  const action = btn.dataset.action;
  if (action === 'exit') { previewMenuMask.classList.remove('show'); showPage('editor'); }
  else if (action === 'fullscreen') { previewMenuMask.classList.remove('show'); toggleFullscreen(); }
  else if (action === 'capture-viewport') { previewMenuMask.classList.remove('show'); capturePreview('viewport'); }
  else if (action === 'capture-full') { previewMenuMask.classList.remove('show'); capturePreview('full'); }
});

/* ============ 编辑器「更多」菜单 ============ */
const editorMenuMask = document.getElementById('editorMenuMask');
const editorMenu = document.getElementById('editorMenu');
function showMenuPanel(menuEl, name) {
  menuEl.querySelectorAll('.menu-panel').forEach(p => { p.hidden = p.dataset.panel !== name; });
}
function openEditorMenu() { editorMenuMask.classList.add('show'); showMenuPanel(editorMenu, 'main'); }
editorMenuMask.addEventListener('click', (e) => { if (e.target === editorMenuMask) editorMenuMask.classList.remove('show'); });
editorMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || btn.disabled) return;
  if (btn.dataset.back !== undefined) { showMenuPanel(editorMenu, 'main'); return; }
  if (btn.dataset.submenu) { showMenuPanel(editorMenu, btn.dataset.submenu); return; }
  const action = btn.dataset.action;
  const enc = btn.dataset.enc;
  editorMenuMask.classList.remove('show');
  if (action === 'find') { openFindSheet(); return; }
  if (action === 'format') { formatDocument(); return; }
  if (action === 'selectall') { codeInput.focus(); codeInput.select(); updateStatus(); return; }
  if (action === 'copyall') { copyToClipboard(codeInput.value); return; }
  if (action === 'optimize-svg') { optimizeSvg(); return; }
  if (action === 'inline-image') { inlineImageBase64(); return; }
  if (action === 'stats') { openStatsSheet(); return; }
  if (action === 'regex') { openRegexSheet(); return; }
  if (action === 'settings') { openSettingsSheet(); return; }
  if (enc) { doEncodeDecode(enc); return; }
});

/* ============ 工具函数 ============ */
const loadedScripts = new Set();
function loadScriptOnce(url) {
  if (loadedScripts.has(url)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => { loadedScripts.add(url); resolve(); };
    s.onerror = () => reject(new Error('脚本加载失败：' + url));
    document.head.appendChild(s);
  });
}
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return; }
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  } catch (e) {}
}

/* ============ 格式化 ============ */
const PRETTIER_BASE = 'https://cdn.jsdelivr.net/npm/prettier@2.8.8';
const PLUGIN_URLS = { babel: PRETTIER_BASE + '/parser-babel.js', html: PRETTIER_BASE + '/parser-html.js', postcss: PRETTIER_BASE + '/parser-postcss.js', markdown: PRETTIER_BASE + '/parser-markdown.js' };
async function ensurePrettier(pluginName) {
  await loadScriptOnce(PRETTIER_BASE + '/standalone.js');
  window.prettierPlugins = window.prettierPlugins || {};
  if (pluginName && PLUGIN_URLS[pluginName] && !window.prettierPlugins[pluginName]) {
    await loadScriptOnce(PLUGIN_URLS[pluginName]);
  }
}
function parserInfoForExt(ext) {
  const map = { html: { parser: 'html', plugin: 'html' }, htm: { parser: 'html', plugin: 'html' }, vue: { parser: 'vue', plugin: 'html' }, css: { parser: 'css', plugin: 'postcss' }, scss: { parser: 'scss', plugin: 'postcss' }, less: { parser: 'less', plugin: 'postcss' }, js: { parser: 'babel', plugin: 'babel' }, jsx: { parser: 'babel', plugin: 'babel' }, mjs: { parser: 'babel', plugin: 'babel' }, cjs: { parser: 'babel', plugin: 'babel' }, json: { parser: 'json', plugin: null }, md: { parser: 'markdown', plugin: 'markdown' }, markdown: { parser: 'markdown', plugin: 'markdown' } };
  return map[ext] || null;
}
let isFormatting = false;
async function formatDocument() {
  if (isFormatting || !project) return;
  const f = getActiveFile();
  if (!f) return;
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  const info = parserInfoForExt(ext);
  if (!info) { showToast('暂不支持格式化 .' + ext + ' 文件'); return; }
  isFormatting = true;
  showToast('正在格式化…', 0);
  try {
    await ensurePrettier(info.plugin);
    const code = codeInput.value;
    const formatted = window.prettier.format(code, { parser: info.parser, plugins: window.prettierPlugins, tabWidth: editorTabSize, printWidth: 80, semi: true, singleQuote: false, trailingComma: 'es5' });
    if (formatted === code) { showToast('已是最新格式'); return; }
    codeInput.value = formatted;
    syncActiveFile(); updateStatus();
    showToast('已格式化');
  } catch (e) { showToast('格式化失败：' + (e && e.message ? e.message : e), 2600); }
  finally { isFormatting = false; }
}

/* ============ SVG 优化 / 图片 Base64 ============ */
let isOptimizingSvg = false;
async function optimizeSvg() {
  if (isOptimizingSvg) return;
  const sel = getSelectionOrNull();
  if (!sel) { showToast('请先选中要优化的 SVG 代码'); return; }
  isOptimizingSvg = true;
  showToast('正在优化…', 0);
  try {
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/svgo@2.8.0/dist/svgo.browser.js');
    if (typeof SVGO === 'undefined') throw new Error('SVGO 未加载');
    const svgo = new SVGO({ multipass: true, plugins: [{ name: 'preset-default' }, { name: 'removeDimensions' }] });
    const result = await svgo.optimize(sel.text);
    const optimized = result.data;
    if (optimized.length >= sel.text.length) showToast('已是最优，未压缩');
    else {
      const saved = (100 - (optimized.length / sel.text.length) * 100).toFixed(1);
      codeInput.replaceRange(sel.start, sel.end, optimized);
      syncActiveFile();
      showToast('已优化 · 减少 ' + saved + '%');
    }
  } catch (e) { showToast('优化失败：' + (e && e.message ? e.message : e), 2600); }
  finally { isOptimizingSvg = false; }
}
const imageFileInput = document.getElementById('imageFileInput');
let pendingInsertMode = 'replace';
function inlineImageBase64() {
  const sel = getSelectionOrNull();
  pendingInsertMode = sel ? 'replace' : 'insert';
  imageFileInput.value = '';
  imageFileInput.click();
}
imageFileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('请选择图片文件'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUri = reader.result;
    if (pendingInsertMode === 'replace') {
      const sel = getSelectionOrNull();
      if (sel) codeInput.replaceRange(sel.start, sel.end, dataUri);
      else codeInput.insertAtCursor(dataUri);
    } else {
      codeInput.insertAtCursor(dataUri);
    }
    syncActiveFile();
    showToast('已插入 · 约 ' + (dataUri.length / 1024).toFixed(1) + ' KB');
  };
  reader.readAsDataURL(file);
});

/* ============ 编码 / 解码 ============ */
function getSelectionOrNull() {
  const s = codeInput.selectionStart;
  const e = codeInput.selectionEnd;
  if (s === e) return null;
  return { start: s, end: e, text: codeInput.value.slice(s, e) };
}
function htmlEncode(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function htmlDecode(s) { const el = document.createElement('textarea'); el.innerHTML = s; return el.value; }
function b64Encode(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}
function b64Decode(s) {
  const bin = atob(s.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function jsonEncodeStr(s) { return JSON.stringify(s).slice(1, -1); }
function jsonDecodeStr(s) { return JSON.parse('"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'); }
function doEncodeDecode(kind) {
  const sel = getSelectionOrNull();
  if (!sel) { alert('请先在编辑器中选中要处理的文本'); return; }
  let result, err = null;
  try {
    switch (kind) {
      case 'html-encode': result = htmlEncode(sel.text); break;
      case 'html-decode': result = htmlDecode(sel.text); break;
      case 'url-encode': result = encodeURIComponent(sel.text); break;
      case 'url-decode': result = decodeURIComponent(sel.text); break;
      case 'b64-encode': result = b64Encode(sel.text); break;
      case 'b64-decode': result = b64Decode(sel.text); break;
      case 'json-encode': result = jsonEncodeStr(sel.text); break;
      case 'json-decode': result = jsonDecodeStr(sel.text); break;
    }
  } catch (e) { err = e; }
  if (err) { alert('处理失败：' + err.message); return; }
  codeInput.replaceRange(sel.start, sel.end, result);
  syncActiveFile();
}

/* ============ 查找 / 统计 / 正则 / 设置 ============ */
const findSheet = document.getElementById('findSheet');
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const findHint = document.getElementById('findHint');
let findLastIndex = -1;
function openFindSheet() {
  findSheet.classList.add('show');
  findLastIndex = -1;
  const sel = getSelectionOrNull();
  if (sel) findInput.value = sel.text;
  updateFindHint();
}
function updateFindHint() {
  const q = findInput.value;
  if (!q) { findHint.textContent = '未开始查找'; return; }
  const text = codeInput.value;
  let count = 0, idx = 0;
  while ((idx = text.indexOf(q, idx)) !== -1) { count++; idx += q.length; }
  findHint.textContent = '匹配 ' + count + ' 处';
}
findInput.addEventListener('input', () => { findLastIndex = -1; updateFindHint(); });
function findNext() {
  const q = findInput.value; if (!q) return;
  const text = codeInput.value;
  let from = findLastIndex === -1 ? codeInput.selectionEnd : findLastIndex + q.length;
  let idx = text.indexOf(q, from);
  if (idx === -1) idx = text.indexOf(q, 0);
  if (idx === -1) { findHint.textContent = '未找到'; return; }
  findLastIndex = idx;
  codeInput.focus();
  codeInput.setSelectionRange(idx, idx + q.length);
  updateStatus();
}
function findPrev() {
  const q = findInput.value; if (!q) return;
  const text = codeInput.value;
  let from = findLastIndex === -1 ? Math.max(0, codeInput.selectionStart - 1) : Math.max(0, findLastIndex - 1);
  let idx = text.lastIndexOf(q, from);
  if (idx === -1) idx = text.lastIndexOf(q);
  if (idx === -1) { findHint.textContent = '未找到'; return; }
  findLastIndex = idx;
  codeInput.focus();
  codeInput.setSelectionRange(idx, idx + q.length);
  updateStatus();
}
function replaceOne() {
  const q = findInput.value; if (!q) return;
  const s = codeInput.selectionStart;
  const e = codeInput.selectionEnd;
  if (codeInput.value.slice(s, e) === q) {
    codeInput.replaceRange(s, e, replaceInput.value);
    syncActiveFile(); updateStatus(); findNext();
  } else findNext();
}
function replaceAll() {
  const q = findInput.value; if (!q) return;
  codeInput.value = codeInput.value.split(q).join(replaceInput.value);
  syncActiveFile();
  findLastIndex = -1;
  updateFindHint(); updateStatus();
}
document.getElementById('findNextBtn').addEventListener('click', findNext);
document.getElementById('findPrevBtn').addEventListener('click', findPrev);
document.getElementById('replaceBtn').addEventListener('click', replaceOne);
document.getElementById('replaceAllBtn').addEventListener('click', replaceAll);

const statsSheet = document.getElementById('statsSheet');
const statsGrid = document.getElementById('statsGrid');
function openStatsSheet() {
  statsSheet.classList.add('show');
  statsGrid.innerHTML = '';
  const text = codeInput.value;
  const rows = [
    ['字符数（含空格）', text.length],
    ['字符数（不含空格）', text.replace(/\s/g, '').length],
    ['行数', text.split('\n').length],
    ['非空行数', text.split('\n').filter(l => l.trim()).length],
    ['中文字符数', (text.match(/[\u4e00-\u9fa5]/g) || []).length],
    ['HTML 标签数', (text.match(/<\/?[a-zA-Z][^>]*>/g) || []).length],
    ['CSS 规则数（粗估）', (text.match(/(^|\n)\s*[.#]?[\w-]+(\s*,\s*[.#]?[\w-]+)*\s*\{/g) || []).length],
    ['JS 函数/箭头函数数', (text.match(/function\s|=>\s*\{|=>\s*[^\{]/g) || []).length]
  ];
  rows.forEach(([k, v]) => {
    const kEl = document.createElement('div'); kEl.className = 'k'; kEl.textContent = k;
    const vEl = document.createElement('div'); vEl.className = 'v'; vEl.textContent = v;
    statsGrid.appendChild(kEl); statsGrid.appendChild(vEl);
  });
}

const regexSheet = document.getElementById('regexSheet');
const regexPattern = document.getElementById('regexPattern');
const regexFlags = document.getElementById('regexFlags');
const regexText = document.getElementById('regexText');
const regexHint = document.getElementById('regexHint');
const regexResult = document.getElementById('regexResult');
function openRegexSheet() {
  regexSheet.classList.add('show');
  regexText.value = codeInput.value;
  runRegex();
}
function runRegex() {
  regexResult.textContent = '';
  const pattern = regexPattern.value;
  const flags = regexFlags.value || 'g';
  const text = regexText.value;
  if (!pattern) { regexHint.textContent = ''; regexResult.textContent = '等待输入…'; return; }
  let re;
  try { re = new RegExp(pattern, flags.indexOf('g') !== -1 ? flags : flags + 'g'); }
  catch (e) { regexHint.textContent = '正则表达式无效'; regexResult.textContent = e.message; return; }
  const matches = Array.from(text.matchAll(re));
  regexHint.textContent = '匹配 ' + matches.length + ' 处';
  if (!matches.length) { regexResult.textContent = '无匹配'; return; }
  const frag = document.createDocumentFragment();
  let cursor = 0;
  matches.forEach(m => {
    const idx = m.index;
    if (idx > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, idx)));
    const span = document.createElement('span');
    span.className = 'hit'; span.textContent = m[0];
    frag.appendChild(span);
    cursor = idx + m[0].length;
  });
  if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
  regexResult.appendChild(frag);
}
regexPattern.addEventListener('input', runRegex);
regexFlags.addEventListener('input', runRegex);
regexText.addEventListener('input', runRegex);

const settingsSheet = document.getElementById('settingsSheet');
const segFontSize = document.getElementById('segFontSize');
const segTabSize = document.getElementById('segTabSize');
let editorFontSize = 16;
let editorTabSize = 2;
function applyEditorSettings() {
  document.documentElement.style.setProperty('--cv-editor-font-size', editorFontSize + 'px');
  document.documentElement.style.setProperty('--cv-editor-tab-size', String(editorTabSize));
  segFontSize.querySelectorAll('button').forEach(b => b.classList.toggle('on', parseInt(b.dataset.val) === editorFontSize));
  segTabSize.querySelectorAll('button').forEach(b => b.classList.toggle('on', parseInt(b.dataset.val) === editorTabSize));
}
segFontSize.addEventListener('click', (e) => { const btn = e.target.closest('button'); if (!btn) return; editorFontSize = parseInt(btn.dataset.val); applyEditorSettings(); });
segTabSize.addEventListener('click', (e) => { const btn = e.target.closest('button'); if (!btn) return; editorTabSize = parseInt(btn.dataset.val); applyEditorSettings(); });
function openSettingsSheet() { settingsSheet.classList.add('show'); applyEditorSettings(); }
applyEditorSettings();

document.querySelectorAll('.sheet-mask').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('show'); });
  m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => m.classList.remove('show')));
});

/* ============ 启动 ============ */
(async function boot() {
  try {
    const saved = await loadFromDB();
    if (saved && Array.isArray(saved.projects) && saved.projects.length) {
      projects = saved.projects;
      projects.forEach(p => {
        if (p.deletedAt === undefined) p.deletedAt = null;
        if (p.pinnedAt === undefined) p.pinnedAt = null;
      });
      let maxSeq = 1;
      projects.forEach(p => p.files.forEach(f => {
        const m = /^f(\d+)_/.exec(f.id);
        if (m) maxSeq = Math.max(maxSeq, parseInt(m[1]) + 1);
      }));
      fileIdSeq = maxSeq;
      const valid = projects.some(p => p.id === saved.currentProjectId && !p.deletedAt);
      const live = liveProjects();
      if (live.length) {
        setCurrentProject(valid ? saved.currentProjectId : live[0].id);
      } else {
        currentProjectId = null;
        project = null;
      }
      projects.forEach(p => {
        if (!p.files.some(f => f.isEntry) && p.files.length) p.files[0].isEntry = true;
        if (!p.files.some(f => f.id === p.activeFileId) && p.files.length) p.activeFileId = p.files[0].id;
      });
    }
  } catch (e) { console.warn('恢复失败', e); }

  if (cleanupExpired()) {
    await saveNow();
  }
  renderProjects();
})();
