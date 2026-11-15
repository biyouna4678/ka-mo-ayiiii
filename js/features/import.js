import {
  projects, newProjectId, createFile, uniqueNameIn, setCurrentProject, saveNow
} from '../core/store.js';
import { showToast } from '../core/utils.js';

let deps = null;
export function initImport(d) { deps = d; }

let pendingImportProjectId = null;
export function setPendingImportProject(id) { pendingImportProjectId = id; }

const TEXT_EXT = /\.(html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|json|md|markdown|svg|txt|xml|yml|yaml|toml|ini|conf|sh|py|rb|go|rs|java|c|cc|cpp|h|hpp|php|lua|sql|vue|svelte|gitignore|env)$/i;

function guessProjectName(files) {
  const first = files.find(f => /\.(html?|htm)$/i.test(f.name)) || files[0];
  if (!first) return '导入项目';
  const base = first.name.replace(/\.[^.]+$/, '');
  return base || '导入项目';
}

export async function handleImportedFiles(fileList) {
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
      deps.renderProjects();
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
  deps.renderProjects();
  showToast(skip ? '已导入 ' + files.length + ' 个，跳过 ' + skip + ' 个' : '已导入 ' + newP.files.length + ' 个文件');
}

export function triggerImport(kind) {
  const input = document.getElementById(kind === 'files' ? 'importFilesInput' : 'importFolderInput');
  input.value = '';
  input.click();
}

document.getElementById('importFilesInput').addEventListener('change', (e) => handleImportedFiles(e.target.files));
document.getElementById('importFolderInput').addEventListener('change', (e) => handleImportedFiles(e.target.files));
