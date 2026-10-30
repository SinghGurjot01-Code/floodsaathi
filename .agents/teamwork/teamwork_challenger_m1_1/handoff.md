# Milestone 1 Challenger Report: Downloads UI, Map Pack Calculator, and Caching

**Agent Archetype**: `teamwork_challenger` (Challenger 1, Milestone 1)  
**Roles**: critic, specialist  
**Date**: 2026-10-30  
**Target Milestone**: M1 (Downloads & Plugins Interface, Map Pack Calculator & Caching)  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Observation

### Observation 1: Service Worker Cache Deletion on Activation (`app/sw.js:52-62`)
In `app/sw.js`:
```javascript
50: self.addEventListener("activate", (event) => {
51:   event.waitUntil(
52:     caches.keys().then((keys) => {
53:       return Promise.all(
54:         keys.map((key) => {
55:           if (key !== CACHE_NAME) {
56:             return caches.delete(key);
57:           }
58:         })
59:       );
60:     }).then(() => self.clients.claim())
61:   );
62: });
```
Where `CACHE_NAME = "floodsaathi-v1.6.0"`.  
Meanwhile, M1 code writes offline map packs to `floodsaathi-offline-maps-v1` (`app/js/map_downloader.js:6`), regional language packs to `floodsaathi-lang-packs-v1` (`app/js/main.js:1171`), and AI models to `floodsaathi-ai-models-v1` (`app/js/main.js:1075`).  
When the Service Worker activates, `key !== CACHE_NAME` evaluates to `true` for all three caches. The Service Worker systematically deletes `floodsaathi-offline-maps-v1`, `floodsaathi-lang-packs-v1`, and `floodsaathi-ai-models-v1`.  
Empirical test output from `tests/adversarial/m1_stress_challenge.mjs` (STRESS 5.1):
```
SW Activate handler snippet:
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
Unsafe SW cache wipe detected: true
✖ STRESS 5.1: Service Worker activate event must not delete offline map packs or language packs
  AssertionError [ERR_ASSERTION]: CRITICAL VULNERABILITY: Service Worker activate handler deletes all offline map, language pack, and model caches!
```

---

### Observation 2: Severe Non-Monotonic Discontinuities in `estimateDownloadSize` (`app/js/map_downloader.js:80-88`)
In `app/js/map_downloader.js`:
```javascript
80: export function estimateDownloadSize(radiusKm) {
81:   if (MAP_RADIUS_SIZES[radiusKm]) {
82:     return MAP_RADIUS_SIZES[radiusKm].mb;
83:   }
84:   // Area-proportional calculation for non-standard radii
85:   const baseArea = Math.PI * radiusKm * radiusKm;
86:   const mbPerKm2 = 0.0044;
87:   return Math.max(4.0, Math.round((baseArea * mbPerKm2 + 8.0) * 10) / 10);
88: }
```
When evaluating increasing radii, the size estimates drop abruptly when crossing preset boundaries:
- At 10 km: `MAP_RADIUS_SIZES[10]` returns **12.0 MB**. At 11 km: fallback formula returns **9.7 MB** (drops by 2.3 MB for a larger radius).
- At 25 km: `MAP_RADIUS_SIZES[25]` returns **28.0 MB**. At 26 km: fallback formula returns **17.3 MB** (drops by 10.7 MB for a larger radius).
- At 50 km: `MAP_RADIUS_SIZES[50]` returns **65.0 MB**. At 51 km: fallback formula returns **44.0 MB** (drops by 21.0 MB for a larger radius).
- At 99 km: fallback formula returns **143.5 MB**. At 100 km: `MAP_RADIUS_SIZES[100]` returns **140.0 MB** (drops by 3.5 MB for a larger radius).

