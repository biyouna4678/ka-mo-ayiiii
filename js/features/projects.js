import {
  projects, liveProjects, setCurrentProject, clearCurrentProject,
  saveNow, newFileId, newProjectId
} from '../core/store.js';
import { showToast } from '../core/utils.js';
import { showConfirm } from '../ui/overlays.js';

let deps = null;
export function initProjects(d) { deps = d; }

export async function duplicateProject(projectId) {
  const src = projects.find(x => x.id === projectId);
  if (!src) return;
  const newP = {
    id: newProjectId(),
    name: src.name + ' 副本',
    files: src.files.map(f => ({
      id: newFileId(),
      name: f.name,
      content: f.content,
      isEntry: f.isEntry,
      updatedAt: Date.now()
    })),
    activeFileId: null,
    updatedAt: Date.now(),
    deletedAt: null,
    pinnedAt: null
  };
  newP.activeFileId = newP.files[0] ? newP.files[0].id : null;
  projects.unshift(newP);
  await saveNow();
  deps.renderProjects();
  showToast('已复制项目');
}

export async function togglePinProject(projectId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  p.pinnedAt = p.pinnedAt ? null : Date.now();
  await saveNow();
  deps.renderProjects();
  showToast(p.pinnedAt ? '已置顶' : '已取消置顶');
}

export function confirmDeleteProject(p) {
  showConfirm({
    title: '要删除“' + p.name + '”吗？',
    desc: '删除此项目将同时删除其数据。',
    confirmText: '删除',
    onConfirm: async () => {
      p.deletedAt = Date.now();
      p.pinnedAt = null;
      // 如果删除的是当前项目，切换到一个还活着的项目
      const currentId = p.id;
      const live = liveProjects();
      if (!live.some(x => x.id === currentId)) {
        if (live.length) setCurrentProject(live[0].id);
        else clearCurrentProject();
      }
      await saveNow();
      deps.renderProjects();
      showToast('已移入回收站');
    }
  });
}
