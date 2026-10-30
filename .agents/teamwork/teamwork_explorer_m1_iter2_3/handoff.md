# Handoff Report: Milestone 1 Remediation Investigation (Explorer 3)

**Agent**: `teamwork_explorer_m1_iter2_3`  
**Parent Agent**: `9cc25926-f064-4a11-b0f8-934dad82bf28`  
**Milestone**: Milestone 1 Remediation (Downloads & Plugins UI)  
**Date**: 2026-10-30  
**Status**: COMPLETE (Read-Only Investigation & Remediation Design)  

---

## 1. Observation

### 1.1 Observation 1: Monotonicity Inversions and Boundary Vulnerabilities in `estimateDownloadSize` (`app/js/map_downloader.js:80–88`)
In `app/js/map_downloader.js:80–88`:
```javascript
export function estimateDownloadSize(radiusKm) {
  if (MAP_RADIUS_SIZES[radiusKm]) {
    return MAP_RADIUS_SIZES[radiusKm].mb;
  }
  // Area-proportional calculation for non-standard radii
  const baseArea = Math.PI * radiusKm * radiusKm;
  const mbPerKm2 = 0.0044;
  return Math.max(4.0, Math.round((baseArea * mbPerKm2 + 8.0) * 10) / 10);
}
```
Command execution: `node --test tests/adversarial/m1_stress_challenge.mjs`
Output:
```
Calculated inversions: [
  { radiusBefore: 10, sizeBefore: 12, radiusCurrent: 11, sizeCurrent: 9.7, dropMB: 2.3 },
  { radiusBefore: 25, sizeBefore: 28, radiusCurrent: 26, sizeCurrent: 17.3, dropMB: 10.7 },
  { radiusBefore: 50, sizeBefore: 65, radiusCurrent: 51, sizeCurrent: 44, dropMB: 21 },
  { radiusBefore: 99, sizeBefore: 143.5, radiusCurrent: 100, sizeCurrent: 140, dropMB: 3.5 }
]
WARNING: Detected 4 monotonicity inversions in estimateDownloadSize!
Radius 10 km = 12 MB, Radius 11 km = 9.7 MB
estimateDownloadSize(0): 8
estimateDownloadSize(-25): 16.6
estimateDownloadSize(NaN): NaN
✖ STRESS 1.1: Size calculator monotonicity check across radius spectrum (4.2572ms)
  AssertionError [ERR_ASSERTION]: Monotonicity violation: radius 11 km (9.7 MB) is smaller than radius 10 km (12 MB)!
✖ STRESS 2.1: Boundary values for estimateDownloadSize (0, negative, NaN, null, string, Infinity) (1.1109ms)
  AssertionError [ERR_ASSERTION]: estimateDownloadSize(NaN) produced NaN: UI will display 'NaN MB'
```

### 1.2 Observation 2: Error Swallowing and Fabricated Verification in Language Pack Caching (`app/js/main.js:1165–1201`)
In `app/js/main.js:1177–1194`:
```javascript
for (let i = 0; i < assets.length; i++) {
  try {
    const res = await fetch(assets[i]);
    if (res.ok) {
      await cache.put(assets[i], res.clone());
    }
  } catch (fetchErr) {
    console.warn("Asset cache fetch notice:", assets[i], fetchErr);
  }
  const pct = Math.round(((i + 1) / assets.length) * 100);
  if (langProgressFill) langProgressFill.style.width = `${pct}%`;
  if (langProgressPct) langProgressPct.textContent = `${pct}%`;
}
await setSetting(`lang_pack_${langCode}_downloaded`, true);
renderDownloadsView();
```
When offline or if network fetches fail:
- The catch block swallows network exceptions and skips `cache.put`.
- The progress bar still advances to 100%.
- `setSetting('lang_pack_${langCode}_downloaded', true)` commits `true` unconditionally.
- `renderDownloadsView()` displays `"Downloaded"` and `"Active"` when 0 assets exist in `floodsaathi-lang-packs-v1`.

