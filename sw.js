/* Service Worker - Stock Don Picconi */
const CACHE_NAME = 'stock-dp-v16';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: precachea el cascarón de la app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpia versiones viejas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: nunca cachear el login de Google ni los datos en vivo de Apps Script
// (siempre tienen que pedirse a la red). El resto del cascarón usa
// "cache primero, red de respaldo" para que la app abra rápido y offline,
// y "red primero, caché de respaldo" para mantenerlo actualizado cuando hay conexión.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  const esDinamico =
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('gstatic.com');

  if (esDinamico || event.request.method !== 'GET') {
    // Dejar pasar directo a la red, sin intervenir
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
