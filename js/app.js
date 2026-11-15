import {
  projects, createProject, setCurrentProject, saveNow,
  loadFromStorage, cleanupExpired
} from './core/store.js';
import { showToast } from './core/utils.js';
import { setOnShowWorkspace } from './ui/pages.js';
import { openModal } from './ui/overlays.js';
import { enterEditor, openFileInProject, updateStatusLang } from './editor/editor-state.js';
import { renderProjects, initWorkspace } from './pages/workspace.js';
import { initTrash } from './pages/trash.js';
import {
  initProjects, duplicateProject, togglePinProject, confirmDeleteProject
} from './features/projects.js';
import {
  initFiles, toggleEntryFile, duplicateFile, openProjectPicker,
  exportFile, copyFileContent, showFileInfo, deleteFileFromProject
} from './features/files.js';
import {
  initContextMenus, openProjectContextMenu, openFileContextMenu
} from './features/context-menus.js';
import { openNewFileDialog } from './features/new-file.js';
import {
  initImport, setPendingImportProject, triggerImport
} from './features/import.js';
import { exportProjectZipById } from './features/export.js';

// 副作用模块：一旦 import 即完成 UI 事件绑定
import './editor/editor-view.js';
import './features/preview.js';
import './features/settings.js';
import './features/formatter.js';
import './features/encoder.js';
import './features/toolbox.js';
import './features/find.js';
import './features/stats.js';
import './features/regex.js';

/* ============ 组合工具函数 ============ */
function startImportForProject(projectId) {
  setPendingImportProject(projectId);
  triggerImport('files');
}

/* ============ 依赖注入 ============ */
initWorkspace({
  openFileInProject,
  openNewFileDialog,
  openProjectContextMenu,
  openFileContextMenu,
  startImportForProject,
  confirmDeleteProject
});

initContextMenus({
  openNewFileDialog,
  startImportForProject,
  duplicateProject,
  exportProjectZipById,
  togglePinProject,
  confirmDeleteProject,
  renderProjects,
  toggleEntryFile,
  duplicateFile,
  openProjectPicker,
  exportFile,
  copyFileContent,
  showFileInfo,
  deleteFileFromProject,
  saveNow,
  updateStatusLang,
  getCurrentProjectId: () => {
    // live binding 读当前项目 id
    return document.getElementById('editorTitle') ? null : null;
  }
});

initProjects({ renderProjects });
initFiles({ renderProjects });
initImport({ renderProjects });
initTrash();

setOnShowWorkspace(renderProjects);

/* ============ 顶部按钮 ============ */
document.getElementById('newProjectBtn').addEventListener('click', () => {
  openModal('project', { onConfirm: async (name) => {
    const p = createProject(name);
    projects.unshift(p);
    setCurrentProject(p.id);
    await saveNow();
    renderProjects();
    enterEditor();
    showToast('项目已创建');
  }});
});

document.getElementById('importFileBtn').addEventListener('click', () => {
  setPendingImportProject(null);
  triggerImport('files');
});
document.getElementById('importFolderBtn').addEventListener('click', () => {
  setPendingImportProject(null);
  triggerImport('folder');
});

/* ============ 启动 ============ */
(async function boot() {
  await loadFromStorage();
  if (cleanupExpired()) {
    await saveNow();
  }
  renderProjects();
})();