### 1.3 Observation 3: Mobile Touch Target Violations and DOM Class Collisions (`app/css/main.css` & `app/index.html`)
Inspection of `app/css/main.css:1615–1630`:
```css
.btn-plugin-download {
  width: 100%;
  height: 44px; /* < 48px invariant */
```
Execution log from `app/test/challenger_m1_2_deep_stress.test.mjs:382–399`:
```
Plugin download action button height: 44px
[CHALLENGER FINDING] .btn-plugin-download has height: 44px (< 48px touch target invariant).
[CHALLENGER FINDING] Language download buttons (#btn-download-lang-pa) use compact inline styling padding:3px 8px (< 48px touch target).
```
In `app/index.html:813, 826`:
```html
<button class="radius-pill" id="btn-download-lang-pa" style="padding:3px 8px; font-size:11.5px;">Download (4.2 MB)</button>
<button class="radius-pill" id="btn-download-lang-hi" style="padding:3px 8px; font-size:11.5px;">Download (3.9 MB)</button>
```
- Physical button height is $\sim 22\text{px}$ ($< 48\text{px}$).
- Class collision: re-using `.radius-pill` causes `document.querySelectorAll("#view-downloads .radius-pill")` in `main.js:996` to bind map radius click handlers to the language download buttons, causing unexpected resets.
- In `app/index.html:633`: `#btn-back-from-downloads` uses `.lang-btn` with `height: 30px` ($< 48\text{px}$).
- In `app/css/main.css:1581`: `.radius-pill` has vertical padding 6px + font 12px ($\sim 28\text{px} < 48\text{px}$).

### 1.4 Observation 4: Destructive Service Worker Cache Wipe (`app/sw.js:50–68`)
In `app/sw.js`:
```javascript
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
```
`STRESS 5.1` in `tests/adversarial/m1_stress_challenge.mjs` fails: all offline maps, language packs, and AI models in Cache API are deleted whenever the service worker activates or updates.

### 1.5 Observation 5: Non-Array LocalStorage Crash in `getDownloadedMapPacks` (`app/js/map_downloader.js:153–162`)
In `app/js/map_downloader.js:156`:
```javascript
return JSON.parse(localStorage.getItem("floodsaathi_offline_map_packs") || "[]");
```
When localStorage contains a non-array JSON value (e.g. `{"error": "not an array"}`), `getDownloadedMapPacks()` returns an object. `STRESS 4.1` in `tests/adversarial/m1_stress_challenge.mjs` fails because `Array.isArray(packs)` is false.

---

## 2. Logic Chain

1. **Monotonic Sizing Derivation**:
   - From Observation 1.1, the discrete dictionary lookup masks an incompatible area formula ($\text{baseArea} \times 0.0044 + 8.0$), resulting in drops at 11 km, 26 km, 51 km, and 100 km.
   - A larger geographic radius strictly encloses a larger physical area; therefore, estimated download size must be monotonically non-decreasing ($\forall r_1 < r_2 \implies M(r_1) \le M(r_2)$).
   - Calibrated knots $P = \{(0, 4.0), (10, 12.0), (25, 28.0), (50, 65.0), (100, 140.0)\}$ linked by piecewise linear interpolation yield positive segment slopes ($0.80, 1.067, 1.48, 1.50\text{ MB/km}$).
   - Because all slopes are strictly positive and knot endpoints coincide, the function is $C^0$-continuous and strictly monotonic.
   - Parsing via `Number(radiusKm)` and clamping non-finite/negative inputs to $4.0\text{ MB}$ eliminates `NaN`, `undefined`, and negative value failures.

2. **Atomic Verification Derivation**:
   - From Observation 1.2, ignoring fetch errors and committing `downloaded: true` misleads flood victims about offline safety readiness, violating safety invariants.
   - An atomic transaction must guarantee that `setSetting('lang_pack_${langCode}_downloaded', true)` is called *only* if:
     1. 100% of asset network fetches succeed (`res.ok === true` and non-empty payload).
     2. 100% of assets are written to Cache API.
     3. 100% of assets are verified via `cache.match(url)`.
   - If any step fails, the system must trigger rollback: delete any partial assets from Cache API, retain `downloaded: false`, show user-facing error styling, and keep the `"Not Downloaded"` badge.

3. **Touch Target Accessibility Derivation**:
   - From Observation 1.3, AGENTS.md mandates touch targets $\ge 48\text{px}$ on 360px viewports.
   - Updating `.btn-plugin-download` from `height: 44px` to `min-height: var(--touch-target, 48px); height: 48px;` satisfies the requirement for all 4 plugin cards.
   - Replacing inline `padding:3px 8px` on `#btn-download-lang-pa` and `#btn-download-lang-hi` with a dedicated `.btn-lang-action` class ($48\text{px}$ min-height/min-width) satisfies touch requirements AND decouples them from `document.querySelectorAll("#view-downloads .radius-pill")`, preventing click handler interference.
   - Updating `.radius-pill`, `#btn-back-from-downloads`, `.btn-refresh`, `.btn-download-map`, `.btn-resync-gps`, and `.composer-mic` / `.composer-send` to `min-height: var(--touch-target, 48px); min-width: 48px;` provides uniform mobile compliance across the application.

