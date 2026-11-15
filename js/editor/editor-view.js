// 编辑器页面 UI 绑定：工具栏、符号栏、返回、更多菜单分派
import { codeInput } from './codemirror.js';
import { SYMBOLS } from '../core/constants.js';
import { syncActiveFile, updateStatus } from './editor-state.js';
import { project } from '../core/store.js';
import { showPage } from '../ui/pages.js';
import { copyToClipboard, showToast } from '../core/utils.js';
import { enterPreview } from '../features/preview.js';
import { exportProjectZipById } from '../features/export.js';
import { openFindSheet } from '../features/find.js';
import { formatDocument } from '../features/formatter.js';
import { doEncodeDecode } from '../features/encoder.js';
import { optimizeSvg, inlineImageBase64 } from '../features/toolbox.js';
import { openStatsSheet } from '../features/stats.js';
import { openRegexSheet } from '../features/regex.js';
import { openSettingsSheet } from '../features/settings.js';

/* ============ 符号栏 ============ */
const symbolBar = document.getElementById('symbolBar');
SYMBOLS.forEach(sym => {
  const btn = document.createElement('button');
  btn.className = 'symbol-btn'; btn.type = 'button'; btn.textContent = sym;
  btn.addEventListener('click', () => {
    codeInput.insertAtCursor(sym);
    syncActiveFile();
    updateStatus();
  });
  symbolBar.appendChild(btn);
});

/* ============ 编辑器输入同步 ============ */
codeInput.addEventListener('input', () => { syncActiveFile(); updateStatus(); });
codeInput.addEventListener('keyup', updateStatus);
codeInput.addEventListener('click', updateStatus);

/* ============ 返回按钮 ============ */
document.getElementById('backBtn').addEventListener('click', () => {
  if (project) syncActiveFile();
  showPage('workspace');
});

/* ============ 工具栏 ============ */
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

/* ============ 更多菜单 ============ */
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
