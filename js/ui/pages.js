// 四个全屏页的切换
export const pageWorkspace = document.getElementById('pageWorkspace');
export const pageTrash     = document.getElementById('pageTrash');
export const pageEditor    = document.getElementById('pageEditor');
export const pagePreview   = document.getElementById('pagePreview');

let onShowWorkspace = null;
export function setOnShowWorkspace(fn) { onShowWorkspace = fn; }

export function showPage(name) {
  [pageWorkspace, pageTrash, pageEditor, pagePreview].forEach(p => p.classList.remove('active'));
  ({ workspace: pageWorkspace, trash: pageTrash, editor: pageEditor, preview: pagePreview })[name].classList.add('active');
  if (name === 'workspace' && onShowWorkspace) onShowWorkspace();
}