Empirical test output from `tests/adversarial/m1_stress_challenge.mjs` (STRESS 1.1):
```
Calculated inversions: [
  { radiusBefore: 10, sizeBefore: 12, radiusCurrent: 11, sizeCurrent: 9.7, dropMB: 2.3 },
  { radiusBefore: 25, sizeBefore: 28, radiusCurrent: 26, sizeCurrent: 17.3, dropMB: 10.7 },
  { radiusBefore: 50, sizeBefore: 65, radiusCurrent: 51, sizeCurrent: 44, dropMB: 21 },
  { radiusBefore: 99, sizeBefore: 143.5, radiusCurrent: 100, sizeCurrent: 140, dropMB: 3.5 }
]
WARNING: Detected 4 monotonicity inversions in estimateDownloadSize!
✖ STRESS 1.1: Size calculator monotonicity check across radius spectrum
  AssertionError [ERR_ASSERTION]: Monotonicity violation: radius 11 km (9.7 MB) is smaller than radius 10 km (12 MB)!
```

---

### Observation 3: Boundary Value Handling in `estimateDownloadSize` (`app/js/map_downloader.js:85-87`)
- `estimateDownloadSize(NaN)`: `Math.PI * NaN * NaN * 0.0044 + 8.0` produces `NaN`. When an unselected or invalid radius is evaluated, the UI renders `"NaN MB"`, and in `downloadMapPack`, `totalBytes = Math.round(NaN)` produces `NaN`, causing progress reporting to output `"NaN% (NaN / NaN MB)"`.
- `estimateDownloadSize(-25)` returns `16.6 MB` because $(-25)^2 = 625$, silently computing positive sizes for negative radii.
- `estimateDownloadSize(0)` returns `8.0 MB` instead of 0 or a handled boundary.

Empirical test output from `tests/adversarial/m1_stress_challenge.mjs` (STRESS 2.1):
```
estimateDownloadSize(0): 8
estimateDownloadSize(-25): 16.6
estimateDownloadSize(NaN): NaN
✖ STRESS 2.1: Boundary values for estimateDownloadSize (0, negative, NaN, null, string, Infinity)
  AssertionError [ERR_ASSERTION]: estimateDownloadSize(NaN) produced NaN: UI will display 'NaN MB'
```

---

### Observation 4: Non-Array JSON in LocalStorage Crashes UI (`app/js/map_downloader.js:153-162`)
In `app/js/map_downloader.js`:
```javascript
153: export function getDownloadedMapPacks() {
154:   try {
155:     if (typeof localStorage !== "undefined") {
156:       return JSON.parse(localStorage.getItem("floodsaathi_offline_map_packs") || "[]");
157:     }
158:     return [];
159:   } catch (e) {
160:     return [];
161:   }
162: }
```
If `localStorage` contains a valid JSON non-array (e.g. `{"error": "corrupt"}` or `"123"`):
`JSON.parse` does not throw an error and returns the object or number.  
Then in `checkMapPackStatus` line 92 (`packs.find(...)`) and `renderDownloadsView` line 897 (`packs.reduce(...)`), an unhandled exception occurs:
`TypeError: packs.find is not a function` or `TypeError: packs.reduce is not a function`, crashing the downloads view render cycle.

Empirical test output from `tests/adversarial/m1_stress_challenge.mjs` (STRESS 4.1):
```
getDownloadedMapPacks() with object in storage: { error: 'not an array' }
✖ STRESS 4.1: Corrupted or non-array localStorage in map pack queries
  AssertionError [ERR_ASSERTION]: getDownloadedMapPacks must return an Array, but returned object
```

---

### Observation 5: Zero Vector Tiles Downloaded (`app/js/map_downloader.js:99-151`)
In `downloadMapPack`:
```javascript
102:   const totalSteps = 20;
103:   let downloadedBytes = 0;
...
117:   for (let i = 1; i <= totalSteps; i++) {
118:     // Staged progress updates for tile caching
119:     await new Promise((resolve) => setTimeout(resolve, 30));
...
135:   // Persist pack record into Cache API
136:   if (cache) {
137:     const metaResponse = new Response(JSON.stringify(packMeta), {
138:       headers: { "Content-Type": "application/json" }
139:     });
140:     await cache.put(`/offline-maps/meta-${packMeta.id}.json`, metaResponse);
141:   }
```
No `fetch()` is performed for PMTiles or vector map tiles.  
Empirical measurement from `tests/adversarial/m1_stress_challenge.mjs` (STRESS 6.1):
- Claimed download size: 28.0 MB (~29,360,128 bytes).
- Actual bytes stored in Cache API: 159 bytes (`/offline-maps/meta-pack-*.json`).
- Stored ratio: 0.0005% of claimed payload; 0 vector map tiles cached. When the application runs offline, MapLibre GL has no tiles to render.

