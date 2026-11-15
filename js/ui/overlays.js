// 三种浮层：确认框、输入弹窗、上下文菜单
let confirmCallback = null;
export function showConfirm(opts) {
  document.getElementById('confirmTitle').textContent = opts.title || '确认操作';
  document.getElementById('confirmDesc').textContent = opts.desc || '';
  document.getElementById('confirmOk').textContent = opts.confirmText || '确定';
  confirmCallback = opts.onConfirm || null;
  document.getElementById('confirmMask').classList.add('show');
}
export function hideConfirm() {
  document.getElementById('confirmMask').classList.remove('show');
  confirmCallback = null;
}
document.getElementById('confirmCancel').addEventListener('click', hideConfirm);
document.getElementById('confirmOk').addEventListener('click', () => {
  const cb = confirmCallback;
  hideConfirm();
  if (cb) cb();
});
document.getElementById('confirmMask').addEventListener('click', (e) => {
  if (e.target === document.getElementById('confirmMask')) hideConfirm();
});

/* ============ 输入弹窗 ============ */
const mask = document.getElementById('modalMask');
const input = document.getElementById('projectNameInput');
let modalCallback = null;

export function openModal(mode, opts) {
  opts = opts || {};
  modalCallback = opts.onConfirm || null;
  const titleEl = document.getElementById('modalTitle');
  const descEl = document.getElementById('modalDesc');
  const btnEl = document.getElementById('createBtn');
  if (mode === 'project') {
    titleEl.textContent = '创建新项目';
    descEl.textContent = '输入您的项目的名称。里面会创建一个空白的 index.html。';
    btnEl.textContent = '创建';
    input.placeholder = 'My Project';
    input.value = '';
  } else if (mode === 'rename') {
    titleEl.textContent = '重命名';
    descEl.textContent = '输入新的文件名';
    btnEl.textContent = '确定';
    input.placeholder = 'filename';
    input.value = opts.initial || '';
  } else if (mode === 'projectRename') {
    titleEl.textContent = '重命名项目';
    descEl.textContent = '输入新的项目名称';
    btnEl.textContent = '确定';
    input.placeholder = 'My Project';
    input.value = opts.initial || '';
  }
  mask.classList.add('show');
  setTimeout(() => input.focus(), 50);
}
export function closeModal() {
  mask.classList.remove('show');
  input.blur();
}
document.getElementById('cancelBtn').addEventListener('click', closeModal);
mask.addEventListener('click', (e) => { if (e.target === mask) closeModal(); });
document.getElementById('createBtn').addEventListener('click', () => {
  const name = input.value.trim();
  if (!name) { input.focus(); return; }
  const cb = modalCallback;
  closeModal();
  if (cb) cb(name);
});

/* ============ 上下文菜单 ============ */
const ctxMask = document.getElementById('ctxMask');
const ctxMenu = document.getElementById('ctxMenu');
let ctxOnSelect = null;

export function showCtxMenu(opts) {
  ctxMenu.innerHTML = '';
  ctxOnSelect = opts.onSelect || null;

  if (opts.title) {
    const t = document.createElement('div');
    t.className = 'ctx-title';
    t.textContent = opts.title;
    ctxMenu.appendChild(t);
  }

  opts.groups.forEach(group => {
    const gEl = document.createElement('div');
    gEl.className = 'ctx-group';
    group.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'ctx-item' + (item.danger ? ' danger' : '');
      btn.type = 'button';
      btn.innerHTML = '<span>' + item.label + '</span>' + (item.icon || '');
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const cb = ctxOnSelect;
        hideCtxMenu();
        if (cb) cb(item.action);
      });
      gEl.appendChild(btn);
    });
    ctxMenu.appendChild(gEl);
  });

  ctxMenu.style.left = '0px';
  ctxMenu.style.top = '0px';
  ctxMask.classList.add('show');

  requestAnimationFrame(() => {
    const mw = ctxMenu.offsetWidth;
    const mh = ctxMenu.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const MARGIN = 12;
    const GAP = 12;

    let left = opts.x - mw / 2;
    if (left < MARGIN) left = MARGIN;
    if (left + mw > vw - MARGIN) left = vw - MARGIN - mw;

    let top;
    if (opts.y + GAP + mh + MARGIN <= vh) {
      top = opts.y + GAP;
    } else if (opts.y - GAP - mh >= MARGIN) {
      top = opts.y - GAP - mh;
    } else {
      top = Math.max(MARGIN, vh - MARGIN - mh);
    }
    ctxMenu.style.left = left + 'px';
    ctxMenu.style.top = top + 'px';
  });
}

export function hideCtxMenu() {
  ctxMask.classList.remove('show');
  ctxOnSelect = null;
}
ctxMask.addEventListener('click', hideCtxMenu);
ctxMask.addEventListener('touchstart', (e) => {
  if (!ctxMenu.contains(e.target)) hideCtxMenu();
}, { passive: true });
