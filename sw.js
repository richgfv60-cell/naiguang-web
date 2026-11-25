/* 奶油动物镇 · 离线缓存（让「我的房间」和小应用能装到主屏幕、断网也能打开）
   - 网页 / 脚本：先走网络，拿不到再用缓存（保证更新后马上看到新版）
   - 图片：先用缓存，没有再下载
   - 视频不缓存（太大） */
const CACHE = 'ngw-20261125b';
const CORE = ['data.js', 'app/core.css', 'app/core.js', 'app/chars.js', 'app/record.js', 'app/game.js', 'app/room.js', 'app/install.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || /\.(mp4|webm|mov)$/i.test(url.pathname)) return;
  const isImg = req.destination === 'image' || /\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname);
  if (isImg) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match(req, { ignoreSearch: true }))));
});
