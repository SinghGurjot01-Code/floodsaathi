// Service Worker for FloodSaathi
// Provides offline capability for PWA shell and cached data snapshots.

const CACHE_NAME = "floodsaathi-v2.2.0";

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
  "./js/ai_assistant.js",
  "./js/shelters.js",
  "./js/map_downloader.js",
  "./js/map.js",
  "./js/mobile_storage.js",
  "./models/FloodSaathi/flood_safety_dataset.jsonl",
  "./models/FloodSaathi/training_meta.json",
  "./models/FloodSaathi/adapter_config.json",
  "./models/FloodSaathi/tokenizer_config.json",
  "./models/FloodSaathi/manifest.json",
  "./data/punjab.pmtiles",
  "./corpus/cards/cards.json",
  "./corpus/helplines.json",
  "./corpus/shelters_punjab.json",
  "./packs/region-amritsar/manifest.json",
  "./packs/region-amritsar/villages.json",
  "./packs/region-amritsar/helplines.json",
  "./packs/region-amritsar/routes.json",
  "./vendor/maplibre-gl/maplibre-gl.js",
  "./vendor/maplibre-gl/maplibre-gl.css",
  "./vendor/pmtiles/pmtiles.js",
  "./vendor/tweetnacl/nacl.min.js",
  "./vendor/minisearch/minisearch.min.js",
  "./assets/ui/home-hills.jpg",
  "./assets/ui/onboarding-bg.jpg",
  "./assets/ui/saathi-logo.png",
  "./assets/ui/risk-map-bg.jpg",
  "./assets/ui/map-screen-bg.jpg",
  "./assets/ui/shelter-map-bg.jpg",
  "./assets/ui/shelter-thumb.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

const PROTECTED_CACHES = new Set([
  CACHE_NAME,
  "floodsaathi-offline-maps-v1",
  "floodsaathi-lang-packs-v1",
  "floodsaathi-ai-models-v1"
]);

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!PROTECTED_CACHES.has(key) && key.startsWith("floodsaathi-v")) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});


self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) {
    return;
  }
  const url = new URL(event.request.url);

  // Cache-first for OpenStreetMap slippy map tiles (stored in floodsaathi-offline-maps-v1)
  if (url.hostname.includes("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open("floodsaathi-offline-maps-v1").then((cache) => {
        return cache.match(event.request.url).then((cachedTile) => {
          if (cachedTile) return cachedTile;
          return fetch(event.request).then((netRes) => {
            if (netRes && (netRes.status === 200 || netRes.type === "opaque")) {
              cache.put(event.request.url, netRes.clone()).catch(() => {});
            }
            return netRes;
          }).catch(() => cachedTile);
        });
      })
    );
    return;
  }

  // Network-first for dynamic live relay data (punjab.json)
  if (url.pathname.includes("/latest/") || (url.pathname.endsWith(".json") && url.pathname.includes("/data/"))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  // Network-first for application scripts, documents, styles, and i18n configs (so updates apply immediately when online, while remaining fully offline-first)
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".html") || url.pathname.endsWith(".json") || url.pathname.endsWith(".css") || url.pathname.endsWith("/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  // Cache-first for static shell assets, fonts, icons, vendor files
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return networkResponse;
      });
    })
  );
});