---

### Observation 6: Antimeridian & Polar Inaccuracies in `isCoordinatesCached` (`app/js/map_downloader.js:177-188`)
In `isCoordinatesCached`:
```javascript
180:     const dLat = (pack.lat - lat) * 111.32;
181:     const dLon = (pack.lon - lon) * 111.32 * Math.cos((lat * Math.PI) / 180);
182:     const dist = Math.sqrt(dLat * dLat + dLon * dLon);
```
- Across the antimeridian ($179.9^\circ$ to $-179.9^\circ$), $dLon$ calculates to $359.8^\circ$ ($\approx 39,800\text{ km}$), returning `cached: false` for coordinates separated by only 22 km.
- Near polar regions ($\pm 90^\circ$), $\cos(\pm 90^\circ) = 0$, causing longitude distance to collapse to 0.

---

### Observation 7: `checkMapPackStatus` Disregards Geographic Location (`app/js/map_downloader.js:90-97`)
In `checkMapPackStatus`:
```javascript
90: export function checkMapPackStatus(radiusKm) {
91:   const packs = getDownloadedMapPacks();
92:   const found = packs.find((p) => p.radiusKm === radiusKm || p.radiusKm >= radiusKm);
93:   return {
94:     downloaded: Boolean(found),
95:     sizeMb: estimateDownloadSize(radiusKm)
96:   };
97: }
```
The status query checks only if any cached pack has `pack.radiusKm >= radiusKm`. If a user downloads a 50 km pack for Amritsar and moves to Patiala (150 km away), `checkMapPackStatus(50)` falsely returns `downloaded: true` ("Ready Offline") despite Patiala having no cached map data.

---

## 2. Logic Chain

1. **Safety and Offline Resilience Invariant**:
   - As established in `PROJECT.md` and `AGENTS.md`, FloodSaathi's defining mission is offline-first early warning.
   - Observation 1 shows that whenever `app/sw.js` activates (on app updates, browser reload, or service worker lifecycle), it deletes all caches where `key !== CACHE_NAME`.
   - Because `floodsaathi-offline-maps-v1`, `floodsaathi-lang-packs-v1`, and `floodsaathi-ai-models-v1` are different cache names, the Service Worker deletes all downloaded map packs, language packs, and AI models from the device.
   - Therefore, offline caching fails completely across service worker lifecycles.

2. **Calculator Soundness**:
   - Observation 2 demonstrates that the download size calculator is non-monotonic: increasing the radius from 10 km to 11 km drops the estimated download from 12 MB to 9.7 MB; increasing from 50 km to 51 km drops the estimate by 21 MB (from 65 MB to 44 MB).
   - This occurs because the presets hardcode arbitrary MB numbers that conflict with the mathematical formula `Math.PI * r^2 * 0.0044 + 8.0`.
   - Observation 3 shows that passing non-numeric or edge inputs (such as `NaN`) propagates `NaN MB` directly to the user interface.

3. **Runtime Stability and Data Integrity**:
   - Observation 4 demonstrates that `getDownloadedMapPacks` does not enforce `Array.isArray(packs)`. If storage contains valid JSON representing an object or number, `packs.find` or `packs.reduce` throws an uncaught `TypeError`, crashing the Downloads view.
   - Observation 5 establishes that `downloadMapPack` only caches a 159-byte JSON metadata object and never caches any map tile data, leaving MapLibre GL without offline tiles.
   - Observations 6 and 7 show that coordinate caching ignores antimeridian wrap-around and that `checkMapPackStatus` ignores geographic coordinates entirely.

---

## 3. Caveats

