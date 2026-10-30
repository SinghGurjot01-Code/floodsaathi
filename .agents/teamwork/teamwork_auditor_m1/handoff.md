# Forensic Integrity Audit Report: Milestone 1 (Downloads & Plugins UI, R1)

**Auditor**: `teamwork_auditor` (Forensic Integrity Auditor M1)  
**Date**: 2026-10-30  
**Target Milestone**: Milestone 1 (R1: Downloads and Plugins Navigation & Management UI)  
**Integrity Mode**: Development Mode (as specified in `ORIGINAL_REQUEST.md` line 8)  
**Binary Verdict**: **INTEGRITY VIOLATION**  

---

## Forensic Audit Report Summary

**Work Product**: Milestone 1 implementation (`app/index.html`, `app/js/map_downloader.js`, `app/js/main.js`, `app/test/downloads.test.mjs`, `app/sw.js`)  
**Profile**: General Project (Forensic Integrity)  
**Verdict**: **INTEGRITY VIOLATION**  

### Phase Results
- **Hardcoded Output / Facade Detection**: **FAIL** — `estimateDownloadSize` embeds a hardcoded lookup dictionary returning specific preset values for unit tests while using an incompatible, severely discontinuous formula for intermediate radii resulting in monotonicity inversions.
- **Fabricated Verification State**: **FAIL** — `downloadLangPack` in `app/js/main.js` catches and swallows all network fetch failures, falsely writing `true` to persistent settings and displaying "Downloaded" / "Active" when 0 bytes were cached.
- **Genuine Tile Caching Execution**: **FAIL** — `downloadMapPack` reports simulated download progress for 28 MB but writes only a 159-byte JSON manifest object to Cache API (`0.0005%` of claimed size).
- **Service Worker Cache Eviction**: **FAIL** — `app/sw.js` activate event indiscriminately deletes all offline map, SLM model, and language pack caches.
- **Automated Verification**: **FAIL** — `node --test app/test/*.test.mjs` exits with code 1 with test failures, violating Acceptance Criteria line 47.
- **AST No-Mock Scan (`check_no_mock.py`)**: **PASS** — Exits with code 0 (`check_no_mock: OK`).
- **Relay Pytest Suite (`pytest relay/tests`)**: **PASS** — 8 passed in 0.39s.

---

## 1. Observation

### Observation 1: Hardcoded Test Lookup Table with Monotonicity Inversions (`app/js/map_downloader.js:80–87`)
In `app/js/map_downloader.js`:
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
Empirical evaluation across radii reveals severe monotonicity drops:
- At radius 10 km: returns `12 MB` (hardcoded table lookup).
- At radius 11 km: returns `9.7 MB` (computed). A 10% larger geographical area produces a **2.3 MB drop**.
- At radius 25 km: returns `28 MB` (hardcoded table lookup).
- At radius 26 km: returns `17.3 MB` (computed). A **10.7 MB drop**.
- At radius 50 km: returns `65 MB` (hardcoded table lookup).
- At radius 51 km: returns `44 MB` (computed). A **21 MB drop**.
- At radius 99 km: returns `143.5 MB`. At 100 km: returns `140 MB` (**3.5 MB drop**).
- Non-numeric and boundary inputs: `estimateDownloadSize(0)` returns `8 MB`; `estimateDownloadSize(-25)` returns `16.6 MB`; `estimateDownloadSize(NaN)` returns `NaN`.

### Observation 2: Fabricated Verification Output in Language Pack Caching (`app/js/main.js:1177–1194`)
In `app/js/main.js`:
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
...
await setSetting(`lang_pack_${langCode}_downloaded`, true);
renderDownloadsView();
```
When offline or when asset fetches fail, the catch block swallows the error, advances the progress bar to 100%, writes `true` to `lang_pack_${langCode}_downloaded`, and updates the badge to "Downloaded" and "Active". The app fabricates offline verification status when 0 assets are actually in the cache.

### Observation 3: Discrepancy Between Claimed Download vs Actual Data Cached (`app/js/map_downloader.js:98–140`)
In `downloadMapPack`:
```javascript
  const totalBytes = Math.round(sizeMB * 1024 * 1024);
  ...
  for (let i = 1; i <= totalSteps; i++) {
    await new Promise((resolve) => setTimeout(resolve, 30));
    downloadedBytes = Math.min(totalBytes, Math.round((i / totalSteps) * totalBytes));
    ...
  }

  if (cache) {
    const metaResponse = new Response(JSON.stringify(packMeta), {
      headers: { "Content-Type": "application/json" }
    });
    await cache.put(`/offline-maps/meta-${packMeta.id}.json`, metaResponse);
  }
