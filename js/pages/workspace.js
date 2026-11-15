import { projects, liveProjects, projectLastUpdated, getEntryFile } from '../core/store.js';
import { formatRelativeTime, formatBytes, escapeHtmlText } from '../core/utils.js';
import { iconForFile, HOME_MARK, PIN_MARK, ARROW_RIGHT } from '../ui/icons.js';
import { buildPreviewDocForProject } from '../features/preview-builder.js';
import { attachLongPress } from '../ui/long-press.js';

const wsSectionHeader = document.getElementById('wsSectionHeader');
const projectsList = document.getElementById('projectsList');
const expandedProjectIds = new Set();
let openSwipeCard = null;

let deps = null;
export function initWorkspace(d) { deps = d; }

/* ============ 轮播 ============ */
let carouselContainer, carouselLogos;
function updateCarouselCenter() {
  if (!carouselContainer) return;
  const rect = carouselContainer.getBoundingClientRect();
  if (rect.width === 0) return;
  const center = rect.left + rect.width / 2;
  let closest = null, minDist = Infinity;
  carouselLogos.forEach(logo => {
    const lr = logo.getBoundingClientRect();
    if (lr.width === 0) return;
    const lc = lr.left + lr.width / 2;
    const d = Math.abs(center - lc);
    if (d < minDist) { minDist = d; closest = logo; }
  });
  carouselLogos.forEach(l => l.classList.remove('active'));
  if (closest) closest.classList.add('active');
}
(function initCarousel() {
  carouselContainer = document.getElementById('wsCarousel');
  carouselLogos = carouselContainer.querySelectorAll('.ws-logo');
  let scrolling = false;
  carouselContainer.addEventListener('scroll', () => {
    if (!scrolling) {
      window.requestAnimationFrame(() => { updateCarouselCenter(); scrolling = false; });
      scrolling = true;
    }
  });
  
  // 使用 ResizeObserver 监听容器尺寸变化，比 setTimeout 更可靠
  if (window.ResizeObserver) {
    new ResizeObserver(() => updateCarouselCenter()).observe(carouselContainer);
  }
  setTimeout(updateCarouselCenter, 100);
  setTimeout(updateCarouselCenter, 500);
  window.addEventListener('load', () => setTimeout(updateCarouselCenter, 100));
})();

/* ============ 项目列表 ============ */
export function renderProjects() {
  const live = liveProjects();
  if (!projects.length) {
    wsSectionHeader.classList.remove('show');
    projectsList.innerHTML = '';
    return;
  }
  wsSectionHeader.classList.add('show');
  projectsList.innerHTML = '';

  if (!live.length) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'projects-empty';
    emptyEl.textContent = '暂无项目，回收站中还有已删除的项目';
    projectsList.appendChild(emptyEl);
    return;
  }

  const sorted = live.slice().sort((a, b) => {
    const ap = a.pinnedAt || 0;
    const bp = b.pinnedAt || 0;
    if (ap !== bp) return bp - ap;
    return projectLastUpdated(b) - projectLastUpdated(a);
  });

  sorted.forEach(p => {
    const wrap = document.createElement('div');
    wrap.className = 'project-swipe';

    const actionBtn = document.createElement('button');
    actionBtn.className = 'project-swipe-action';
    actionBtn.type = 'button';
    actionBtn.textContent = '删除';
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSwipe();
      deps.confirmDeleteProject(p);
    });

    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = p.id;
    if (expandedProjectIds.has(p.id)) card.classList.add('expanded');

    const count = p.files.length;
    const time = formatRelativeTime(projectLastUpdated(p));
    const isPinned = !!p.pinnedAt;

    card.innerHTML =
      '<div class="project-head">' +
        '<div class="project-cover"><iframe sandbox="" title="' + escapeHtmlText(p.name) + '"></iframe></div>' +
        '<div class="project-info">' +
          '<div class="project-name">' +
            (isPinned ? '<span class="pin-mark">' + PIN_MARK + '</span>' : '') +
            '<span>' + escapeHtmlText(p.name) + '</span>' +
          '</div>' +
          '<div class="project-meta">' + count + ' 个文件 · ' + time + '</div>' +
        '</div>' +
        '<div class="project-chevron">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="6 9 12 15 18 9"/></svg>' +
        '</div>' +
      '</div>' +
      '<div class="project-body">' +
        '<div class="proj-file-list"></div>' +
        '<button class="proj-action" data-act="newfile">' +
          '<div class="proj-action-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
          '</div><span>新建文件</span></button>' +
        '<button class="proj-action" data-act="import">' +
          '<div class="proj-action-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M4 19h16"/></svg>' +
          '</div><span>导入文件</span></button>' +
      '</div>';

    renderCover(p, card.querySelector('iframe'));

    const fileList = card.querySelector('.proj-file-list');
    p.files.forEach(f => {
      const row = document.createElement('button');
      row.className = 'proj-file-row';
      row.type = 'button';
      const size = new Blob([f.content]).size;
      row.innerHTML =
        '<div class="proj-file-icon">' + iconForFile(f.name) + '</div>' +
        '<div class="proj-file-info">' +
          '<div class="proj-file-name">' +
            '<span>' + escapeHtmlText(f.name) + '</span>' +
            (f.isEntry ? '<span class="home-mark">' + HOME_MARK + '</span>' : '') +
          '</div>' +
          '<div class="proj-file-size">' + formatBytes(size) + '</div>' +
        '</div>' +
        '<div class="proj-file-arrow">' + ARROW_RIGHT + '</div>';
      row.addEventListener('click', (e) => { e.stopPropagation(); deps.openFileInProject(p.id, f.id); });
      attachLongPress(row, (pos) => deps.openFileContextMenu(p.id, f.id, pos));
      fileList.appendChild(row);
    });

    const headEl = card.querySelector('.project-head');
    headEl.addEventListener('click', (e) => {
      if (card.classList.contains('swiped')) {
        e.stopPropagation();
        closeSwipe();
        return;
      }
      if (expandedProjectIds.has(p.id)) expandedProjectIds.delete(p.id);
      else expandedProjectIds.add(p.id);
      card.classList.toggle('expanded');
    });
    attachLongPress(headEl, (pos) => deps.openProjectContextMenu(p.id, pos));

    card.querySelector('[data-act="newfile"]').addEventListener('click', (e) => { e.stopPropagation(); deps.openNewFileDialog(p.id); });
    card.querySelector('[data-act="import"]').addEventListener('click', (e) => { e.stopPropagation(); deps.startImportForProject(p.id); });

    attachSwipeDelete(card);

    wrap.appendChild(actionBtn);
    wrap.appendChild(card);
    projectsList.appendChild(wrap);
  });
}