- **WebGPU Execution**: Headless test runners (Node.js) lack native WebGPU GPU adapters; the fallback to CPU deterministic M5 mode in tests was verified as expected behavior.
- **Local Python Daemon**: The probe to `http://127.0.0.1:8000/health` gracefully timed out after 1.8 seconds and fell back to browser native mode without unhandled exceptions.
- **UI Presentation**: The HTML structure, tab buttons (desktop `.desktop-nav` and mobile `.nav-tab-bar`), and card badges conform visually to the layout requirements. The defects identified are algorithmic, storage-level, and architectural.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone 1 cannot be approved in its current state due to critical flaws:
1. **Cache Annihilation Vulnerability**: `app/sw.js` activation unconditionally destroys `floodsaathi-offline-maps-v1`, `floodsaathi-lang-packs-v1`, and `floodsaathi-ai-models-v1`.
2. **Missing Vector Tile Caching**: `downloadMapPack` stores only a 159-byte metadata JSON file (0.0005% of claimed payload) and no map tiles.
3. **Severe Non-Monotonic Discontinuities**: `estimateDownloadSize` estimates drop abruptly by up to 21 MB upon radius expansion (e.g. 50 km $\rightarrow$ 65 MB, 51 km $\rightarrow$ 44 MB).
4. **Boundary Input Crashes**: `estimateDownloadSize(NaN)` outputs `NaN MB`; non-array JSON in `localStorage` crashes `renderDownloadsView()` via uncaught `TypeError`.
5. **Geographic Coordinate Blindness**: `checkMapPackStatus` ignores coordinates, falsely reporting distant locations as cached.

### Required Changes for Worker M1:
1. Update `app/sw.js` activate handler to preserve milestone caches by whitelisting or using a prefix check:
   ```javascript
   const PRESERVED_PREFIXES = ["floodsaathi-offline-maps", "floodsaathi-lang-packs", "floodsaathi-ai-models"];
   if (key !== CACHE_NAME && !PRESERVED_PREFIXES.some(p => key.startsWith(p))) {
     return caches.delete(key);
   }
   ```
2. Harmonize `estimateDownloadSize` so the calculation is strictly monotonic with $r$: calibrate `mbPerKm2` or use piecewise continuous interpolation so that $r_1 < r_2 \implies \text{size}(r_1) \le \text{size}(r_2)$. Ensure `NaN`, non-numbers, zero, and negative values return safe fallback defaults (e.g. clamp $r \ge 1$, default to 12 MB if invalid).
3. In `getDownloadedMapPacks()`, check `Array.isArray(parsed)` and return `[]` if `parsed` is not an array.
4. Update `checkMapPackStatus` to support optional coordinates or clarify that status is global/local, and fix antimeridian wrapping in `isCoordinatesCached`:
   `let dLonDeg = Math.abs(pack.lon - lon) % 360; if (dLonDeg > 180) dLonDeg = 360 - dLonDeg;`
5. Connect `downloadMapPack` to actual map tile / PMTiles caching (e.g. precaching `./vendor/pmtiles/pmtiles.js`, map styles, and regional vector tile manifests) rather than a pure timer simulation.

---

## 5. Verification Method

To independently reproduce all findings and failure modes:

1. **Run the Adversarial Stress Challenge Suite**:
   ```powershell
   node --test tests/adversarial/m1_stress_challenge.mjs
   ```
   *Verified Output*: 4 failing tests reproducing the monotonicity inversion, boundary value NaN, non-array localStorage crash, and SW cache deletion vulnerability.

2. **Verify E2E Boundary Tests**:
   ```powershell
   node tests/e2e/tier2_boundary_tests.mjs
   ```
   *Verified Output*: 5 failing tests (`B1.3`, `B2.1`, `B4.2`, `B10.1`, `B10.2`).

3. **Verify Service Worker Activate Logic**:
   Inspect `app/sw.js` lines 50–62:
   Observe that `key !== CACHE_NAME` deletes `floodsaathi-offline-maps-v1` and `floodsaathi-lang-packs-v1`.

4. **Invalidation Conditions**:
   The verdict changes to **APPROVE** only after:
   - `node --test tests/adversarial/m1_stress_challenge.mjs` exits with code 0 (all 6 tests passing).
   - `app/sw.js` explicitly preserves `floodsaathi-offline-maps-v1` and related caches.
   - `estimateDownloadSize` is strictly monotonic and safely handles `NaN`/negative inputs.
   - `getDownloadedMapPacks` enforces `Array.isArray`.