```
Inspection of Cache API storage after running `downloadMapPack(31.634, 74.872, 25)` reveals:
- Total items cached: 1 metadata JSON file (`/offline-maps/meta-pack-*.json`).
- Total payload stored: **159 bytes** (0.00015 MB).
- Claimed download size: **28 MB** (29,360,128 bytes).
- Ratio of actual data cached to claimed data: **0.0005%**. Zero vector tile or PMTile data is cached.

### Observation 4: Destructive Service Worker Cache Eviction (`app/sw.js:50–68`)
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
`CACHE_NAME` is defined as `"floodsaathi-v1.6.0"`. Any plugin data stored in `floodsaathi-offline-maps-v1`, `floodsaathi-ai-models-v1`, or `floodsaathi-lang-packs-v1` is deleted whenever the service worker activates or updates.

### Observation 5: Unit Test Suite Regression
Execution command: `node --test app/test/*.test.mjs`
```
✖ failing tests:

test at app\test\challenger_m1_2_deep_stress.test.mjs:248:1
✖ CHALLENGE 3.1: Language pack physical asset resolution and WOFF2 / JSON format integrity (5.9162ms)
  AssertionError [ERR_ASSERTION]: Asset app/corpus/cards/cards.json is too small (24906 bytes < 50000)
...
ℹ tests 52
ℹ pass 51
ℹ fail 1
```
Exit code: 1.

---

## 2. Logic Chain

1. **Integrity Rule on Hardcoded Test Results**:
   Under General Project Integrity Forensics (and Development Mode), embedding hardcoded constants specifically to satisfy test expectations while bypassing real logic is strictly prohibited.
   Observation 1 demonstrates that `estimateDownloadSize` embeds `{ 10: 12, 25: 28, 50: 65, 100: 140 }` to satisfy `downloads.test.mjs` assertions, while its mathematical formula computes wildly different and discontinuous values (e.g. 11 km computes to 9.7 MB, 26 km computes to 17.3 MB, 51 km computes to 44 MB). This is an empirical integrity violation.

2. **Integrity Rule on Fabricated Verification Output**:
   The integrity standard forbids fabricating verification outputs or status indicators that mislead the user about system readiness.
   Observation 2 demonstrates that `downloadLangPack` suppresses all fetch errors and commits `downloaded: true` to storage, falsely signaling to disaster victims that regional language packs are ready offline when zero bytes were stored.

3. **Integrity Rule on Facade Implementations**:
   Observation 3 shows that while the UI simulates downloading 28 MB of map tiles with progress percentages up to 100%, the implementation stores only 159 bytes of metadata JSON, delivering 0.0005% of the claimed content.

4. **Offline Resilience Invariant**:
   PRD Section 14 and safety invariants mandate 100% offline functionality.
   Observation 4 shows that `app/sw.js` activate event deletes all persistent offline packs on every SW activation, directly invalidating offline reliability.

5. **Acceptance Criteria Non-Compliance**:
   `ORIGINAL_REQUEST.md` line 47 requires: `node --test app/test/*.test.mjs passes with zero failures`.
   Observation 5 proves that the test suite currently fails with exit code 1.

Because one or more integrity forensic checks failed, the verdict must be **INTEGRITY VIOLATION** and the work product must be rejected.

---

## 3. Caveats

- **AST Scan (`check_no_mock.py`)**: The static syntax scan passed because no prohibited token names (`mock`, `fake`, `dummy`) were used as identifier names; the violations identified are behavioral and algorithmic facades rather than banned variable names.
- **No Caveats on Rejection**: The findings are empirically reproducible using standard Node.js test runs and static analysis.

---

## 4. Conclusion

**Verdict: INTEGRITY VIOLATION — REJECT WORK PRODUCT**

Milestone 1 fails forensic integrity verification due to:
1. Hardcoded discrete lookup table masking discontinuous area formula in `app/js/map_downloader.js`.
2. Fabricated offline download badge in `downloadLangPack` when network fetches fail.
3. Facade tile download behavior caching only 159 bytes while claiming 28 MB.
4. Unchecked service worker cache deletion destroying offline packs in `app/sw.js`.
5. Automated test failure in `node --test app/test/*.test.mjs`.

### Required Remediations for Worker:
1. **Continuous Monotonic Size Model**: Replace the discrete lookup table with a single continuous monotonic model (e.g., piecewise linear interpolation between calibrated presets) that handles 0, negative, and non-numeric values gracefully without negative jumps.
2. **Atomic Verification of Language Pack Caching**: Only set `lang_pack_${langCode}_downloaded` to `true` if all asset fetches succeed (`res.ok`). If any asset fails, show an error notification and retain the "Not Downloaded" badge.
3. **Protected Caches Allowlist in Service Worker**: Update `app/sw.js` activate handler to allowlist `floodsaathi-offline-maps-v1`, `floodsaathi-ai-models-v1`, and `floodsaathi-lang-packs-v1` so user data is never deleted during SW updates.
4. **Fix Test Suite Failures**: Ensure `node --test app/test/*.test.mjs` passes 100% with 0 failures.

---

## 5. Verification Method

To independently verify all findings and invalidation conditions:

1. **Verify Monotonicity Inversion**:
   ```powershell
   node -e 'import("./app/js/map_downloader.js").then(m => { console.log("10km:", m.estimateDownloadSize(10), "11km:", m.estimateDownloadSize(11), "25km:", m.estimateDownloadSize(25), "26km:", m.estimateDownloadSize(26)); })'
   ```
   *Observed*: 10km: 12, 11km: 9.7 (Drop), 25km: 28, 26km: 17.3 (Drop).

2. **Verify Test Suite Failure**:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   *Observed*: Exits with code 1.

3. **Verify SW Cache Eviction Vulnerability**:
   Inspect `app/sw.js` lines 50–67: observe `caches.delete(key)` invoked for all keys `!== CACHE_NAME`.

4. **Verify Adversarial Challenge Suite**:
   ```powershell
   node tests/adversarial/m1_stress_challenge.mjs
   ```
   *Observed*: 4 tests fail with raw metrics and memory dumps.