4. **Storage & Cache Protection Derivation**:
   - From Observation 1.4, adding an allowlist (`PROTECTED_CACHES`) to `app/sw.js` prevents the service worker from purging offline user maps and language packs.
   - From Observation 1.5, guarding `getDownloadedMapPacks()` with `Array.isArray(parsed) ? parsed : []` protects against corrupted localStorage data.

---

## 3. Caveats

- **Read-Only Investigation**: As a teamwork explorer, no production source files were directly modified in this task. All code implementations are provided as concrete drop-in proposals in `report.md` and this handoff.
- **Physical Map Tile Fetching**: Full offline vector tile download (`downloadMapPack`) currently creates a manifest in `floodsaathi-offline-maps-v1`. Real PMTiles streaming ingestion is scheduled for the full tile relay pipeline in subsequent tasks.
- **Node Test Environment**: Browser Cache API and `localStorage` are tested headlessly in Node.js unit tests via standard mock shims (`TestResponse`, `memStore`, `cacheStore`).

---

## 4. Conclusion

The forensic integrity violations and stress test failures are fully diagnosed, reproducible, and remediable:
1. **`estimateDownloadSize`**: Replace discrete table and discontinuous formula with the continuous monotonic piecewise linear model anchored at $\{(0, 4), (10, 12), (25, 28), (50, 65), (100, 140)\}$. Handles all edge cases (0, negative, NaN, strings) with 0 monotonicity inversions.
2. **Atomic Language Pack Verification**: Implement 5-phase transactional lifecycle with strict fetch verification, post-commit Cache API audit, rollback on error, and honest `"Not Downloaded"` badge retention on failure.
3. **CSS Touch Targets ($\ge 48\text{px}$)**: Standardize all buttons and selectors (`.btn-plugin-download`, `.radius-pill`, `.btn-lang-action`, `.btn-back-nav`, `.btn-resync-gps`, `.btn-refresh`) to `min-height: var(--touch-target, 48px); min-width: 48px;`, and decouple language buttons from map radius pills.
4. **Resilience Hardening**: Allowlist protected caches in `app/sw.js` and validate array structure in `getDownloadedMapPacks`.

All detailed designs and drop-in code snippets are published in:
`c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m1_iter2_3\report.md`

---

## 5. Verification Method

To independently verify the investigation findings and test the proposed remediations:

1. **Verify Monotonic Piecewise Interpolation Model**:
   ```powershell
   node -e 'const pts = [{r:0,mb:4},{r:10,mb:12},{r:25,mb:28},{r:50,mb:65},{r:100,mb:140}]; function est(val){ const r = Number(val); if (!Number.isFinite(r) || r <= 0) return 4.0; if (r >= 100) return Math.round((140 + (r-100)*1.5)*10)/10; for (let i=0; i<pts.length-1; i++){ if (r >= pts[i].r && r <= pts[i+1].r){ const f = (r - pts[i].r)/(pts[i+1].r - pts[i].r); return Math.round((pts[i].mb + f*(pts[i+1].mb - pts[i].mb))*10)/10; } } return 140; } let p = est(1), inv = 0; for (let r = 2; r <= 150; r++) { const c = est(r); if (c < p) inv++; p = c; } console.log("Monotonicity inversions across r=1..150:", inv);'
   ```
   *Expected Result*: `Monotonicity inversions across r=1..150: 0`.

2. **Verify Adversarial Stress Suite Failures (Baseline)**:
   ```powershell
   node --test tests/adversarial/m1_stress_challenge.mjs
   ```
   *Observed*: 4 tests fail (STRESS 1.1, STRESS 2.1, STRESS 4.1, STRESS 5.1).

3. **Verify Standard Unit Tests & Ergonomics**:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   *Observed*: 52 passed in 1.05s. Note challenger warnings logged for `.btn-plugin-download` (44px) and `#btn-download-lang-pa` (`padding:3px 8px`).

4. **Verify AST No-Mock Check**:
   ```powershell
   python scripts/check_no_mock.py
   ```
   *Expected Result*: Exits 0 (`check_no_mock: OK`).
