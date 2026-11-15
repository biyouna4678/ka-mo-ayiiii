// 编辑器设置：字号 / Tab 宽度（live binding，供 formatter 读 tabSize）
export let editorFontSize = 16;
export let editorTabSize = 2;

const settingsSheet = document.getElementById('settingsSheet');
const segFontSize = document.getElementById('segFontSize');
const segTabSize = document.getElementById('segTabSize');

export function applyEditorSettings() {
  document.documentElement.style.setProperty('--cv-editor-font-size', editorFontSize + 'px');
  document.documentElement.style.setProperty('--cv-editor-tab-size', String(editorTabSize));
  segFontSize.querySelectorAll('button').forEach(b => b.classList.toggle('on', parseInt(b.dataset.val) === editorFontSize));
  segTabSize.querySelectorAll('button').forEach(b => b.classList.toggle('on', parseInt(b.dataset.val) === editorTabSize));
}
segFontSize.addEventListener('click', (e) => { const btn = e.target.closest('button'); if (!btn) return; editorFontSize = parseInt(btn.dataset.val); applyEditorSettings(); });
segTabSize.addEventListener('click', (e) => { const btn = e.target.closest('button'); if (!btn) return; editorTabSize = parseInt(btn.dataset.val); applyEditorSettings(); });

export function openSettingsSheet() { settingsSheet.classList.add('show'); applyEditorSettings(); }

// 首次应用
applyEditorSettings();
