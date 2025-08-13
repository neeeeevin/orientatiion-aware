/**
 * @file pwa/sw.js
 * Service Worker for caching and offline functionality.
 */

const CACHE_VERSION = 'v1.1.0';
const STATIC_CACHE_NAME = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-cache-${CACHE_VERSION}`;

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/styles/base.css',
  '/styles/components.css',
  '/js/app.js',
  '/js/core/orientation.js',
  '/js/core/storage.js',
  // Note: Dynamically imported modules are not in the initial shell
  '/assets/sounds/alarm.mp3',
  '/pwa/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('[SW] Caching App Shell...');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  return cachedResponse || fetchPromise;
};

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.hostname === 'api.weatherapi.com') {
    event.respondWith(staleWhileRevalidate(request));
  } else if (APP_SHELL_URLS.includes(url.pathname) || url.origin === self.origin) {
    event.respondWith(caches.match(request).then(response => {
        return response || fetch(request).then(fetchRes => {
            return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                cache.put(request.url, fetchRes.clone());
                return fetchRes;
            })
        });
    }));
  }
});