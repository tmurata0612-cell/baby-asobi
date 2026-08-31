const CACHE = 'baby-asobi-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET') return;
  /* HTMLはネットワーク優先（更新をすぐ反映）。オフライン時のみキャッシュ */
  if (ev.request.mode === 'navigate') {
    ev.respondWith(
      fetch(ev.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(ev.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(ev.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  /* その他アセットはキャッシュ優先 */
  ev.respondWith(
    caches.match(ev.request).then(hit =>
      hit ||
      fetch(ev.request).then(res => {
        if (res.ok && new URL(ev.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(ev.request, copy));
        }
        return res;
      })
    )
  );
});