function closeSwipe() {
  if (openSwipeCard) {
    openSwipeCard.classList.remove('swiped');
    openSwipeCard = null;
  }
}

function attachSwipeDelete(card) {
  let startX = 0, startY = 0, deltaX = 0;
  let dragging = false, decided = false, isHorizontal = false;
  let baseOffset = 0;
  const MOVE_THRESHOLD = 6;
  const OPEN_WIDTH = 90;

  const onStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX; startY = t.clientY;
    deltaX = 0; dragging = true; decided = false; isHorizontal = false;
    baseOffset = card.classList.contains('swiped') ? -OPEN_WIDTH : 0;
    if (openSwipeCard && openSwipeCard !== card) closeSwipe();
  };
  const onMove = (e) => {
    if (!dragging) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (!decided) {
      if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;
      decided = true;
      isHorizontal = Math.abs(dx) > Math.abs(dy);
      if (!isHorizontal) { dragging = false; return; }
      card.style.transition = 'none';
    }
    let offset = baseOffset + dx;
    if (offset > 0) offset = 0;
    if (offset < -OPEN_WIDTH) offset = -OPEN_WIDTH;
    card.style.transform = 'translateX(' + offset + 'px)';
    deltaX = offset;
    if (e.cancelable) e.preventDefault();
  };
  const onEnd = () => {
    if (!dragging && !decided) return;
    dragging = false;
    card.style.transition = '';
    card.style.transform = '';
    if (deltaX < -OPEN_WIDTH / 2) {
      card.classList.add('swiped');
      openSwipeCard = card;
    } else {
      card.classList.remove('swiped');
      if (openSwipeCard === card) openSwipeCard = null;
    }
  };

  card.addEventListener('touchstart', onStart, { passive: true });
  card.addEventListener('touchmove', onMove, { passive: false });
  card.addEventListener('touchend', onEnd);
  card.addEventListener('touchcancel', onEnd);
}

document.addEventListener('touchstart', (e) => {
  if (!openSwipeCard) return;
  if (!openSwipeCard.parentElement.contains(e.target)) closeSwipe();
}, { passive: true });
document.addEventListener('click', (e) => {
  if (!openSwipeCard) return;
  if (!openSwipeCard.parentElement.contains(e.target)) closeSwipe();
});

function renderCover(p, iframe) {
  const entry = getEntryFile(p);
  if (!entry) {
    iframe.srcdoc = '<!DOCTYPE html><html><body style="margin:0;background:#f5f5f7;"></body></html>';
    return;
  }
  iframe.srcdoc = buildPreviewDocForProject(p, entry.name, entry.content);
}
