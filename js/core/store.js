// 全局状态：项目集合、当前项目指针、数据模型、持久化
import { loadFromDB, saveToDB } from './db.js';
import { DEFAULT_TEMPLATE, TRASH_RETENTION_DAYS } from './constants.js';
import { flashSaved } from './utils.js';

export let projects = [];
export let currentProjectId = null;
export let project = null;
let fileIdSeq = 1;
let booted = false;

export function newFileId() { return 'f' + (fileIdSeq++) + '_' + Date.now().toString(36); }
export function newProjectId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export function createFile(name, content, isEntry) {
  content = content === undefined ? '' : content;
  isEntry = isEntry === undefined ? false : isEntry;
  return { id: newFileId(), name, content, isEntry, updatedAt: Date.now() };
}

export function createProject(name) {
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

export function setCurrentProject(id) {
  currentProjectId = id;
  project = projects.find(p => p.id === id) || null;
}

export function clearCurrentProject() {
  currentProjectId = null;
  project = null;
}

export function getActiveFile() {
  if (!project) return null;
  return project.files.find(f => f.id === project.activeFileId) || null;
}

export function getEntryFile(p) {
  p = p || project;
  if (!p) return null;
  return p.files.find(f => f.isEntry) || p.files[0] || null;
}

export function liveProjects() { return projects.filter(p => !p.deletedAt); }
export function trashedProjects() { return projects.filter(p => p.deletedAt); }

export function projectLastUpdated(p) {
  if (!p.files || !p.files.length) return p.updatedAt || Date.now();
  return Math.max(...p.files.map(f => f.updatedAt || 0), p.updatedAt || 0);
}

export function daysLeft(p) {
  if (!p.deletedAt) return TRASH_RETENTION_DAYS;
  const ms = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const left = p.deletedAt + ms - Date.now();
  return Math.max(0, Math.ceil(left / (24 * 60 * 60 * 1000)));
}

export function uniqueNameIn(targetProject, baseName) {
  if (!targetProject.files.some(f => f.name === baseName)) return baseName;
  const dot = baseName.lastIndexOf('.');
  const base = dot > 0 ? baseName.slice(0, dot) : baseName;
  const ext = dot > 0 ? baseName.slice(dot) : '';
  let i = 1;
  while (targetProject.files.some(f => f.name === base + '_' + i + ext)) i++;
  return base + '_' + i + ext;
}

/* ============ 持久化 ============ */
let saveTimer = null;

export function scheduleSave() {
  if (!booted) return;
  if (!projects.length) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try { await saveToDB({ projects, currentProjectId }); flashSaved(); } catch (e) {}
  }, 500);
}

export async function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (!booted) return;
  try { await saveToDB({ projects, currentProjectId }); flashSaved(); } catch (e) {}
}

/* ============ 启动加载 ============ */
export async function loadFromStorage() {
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
        clearCurrentProject();
      }
      projects.forEach(p => {
        if (!p.files.some(f => f.isEntry) && p.files.length) p.files[0].isEntry = true;
        if (!p.files.some(f => f.id === p.activeFileId) && p.files.length) p.activeFileId = p.files[0].id;
      });
    }
  } catch (e) { console.warn('恢复失败', e); }
  booted = true;
}

export function cleanupExpired() {
  const ms = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const before = projects.length;
  projects = projects.filter(p => {
    if (p.deletedAt && now - p.deletedAt > ms) return false;
    return true;
  });
  return before !== projects.length;
}

/* ============ 存储持久化许可 + 页面隐藏时保存 ============ */
setTimeout(() => {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
}, 0);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveNow();
});
window.addEventListener('pagehide', () => { saveNow(); });
