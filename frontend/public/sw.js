// Service Worker para PWA (producción)
const CACHE_NAME = 'sj-empleados-v4';
// Sólo precachea recursos estables sin hash; los assets con hash se cachean runtime
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/brand-logo.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  // Activar inmediatamente el SW nuevo
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar control de las páginas abiertas
  self.clients.claim();
});

// Intercepción de requests
// Estrategia network-first con fallback a cache para HTML/API; cache-first para estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Evitar manejar solicitudes de otros orígenes
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.destination === 'document') {
    // HTML: intenta red desde red, fallback a cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    // Estáticos: network-first con fallback a cache y revalidación
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Por defecto: network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});