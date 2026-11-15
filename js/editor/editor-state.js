// 编辑器内容与全局状态的同步；切换项目/文件的入口
import { codeInput, langExtForFile } from './codemirror.js';
import {
  project, setCurrentProject, getActiveFile, scheduleSave
} from '../core/store.js';
import { showPage } from '../ui/pages.js';
import { showToast } from '../core/utils.js';

export function updateStatus() {
  const val = codeInput.value;
  const pos = codeInput.selectionStart;
  const before = val.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  document.getElementById('statusPos').textContent = '行 ' + line + ', 列 ' + col;
}

export function updateStatusLang(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map = { html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', less: 'LESS', js: 'JavaScript', jsx: 'JSX', mjs: 'JS', cjs: 'JS', ts: 'TypeScript', tsx: 'TSX', json: 'JSON', md: 'Markdown', markdown: 'Markdown', txt: 'Text', svg: 'SVG' };
  document.getElementById('statusLang').textContent = map[ext] || (ext ? ext.toUpperCase() : 'TEXT');
  try { codeInput.reconfigureLanguage(langExtForFile(ext)); } catch (e) { console.warn('语言切换失败', e); }
}

export function loadActiveFileToEditor() {
  if (!project) {
    codeInput.value = '';
    return;
  }
  const f = getActiveFile();
  if (f) {
    codeInput.value = f.content;
    document.getElementById('tabName').textContent = f.name;
    document.getElementById('editorTitle').textContent = project.name;
    updateStatusLang(f.name);
  }
  updateStatus();
}

export function syncActiveFile() {
  if (!project) return;
  const f = getActiveFile();
  if (!f) return;
  const currentVal = codeInput.value;
  if (f.content === currentVal) return;
  f.content = currentVal;
  f.updatedAt = Date.now();
  project.updatedAt = Date.now();
  scheduleSave();
}

export function enterEditor() {
  if (!project) { showToast('请先创建项目'); return; }
  loadActiveFileToEditor();
  showPage('editor');
}

// 【关键修复】切换项目时：先 sync 旧项目，再单纯切指针，最后加载新项目
export function openFileInProject(projectId, fileId) {
  const targetProject = project; // 仅为说明阅读，不参与逻辑
  // 从 store 直接读取最新的 projects 数组
  // 这里通过 setCurrentProject 内部查找即可
  if (project) syncActiveFile();
  setCurrentProject(projectId);
  if (!project) return;
  const f = project.files.find(x => x.id === fileId);
  if (!f) return;
  project.activeFileId = fileId;
  project.updatedAt = Date.now();
  loadActiveFileToEditor();
  scheduleSave();
  showPage('editor');
}
