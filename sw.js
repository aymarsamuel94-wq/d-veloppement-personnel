// Développement Personnel — Service Worker v2
const CACHE = 'devperso-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:wght@300;400&display=swap'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache local files reliably, fonts optionally
      return c.addAll(['./index.html', './manifest.json', './icon.svg'])
        .then(() => c.addAll(['./icon-192.png', './icon-512.png']).catch(() => {}))
        .then(() => c.add('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:wght@300;400&display=swap').catch(() => {}));
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache first for local, network first for external
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isLocal = url.origin === location.origin;

  e.respondWith(
    isLocal
      ? caches.match(e.request).then(r => r || fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => caches.match('./index.html')))
      : fetch(e.request).catch(() => caches.match(e.request))
  );
});
