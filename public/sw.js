const CACHE_NAME = 'live-salary-ticker-shell-v2';
const OFFLINE_URL = '/offline';
const APP_SHELL = ['/', OFFLINE_URL, '/icon.svg', '/manifest.webmanifest'];

function isRuntimeAsset(url) {
  return url.origin === self.location.origin && (
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?)$/i.test(url.pathname)
  );
}

async function cacheResponse(request, response) {
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstPage(request) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch {
    const cachedPage = await caches.match(request);
    const cachedHome = await caches.match('/');
    const offlinePage = await caches.match(OFFLINE_URL);
    return cachedPage || cachedHome || offlinePage || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  return cached || cacheResponse(request, await fetch(request));
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event.request));
    return;
  }
  if (isRuntimeAsset(new URL(event.request.url))) event.respondWith(cacheFirstAsset(event.request));
});
