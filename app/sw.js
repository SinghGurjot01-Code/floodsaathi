// Service Worker for FloodSaathi
// Provides offline capability for PWA shell and cached data snapshots.

const CACHE_NAME = "floodsaathi-v1.1.0";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./config.js",
  "./css/main.css",
  "./css/status.css",
  "./css/fonts.css",
  "./icons/icon.svg",
  "./i18n/en.json",
  "./i18n/hi.json",
  "./i18n/pa.json",
  "./js/main.js",
  "./js/i18n.js",
  "./js/store.js",
  "./js/snapshot.js",
  "./js/estimator.js",
  "./js/status.js",
  "./js/ask.js",
  "./corpus/cards/cards.json",
  "./corpus/helplines.json",
  "./packs/region-amritsar/manifest.json",
  "./packs/region-amritsar/villages.json",
  "./packs/region-amritsar/helplines.json",
  "./packs/region-amritsar/routes.json",
  "./vendor/maplibre-gl/maplibre-gl.js",
  "./vendor/maplibre-gl/maplibre-gl.css",
  "./vendor/pmtiles/pmtiles.js",
  "./vendor/tweetnacl/nacl.min.js",
  "./vendor/minisearch/minisearch.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for dynamic live relay data (punjab.json)
  if (url.pathname.includes("/latest/") || url.pathname.endsWith(".json") && url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static shell assets, fonts, icons, vendor files
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});
