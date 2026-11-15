import { projects, trashedProjects, daysLeft, saveNow } from '../core/store.js';
import { formatDate, escapeHtmlText, showToast } from '../core/utils.js';
import { ICON_FOLDER_BLUE, CHECK_WHITE } from '../ui/icons.js';
import { showConfirm } from '../ui/overlays.js';
import { showPage } from '../ui/pages.js';

const trashList = document.getElementById('trashList');
const trashCount = document.getElementById('trashCount');
const trashBody = document.getElementById('trashBody');
const trashActionBar = document.getElementById('trashActionBar');
const trashSelectBtn = document.getElementById('trashSelectBtn');
const trashRestoreBtn = document.getElementById('trashRestoreBtn');
const trashDeleteBtn = document.getElementById('trashDeleteBtn');
let trashSelectMode = false;
const selectedTrashIds = new Set();

export function openTrash() {
  trashSelectMode = false;
  selectedTrashIds.clear();
  trashSelectBtn.textContent = '选择';
  trashBody.classList.remove('select-mode');
  trashActionBar.classList.remove('show');
  renderTrash();
  showPage('trash');
}

document.getElementById('openTrashBtn').addEventListener('click', openTrash);
document.getElementById('trashBackBtn').addEventListener('click', () => showPage('workspace'));

trashSelectBtn.addEventListener('click', () => {
  trashSelectMode = !trashSelectMode;
  trashSelectBtn.textContent = trashSelectMode ? '完成' : '选择';
  trashBody.classList.toggle('select-mode', trashSelectMode);
  trashActionBar.classList.toggle('show', trashSelectMode);
  if (!trashSelectMode) selectedTrashIds.clear();
  renderTrash();
});

function updateTrashActions() {
  const n = selectedTrashIds.size;
  trashRestoreBtn.disabled = n === 0;
  trashDeleteBtn.disabled = n === 0;
  trashRestoreBtn.textContent = n > 0 ? '恢复 (' + n + ')' : '恢复';
  trashDeleteBtn.textContent = n > 0 ? '永久删除 (' + n + ')' : '永久删除';
}

function renderTrash() {
  const trashed = trashedProjects().slice().sort((a, b) => b.deletedAt - a.deletedAt);
  trashCount.textContent = String(trashed.length);
  trashList.innerHTML = '';
  if (!trashed.length) {
    trashList.innerHTML = '<div class="trash-empty">回收站为空</div>';
    updateTrashActions();
    return;
  }
  trashed.forEach(p => {
    const card = document.createElement('div');
    card.className = 'trash-card';
    if (selectedTrashIds.has(p.id)) card.classList.add('selected');
    card.innerHTML =
      '<div class="trash-select-circle">' + CHECK_WHITE + '</div>' +
      '<div class="trash-cover">' + ICON_FOLDER_BLUE + '</div>' +
      '<div class="trash-info">' +
        '<div class="trash-name">' + escapeHtmlText(p.name) + '</div>' +
        '<div class="trash-meta">' + p.files.length + ' 项 · ' + formatDate(p.deletedAt) + '</div>' +
      '</div>' +
      '<div class="trash-days">剩余 ' + daysLeft(p) + ' 天</div>';
    card.addEventListener('click', () => {
      if (!trashSelectMode) return;
      if (selectedTrashIds.has(p.id)) selectedTrashIds.delete(p.id);
      else selectedTrashIds.add(p.id);
      renderTrash();
      updateTrashActions();
    });
    trashList.appendChild(card);
  });
  updateTrashActions();
}

trashRestoreBtn.addEventListener('click', async () => {
  if (!selectedTrashIds.size) return;
  const ids = Array.from(selectedTrashIds);
  ids.forEach(id => {
    const p = projects.find(x => x.id === id);
    if (p) p.deletedAt = null;
  });
  selectedTrashIds.clear();
  await saveNow();
  renderTrash();
  showToast('已恢复 ' + ids.length + ' 个项目');
});

trashDeleteBtn.addEventListener('click', () => {
  if (!selectedTrashIds.size) return;
  const n = selectedTrashIds.size;
  showConfirm({
    title: '永久删除这 ' + n + ' 个项目吗？',
    desc: '删除后无法恢复。',
    confirmText: '永久删除',
    onConfirm: async () => {
      const ids = Array.from(selectedTrashIds);
      ids.forEach(id => {
        const idx = projects.findIndex(x => x.id === id);
        if (idx >= 0) projects.splice(idx, 1);
      });
      selectedTrashIds.clear();
      await saveNow();
      renderTrash();
      showToast('已永久删除');
    }
  });
});
