/* Portfolio Tracker — service worker
   Caches the app shell so it opens offline. Network-first when online so you
   always get the latest version after you update index.html. The backend API
   (a different domain) is never cached, so cloud sync always hits the network. */

const CACHE = 'portfolio-shell-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Only same-origin GETs. The backend API is cross-origin, so it passes straight
  // through to the network untouched (sync is never served from cache).
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
  );
});
