// Développement Personnel — Service Worker v13
// NETWORK-FIRST pour le HTML : on prend TOUJOURS la version fraîche quand il y a du réseau.
// Le cache ne sert que hors-ligne. Fini les versions bloquées.
const CACHE = 'devperso-v13';
const CORE = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(CORE.map(url => c.add(url)))
    )
  );
  self.skipWaiting(); // le nouveau SW prend la main sans attendre
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('devperso-') && k !== CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isLocal = url.origin === location.origin;
  const isHtml = e.request.mode === 'navigate'
    || e.request.destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname === '/'
    || url.pathname.endsWith('/');

  // On ne gère que le local + les polices Google
  if (!isLocal && !url.hostname.includes('fonts.g')) return;

  if (isHtml) {
    // HTML + JS applicatif : NETWORK FIRST
    // → toujours la dernière version quand il y a du réseau, cache en secours hors-ligne.
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Assets (icônes, polices) : cache first (ils ne changent quasi jamais)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200)
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
