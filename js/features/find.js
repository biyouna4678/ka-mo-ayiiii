// 查找和替换
import { codeInput, getSelectionOrNull } from '../editor/codemirror.js';
import { syncActiveFile, updateStatus } from '../editor/editor-state.js';

const findSheet = document.getElementById('findSheet');
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const findHint = document.getElementById('findHint');
let findLastIndex = -1;

export function openFindSheet() {
  findSheet.classList.add('show');
  findLastIndex = -1;
  const sel = getSelectionOrNull();
  if (sel) findInput.value = sel.text;
  updateFindHint();
}

function updateFindHint() {
  const q = findInput.value;
  if (!q) { findHint.textContent = '未开始查找'; return; }
  const text = codeInput.value;
  let count = 0, idx = 0;
  while ((idx = text.indexOf(q, idx)) !== -1) { count++; idx += q.length; }
  findHint.textContent = '匹配 ' + count + ' 处';
}

findInput.addEventListener('input', () => { findLastIndex = -1; updateFindHint(); });

function findNext() {
  const q = findInput.value; if (!q) return;
  const text = codeInput.value;
  let from = findLastIndex === -1 ? codeInput.selectionEnd : findLastIndex + q.length;
  let idx = text.indexOf(q, from);
  if (idx === -1) idx = text.indexOf(q, 0);
  if (idx === -1) { findHint.textContent = '未找到'; return; }
  findLastIndex = idx;
  codeInput.focus();
  codeInput.setSelectionRange(idx, idx + q.length);
  updateStatus();
}

function findPrev() {
  const q = findInput.value; if (!q) return;
  const text = codeInput.value;
  let from = findLastIndex === -1 ? Math.max(0, codeInput.selectionStart - 1) : Math.max(0, findLastIndex - 1);
  let idx = text.lastIndexOf(q, from);
  if (idx === -1) idx = text.lastIndexOf(q);
  if (idx === -1) { findHint.textContent = '未找到'; return; }
  findLastIndex = idx;
  codeInput.focus();
  codeInput.setSelectionRange(idx, idx + q.length);
  updateStatus();
}

function replaceOne() {
  const q = findInput.value; if (!q) return;
  const s = codeInput.selectionStart;
  const e = codeInput.selectionEnd;
  if (codeInput.value.slice(s, e) === q) {
    codeInput.replaceRange(s, e, replaceInput.value);
    syncActiveFile(); updateStatus(); findNext();
  } else findNext();
}

function replaceAll() {
  const q = findInput.value; if (!q) return;
  codeInput.value = codeInput.value.split(q).join(replaceInput.value);
  syncActiveFile();
  findLastIndex = -1;
  updateFindHint(); updateStatus();
}

document.getElementById('findNextBtn').addEventListener('click', findNext);
document.getElementById('findPrevBtn').addEventListener('click', findPrev);
document.getElementById('replaceBtn').addEventListener('click', replaceOne);
document.getElementById('replaceAllBtn').addEventListener('click', replaceAll);
