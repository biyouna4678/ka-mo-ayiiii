// SVG 优化 + 图片转 Base64
import { codeInput, getSelectionOrNull } from '../editor/codemirror.js';
import { syncActiveFile } from '../editor/editor-state.js';
import { showToast, loadScriptOnce } from '../core/utils.js';

let isOptimizingSvg = false;
export async function optimizeSvg() {
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
    if (optimized.length >= sel.text.length) {
      showToast('已是最优，未压缩');
    } else {
      const saved = (100 - (optimized.length / sel.text.length) * 100).toFixed(1);
      codeInput.replaceRange(sel.start, sel.end, optimized);
      syncActiveFile();
      showToast('已优化 · 减少 ' + saved + '%');
    }
  } catch (e) {
    showToast('优化失败：' + (e && e.message ? e.message : e), 2600);
  } finally {
    isOptimizingSvg = false;
  }
}

const imageFileInput = document.getElementById('imageFileInput');
let pendingInsertMode = 'replace';

export function inlineImageBase64() {
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
