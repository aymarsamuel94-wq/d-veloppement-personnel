// Développement Personnel — Service Worker v10
// Cache-first pour le HTML : démarrage instantané, pas de rechargement en arrière-plan.
// Mise à jour récupérée en silence pour la PROCHAINE ouverture.
const CACHE = 'devperso-v10';
const CORE = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(CORE.map(url => c.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('devperso-') && k !== CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isLocal = url.origin === location.origin;
  const isHtml = e.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');

  if (!isLocal && !url.hostname.includes('fonts.g')) return;

  if (isHtml) {
    // HTML: CACHE FIRST — l'app se lance immédiatement depuis le cache.
    // On rafraîchit le cache en arrière-plan (stale-while-revalidate),
    // donc la nouvelle version sera là à la prochaine ouverture — sans recharger l'écran courant.
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
    return;
  }

  // Assets: cache first
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
