import { projects } from '../core/store.js';
import { showToast } from '../core/utils.js';
import { showCtxMenu, openModal } from '../ui/overlays.js';
import { ICON_CTX } from '../ui/icons.js';

let deps = null;
export function initContextMenus(d) { deps = d; }

export function openProjectContextMenu(projectId, pos) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const isPinned = !!p.pinnedAt;

  showCtxMenu({
    title: p.name,
    x: pos.x, y: pos.y,
    groups: [
      [
        { action: 'rename', label: '重命名', icon: ICON_CTX.rename },
        { action: 'newfile', label: '新建文件', icon: ICON_CTX.newfile },
        { action: 'import', label: '导入文件', icon: ICON_CTX.import }
      ],
      [
        { action: 'duplicate', label: '复制一份', icon: ICON_CTX.duplicate },
        { action: 'export', label: '导出 ZIP', icon: ICON_CTX.export }
      ],
      [
        { action: 'togglePin', label: isPinned ? '取消置顶' : '置顶', icon: isPinned ? ICON_CTX.unpin : ICON_CTX.pin }
      ],
      [
        { action: 'delete', label: '删除项目', icon: ICON_CTX.delete, danger: true }
      ]
    ],
    onSelect: (action) => {
      if (action === 'rename') {
        openModal('projectRename', { initial: p.name, onConfirm: async (name) => {
          if (name === p.name) return;
          p.name = name;
          p.updatedAt = Date.now();
          if (p.id === deps.getCurrentProjectId()) {
            document.getElementById('editorTitle').textContent = p.name;
          }
          deps.renderProjects();
          await deps.saveNow();
          showToast('已重命名');
        }});
      } else if (action === 'newfile') {
        deps.openNewFileDialog(p.id);
      } else if (action === 'import') {
        deps.startImportForProject(p.id);
      } else if (action === 'duplicate') {
        deps.duplicateProject(p.id);
      } else if (action === 'export') {
        deps.exportProjectZipById(p.id);
      } else if (action === 'togglePin') {
        deps.togglePinProject(p.id);
      } else if (action === 'delete') {
        deps.confirmDeleteProject(p);
      }
    }
  });
}

export function openFileContextMenu(projectId, fileId, pos) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const f = p.files.find(x => x.id === fileId);
  if (!f) return;

  showCtxMenu({
    title: f.name,
    x: pos.x, y: pos.y,
    groups: [
      [
        { action: 'rename', label: '重命名', icon: ICON_CTX.rename },
        { action: 'toggleEntry', label: f.isEntry ? '取消入口标记' : '设为入口文件', icon: f.isEntry ? ICON_CTX.unentry : ICON_CTX.entry }
      ],
      [
        { action: 'duplicate', label: '复制一份', icon: ICON_CTX.duplicate },
        { action: 'move', label: '移动到…', icon: ICON_CTX.move },
        { action: 'copyto', label: '复制到…', icon: ICON_CTX.copyto }
      ],
      [
        { action: 'export', label: '导出文件', icon: ICON_CTX.export },
        { action: 'copyContent', label: '复制内容', icon: ICON_CTX.copycontent }
      ],
      [
        { action: 'info', label: '查看信息', icon: ICON_CTX.info }
      ],
      [
        { action: 'delete', label: '删除', icon: ICON_CTX.delete, danger: true }
      ]
    ],
    onSelect: (action) => {
      if (action === 'rename') {
        openModal('rename', { initial: f.name, onConfirm: async (name) => {
          if (name === f.name) return;
          if (p.files.some(x => x.name === name && x.id !== f.id)) { showToast('文件名已存在'); return; }
          f.name = name; f.updatedAt = Date.now(); p.updatedAt = Date.now();
          if (p.id === deps.getCurrentProjectId() && p.activeFileId === f.id) {
            document.getElementById('tabName').textContent = f.name;
            deps.updateStatusLang(f.name);
          }
          deps.renderProjects();
          await deps.saveNow();
          showToast('已重命名');
        }});
      } else if (action === 'toggleEntry') {
        deps.toggleEntryFile(p.id, f.id);
      } else if (action === 'duplicate') {
        deps.duplicateFile(p.id, f.id);
      } else if (action === 'move') {
        deps.openProjectPicker('move', p.id, f.id);
      } else if (action === 'copyto') {
        deps.openProjectPicker('copy', p.id, f.id);
      } else if (action === 'export') {
        deps.exportFile(p.id, f.id);
      } else if (action === 'copyContent') {
        deps.copyFileContent(p.id, f.id);
      } else if (action === 'info') {
        deps.showFileInfo(p.id, f.id);
      } else if (action === 'delete') {
        deps.deleteFileFromProject(p.id, f.id);
      }
    }
  });
}
