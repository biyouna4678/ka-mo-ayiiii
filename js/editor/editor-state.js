import { codeInput, langExtForFile } from './codemirror.js';
import {
  projects, project, setCurrentProject, getActiveFile, scheduleSave
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
  const map = {
    html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', less: 'LESS',
    js: 'JavaScript', jsx: 'JSX', mjs: 'JS', cjs: 'JS',
    ts: 'TypeScript', tsx: 'TSX', json: 'JSON',
    md: 'Markdown', markdown: 'Markdown', txt: 'Text', svg: 'SVG'
  };
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

// 切换项目：先 sync 旧项目内容，再切指针，最后加载新项目
export function openFileInProject(projectId, fileId) {
  const targetProject = projects.find(x => x.id === projectId);
  if (!targetProject) return;
  const targetFile = targetProject.files.find(x => x.id === fileId);
  if (!targetFile) return;

  if (project) syncActiveFile();
  setCurrentProject(projectId);
  if (!project) return;

  project.activeFileId = fileId;
  project.updatedAt = Date.now();
  loadActiveFileToEditor();
  scheduleSave();
  showPage('editor');
}
