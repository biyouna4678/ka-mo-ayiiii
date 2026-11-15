// 预览页：渲染、外观、缩放、全屏、截屏
import { project, getActiveFile } from '../core/store.js';
import { syncActiveFile } from '../editor/editor-state.js';
import { buildPreviewDocForProject } from './preview-builder.js';
import { pagePreview, showPage } from '../ui/pages.js';
import { showToast } from '../core/utils.js';

const previewFrame = document.getElementById('previewFrame');
const previewTitle = document.getElementById('previewTitle');
const previewMenuMask = document.getElementById('previewMenuMask');
const previewMenu = document.getElementById('previewMenu');
const fullscreenExit = document.getElementById('fullscreenExit');

let currentAppearance = 'white';
let currentZoom = 1;

function renderPreview() {
  if (!project) return;
  syncActiveFile();
  const f = getActiveFile();
  if (!f) { showToast('没有可预览的文件'); return; }
  previewTitle.textContent = f.name;
  previewFrame.srcdoc = buildPreviewDocForProject(project, f.name, f.content);
  previewFrame.onload = () => { applyAppearance(currentAppearance); applyZoom(currentZoom); };
}

export function enterPreview() {
  if (!project) return;
  renderPreview();
  pagePreview.classList.remove('fullscreen');
  showPage('preview');
}

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

function applyZoom(v) {
  currentZoom = v;
  previewFrame.style.zoom = (v === 1) ? '' : String(v);
}

function toggleFullscreen() { pagePreview.classList.toggle('fullscreen'); }
fullscreenExit.addEventListener('click', () => { pagePreview.classList.remove('fullscreen'); });

document.getElementById('previewReloadBtn').addEventListener('click', renderPreview);

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

/* ============ 预览菜单 ============ */
function showMenuPanel(menuEl, name) {
  menuEl.querySelectorAll('.menu-panel').forEach(p => { p.hidden = p.dataset.panel !== name; });
}
function syncPreviewMenuSelections() {
  previewMenu.querySelectorAll('[data-appearance]').forEach(el => el.classList.toggle('selected', el.dataset.appearance === currentAppearance));
  previewMenu.querySelectorAll('[data-zoom]').forEach(el => el.classList.toggle('selected', parseFloat(el.dataset.zoom) === currentZoom));
}

document.getElementById('previewMenuBtn').addEventListener('click', () => {
  previewMenuMask.classList.add('show');
  showMenuPanel(previewMenu, 'main');
  syncPreviewMenuSelections();
});
previewMenuMask.addEventListener('click', (e) => { if (e.target === previewMenuMask) previewMenuMask.classList.remove('show'); });

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
