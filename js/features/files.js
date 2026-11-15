import {
  projects, createFile, uniqueNameIn, currentProjectId, saveNow
} from '../core/store.js';
import {
  showToast, copyToClipboard, formatBytes, formatRelativeTime, escapeHtmlText
} from '../core/utils.js';
import { loadActiveFileToEditor } from '../editor/editor-state.js';

let deps = null;
export function initFiles(d) { deps = d; }

/* ============ 入口标记 ============ */
export async function toggleEntryFile(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;
  if (f.isEntry) {
    f.isEntry = false;
  } else {
    p.files.forEach(x => x.isEntry = false);
    f.isEntry = true;
  }
  f.updatedAt = Date.now();
  p.updatedAt = Date.now();
  deps.renderProjects();
  await saveNow();
  showToast(f.isEntry ? '已设为入口' : '已取消入口');
}

/* ============ 复制文件 ============ */
export async function duplicateFile(projectId, fileId) {
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
  deps.renderProjects();
  showToast('已复制为 ' + newName);
}

/* ============ 删除文件 ============ */
export async function deleteFileFromProject(projectId, fileId) {
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
    if (p.id === currentProjectId) loadActiveFileToEditor();
  }
  p.updatedAt = Date.now();
  deps.renderProjects();
  await saveNow();
  showToast('已删除');
}

/* ============ 导出单个文件 ============ */
export function exportFile(projectId, fileId) {
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

/* ============ 复制文件内容 ============ */
export async function copyFileContent(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;
  await copyToClipboard(f.content);
  showToast('已复制文件内容');
}

/* ============ 文件信息面板 ============ */
const infoSheet = document.getElementById('infoSheet');
const infoGrid = document.getElementById('infoGrid');
const infoTitle = document.getElementById('infoTitle');

export function showFileInfo(projectId, fileId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;
  const text = f.content;
  const size = new Blob([text]).size;
  infoTitle.textContent = f.name;
  infoGrid.innerHTML = '';
  const rows = [
    ['大小', formatBytes(size)],
    ['字符数（含空格）', String(text.length)],
    ['字符数（不含空格）', String(text.replace(/\s/g, '').length)],
    ['行数', String(text.split('\n').length)],
    ['非空行数', String(text.split('\n').filter(l => l.trim()).length)],
    ['中文字符数', String((text.match(/[\u4e00-\u9fa5]/g) || []).length)],
    ['最后修改', formatRelativeTime(f.updatedAt)],
    ['是否入口文件', f.isEntry ? '是' : '否']
  ];
  rows.forEach(([k, v]) => {
    const kEl = document.createElement('div');
    kEl.className = 'k';
    kEl.textContent = k;
    const vEl = document.createElement('div');
    vEl.className = 'v';
    vEl.textContent = v;
    infoGrid.appendChild(kEl);
    infoGrid.appendChild(vEl);
  });
  infoSheet.classList.add('show');
}

/* ============ 移动到 / 复制到 项目选择器 ============ */
const projectPickerSheet = document.getElementById('projectPickerSheet');
const projectPickerTitle = document.getElementById('projectPickerTitle');
const projectPickerList = document.getElementById('projectPickerList');

document.getElementById('projectPickerClose').addEventListener('click', () => {
  projectPickerSheet.classList.remove('show');
});
projectPickerSheet.addEventListener('click', (e) => {
  if (e.target === projectPickerSheet) projectPickerSheet.classList.remove('show');
});

export function openProjectPicker(mode, sourceProjectId, fileId) {
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
      row.innerHTML =
        '<span>' + escapeHtmlText(t.name) + '</span>' +
        '<span class="lang-ext">' + t.files.length + ' 个文件</span>';
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

/* ============ 跨项目移动 ============ */
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
  deps.renderProjects();
  showToast('已移动到「' + dst.name + '」');
}

/* ============ 跨项目复制 ============ */
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
  deps.renderProjects();
  showToast('已复制到「' + dst.name + '」');
}
