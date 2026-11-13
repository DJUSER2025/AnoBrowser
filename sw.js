const CACHE_NAME = 'anobrowser-v1.3.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Только GET
  if (req.method !== 'GET') return;

  // 2) Только свой origin (не трогаем Google, wttr.in, corsproxy, iframe-сайты)
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 3) Не трогаем навигацию (HTML-страницы) — иначе iframe и сам AnoBrowser ломаются
  if (req.mode === 'navigate') return;

  // 4) Cache-first для статики
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
      // Кэшируем только успешные ответы
      if (resp && resp.status === 200) {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
      }
      return resp;
    }))
  );
});