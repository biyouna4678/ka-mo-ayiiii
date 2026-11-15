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
let lastPreviewKey = null;

function renderPreview(force = false) {
  if (!project) return;
  syncActiveFile();
  const f = getActiveFile();
  if (!f) { showToast('没有可预览的文件'); return; }

  const previewKey = project.id + '_' + f.id + '_' + f.content;

  if (!force && lastPreviewKey === previewKey) {
    return;
  }

  previewTitle.textContent = f.name;
  previewFrame.srcdoc = buildPreviewDocForProject(project, f.name, f.content);
  lastPreviewKey = previewKey;

  previewFrame.onload = () => { 
    applyAppearance(currentAppearance); 
    applyZoom(currentZoom); 
  };
}

export function enterPreview() {
  if (!project) return;
  renderPreview(false);
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

document.getElementById('previewReloadBtn').addEventListener('click', () => {
  renderPreview(true);
});

async function capturePreview(mode) {
  if (typeof htmlToImage === 'undefined') { alert('截屏库未加载'); return; }
  const doc = previewFrame.contentDocument;
  if (!doc || !doc.body) return;
  
  const vw = previewFrame.clientWidth;
  const vh = previewFrame.clientHeight;
  
  const options = {
    quality: 0.95,
    backgroundColor: currentAppearance === 'dark' ? '#111' : (currentAppearance === 'gray' ? '#f0f0f0' : '#ffffff'),
    // 关键设置：确保捕获整个宽度/高度
    width: mode === 'viewport' ? vw : Math.max(doc.documentElement.scrollWidth, vw),
    height: mode === 'viewport' ? vh : Math.max(doc.documentElement.scrollHeight, vh)
  };

  showToast('正在生成高清截图…', 0);

  try {
    // 使用 html-to-image 替换 html2canvas
    const blob = await htmlToImage.toBlob(doc.body, options);
    if (!blob) {
      showToast('截屏失败，无法生成图片');
      return;
    }
    
    const file = new File([blob], 'preview.png', { type: 'image/png' });
    
    // 尝试调用系统分享（最适配手机端）
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { 
        await navigator.share({ files: [file], title: '预览截图' }); 
        showToast('已分享');
        return; 
      } catch (e) {
        // 如果用户取消了分享，或者系统不支持，就降级为下载
      }
    }
    
    // 下载逻辑
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'preview-' + Date.now() + '.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('已保存截图');
  } catch (err) {
    console.error(err);
    showToast('截屏失败：' + err.message, 2600);
  }
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
