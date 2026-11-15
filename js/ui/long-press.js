// 长按手势（鼠标/触摸通用）。长按后阻止后续 click，避免与点击冲突
export function attachLongPress(el, cb) {
  let timer = null, longPressed = false;
  let startX = 0, startY = 0;
  const DURATION = 550;

  const start = (e) => {
    longPressed = false;
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX;
    startY = t.clientY;
    timer = setTimeout(() => {
      longPressed = true;
      if (navigator.vibrate) navigator.vibrate(15);
      cb({ x: startX, y: startY });
    }, DURATION);
  };
  const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };

  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchend', cancel);
  el.addEventListener('touchmove', cancel, { passive: true });
  el.addEventListener('touchcancel', cancel);
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', cancel);
  el.addEventListener('mouseleave', cancel);
  el.addEventListener('click', (e) => {
    if (longPressed) { e.preventDefault(); e.stopPropagation(); longPressed = false; }
  }, true);
}
