// PWA：注册 Service Worker（manifest 已静态化，无需动态生成）
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch((err) => {
    console.warn('SW 注册失败', err);
  });
}
