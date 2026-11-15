import { projects, createFile, uniqueNameIn, saveNow } from '../core/store.js';
import { showToast } from '../core/utils.js';
import { LANGUAGES } from '../core/constants.js';
import { iconForFile } from '../ui/icons.js';
import { openFileInProject } from '../editor/editor-state.js';

const newfileMask = document.getElementById('newfileMask');
const nfInput = document.getElementById('nfInput');
const nfExtText = document.getElementById('nfExtText');
const nfCreateBtn = document.getElementById('nfCreateBtn');
const nfProjectName = document.getElementById('nfProjectName');
const nfInputIcon = document.getElementById('nfInputIcon');
const langMask = document.getElementById('langMask');
const langList = document.getElementById('langList');

let nfSelectedLang = LANGUAGES[0];
let nfTargetProjectId = null;

function updateNfIcon() { nfInputIcon.innerHTML = iconForFile('x' + nfSelectedLang.ext); }
function updateNfCreateState() { nfCreateBtn.disabled = nfInput.value.trim().length === 0; }

export function openNewFileDialog(projectId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) { showToast('项目不存在'); return; }
  nfTargetProjectId = projectId;
  nfSelectedLang = LANGUAGES[0];
  nfExtText.textContent = nfSelectedLang.ext;
  nfInput.value = '';
  nfProjectName.textContent = p.name;
  updateNfIcon(); updateNfCreateState();
  newfileMask.classList.add('show');
  setTimeout(() => nfInput.focus(), 200);
}

function closeNewFileDialog() { newfileMask.classList.remove('show'); nfInput.blur(); }

document.getElementById('nfClose').addEventListener('click', closeNewFileDialog);
nfInput.addEventListener('input', updateNfCreateState);
document.getElementById('nfExtBtn').addEventListener('click', () => { renderLangList(); langMask.classList.add('show'); });
document.getElementById('langClose').addEventListener('click', () => langMask.classList.remove('show'));
langMask.addEventListener('click', (e) => { if (e.target === langMask) langMask.classList.remove('show'); });

function renderLangList() {
  langList.innerHTML = '';
  LANGUAGES.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'lang-item' + (lang.ext === nfSelectedLang.ext ? ' selected' : '');
    btn.type = 'button';
    btn.innerHTML = '<span>' + lang.name + '</span><span class="lang-ext">' + lang.ext + '</span>';
    btn.addEventListener('click', () => {
      nfSelectedLang = lang;
      nfExtText.textContent = lang.ext;
      updateNfIcon();
      langMask.classList.remove('show');
    });
    langList.appendChild(btn);
  });
}

nfCreateBtn.addEventListener('click', async () => {
  const baseName = nfInput.value.trim();
  if (!baseName) return;
  const p = projects.find(x => x.id === nfTargetProjectId);
  if (!p) return;
  let cleanBase = baseName;
  const lastDot = baseName.lastIndexOf('.');
  if (lastDot > 0) {
    const maybeExt = baseName.slice(lastDot).toLowerCase();
    if (LANGUAGES.some(l => l.ext === maybeExt)) cleanBase = baseName.slice(0, lastDot);
  }
  const fileName = uniqueNameIn(p, cleanBase + nfSelectedLang.ext);
  const f = createFile(fileName, '', false);
  p.files.push(f);
  p.activeFileId = f.id;
  p.updatedAt = Date.now();
  closeNewFileDialog();
  await saveNow();
  openFileInProject(p.id, f.id);
  showToast('已创建 ' + fileName);
});
