// Simple network-first SW with offline fallback
const CACHE = 'ipicare-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './mp4/lemonbalm.mp4',
  './mp4/mint_rosemary.mp4',
  './mp4/basil_lettuce.mp4',
  './mp4/calm_blend.mp4'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(()=>caches.match(req).then(r=>r || caches.match('./index.v2.html')))
  );
});
