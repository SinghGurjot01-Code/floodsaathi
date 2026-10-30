# Milestone 1 Empirical Challenge Report: SLM Model, Python Runtime, Language Packs & Mobile Navigation

**Agent Archetype**: `teamwork_challenger` (Challenger 2, Milestone 1)  
**Roles**: critic, specialist  
**Date**: 2026-10-30  
**Verdict**: **REQUEST_CHANGES**  
**Working Directory**: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_challenger_m1_2\`  

---

## Challenge Summary

- **Overall Risk Assessment**: **CRITICAL**
- **Focus Areas Assessed**:
  1. SLM Model toggle transitions, event dispatching, and WebGPU detection fallback
  2. Python runtime probe timeout handling and fallback to offline browser native mode
  3. Regional language pack physical asset resolution, Cache API keys, and active badge synchronization
  4. Mobile navigation touch target geometry on 360px viewport and Downloads view button ergonomics
  5. Cache durability across Service Worker lifecycle events

While the core functionality of the SLM model toggle, Python runtime probe timeout fallback, language pack physical assets, and mobile bottom tab bar geometry are solidly implemented and verified, empirical stress-testing revealed **one Critical data-loss vulnerability**, **one High calculation flaw**, and **one Medium touch-target ergonomic violation**. Consequently, Milestone 1 cannot be approved in its current state.

---

## 1. Observation

### Observation 1: Service Worker Activate Event Deletes All Downloaded Packs (`app/sw.js:50-62`)
In `app/sw.js`, lines 50–62:
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
- `CACHE_NAME` is defined as `"floodsaathi-v1.6.0"`.
- Meanwhile, the downloaded offline map tiles are cached in `"floodsaathi-offline-maps-v1"` (`app/js/map_downloader.js:6`).
- The downloaded regional language pack fonts and dictionaries are cached in `"floodsaathi-lang-packs-v1"` (`app/js/main.js:1171`).
- The downloaded SLM model manifest is cached in `"floodsaathi-ai-models-v1"` (`app/js/main.js:1075`).
- **Verbatim Error / Result from Adversarial Test** (`tests/adversarial/m1_stress_challenge.mjs` line 266):
  ```
  ✖ STRESS 5.1: Service Worker activate event must not delete offline map packs or language packs (2.6574ms)
    AssertionError [ERR_ASSERTION]: CRITICAL VULNERABILITY: Service Worker activate handler deletes all offline map, language pack, and model caches!
  ```

### Observation 2: Non-Monotonic Inversions and NaN Output in Size Calculator (`app/js/map_downloader.js:8-35`)
In `app/js/map_downloader.js`:
- Presets: $10\text{ km} \rightarrow 12\text{ MB}$, $25\text{ km} \rightarrow 28\text{ MB}$, $50\text{ km} \rightarrow 65\text{ MB}$, $100\text{ km} \rightarrow 140\text{ MB}$.
- Fallback calculation formula:
  ```javascript
  return Math.round(Math.PI * radiusKm * radiusKm * 0.025 * 10) / 10;
  ```
- **Verbatim Output from Boundary Test Harness** (`tests/adversarial/m1_stress_challenge.mjs` lines 88–138):
  ```
  Calculated inversions: [
    { radiusBefore: 10, sizeBefore: 12, radiusCurrent: 11, sizeCurrent: 9.7, dropMB: 2.3 },
    { radiusBefore: 25, sizeBefore: 28, radiusCurrent: 26, sizeCurrent: 17.3, dropMB: 10.7 },
    { radiusBefore: 50, sizeBefore: 65, radiusCurrent: 51, sizeCurrent: 44, dropMB: 21 },
    { radiusBefore: 99, sizeBefore: 143.5, radiusCurrent: 100, sizeCurrent: 140, dropMB: 3.5 }
  ]
  WARNING: Detected 4 monotonicity inversions in estimateDownloadSize!
  estimateDownloadSize(0): 8
  estimateDownloadSize(-25): 16.6
  estimateDownloadSize(NaN): NaN
  ```
- An input radius of $11\text{ km}$ yields $9.7\text{ MB}$ (smaller than $10\text{ km} = 12\text{ MB}$).
- An input radius of $\text{NaN}$ outputs $\text{NaN}$, rendering `"NaN MB"` in the UI.

### Observation 3: Touch Target Invariant Violations in Downloads View (`app/css/main.css:1617`, `app/index.html:813, 826`)
- In `app/css/main.css` line 1617:
  ```css
  .btn-plugin-download {
    width: 100%;
    height: 44px;
    border-radius: 12px;
    background: var(--navy);
  ...
  ```
  The primary action button on all four plugin cards (`.btn-plugin-download`) specifies `height: 44px;`, which violates the mandatory $48\text{ px}$ touch target invariant specified in `AGENTS.md` ("Mobile first (360 px), touch targets 48 px or more").
- In `app/index.html` lines 813 and 826:
  ```html
  <button class="radius-pill" id="btn-download-lang-pa" style="padding:3px 8px; font-size:11.5px;">Download (4.2 MB)</button>
  <button class="radius-pill" id="btn-download-lang-hi" style="padding:3px 8px; font-size:11.5px;">Download (3.9 MB)</button>
  ```
  These inline styles shrink the button height to approximately $22\text{ px}$, well below mobile touch standards.

### Observation 4: Verified Robust Implementations (`app/test/challenger_m1_2_deep_stress.test.mjs`)
Execution of the deep stress harness (`node --test app/test/challenger_m1_2_deep_stress.test.mjs`) confirmed:
```
✔ CHALLENGE 1.1: SLM Model mode toggling and safety invariant override (8.9181ms)
✔ CHALLENGE 1.2: WebGPU detection fallback when navigator.gpu is absent or fails (0.579ms)
✔ CHALLENGE 1.3: SLM model custom event dispatching and DOM toggle state synchronization (0.2871ms)
✔ CHALLENGE 2.1: Python runtime probe timeout handling and offline fallback (107.9976ms)
✔ CHALLENGE 3.1: Language pack physical asset resolution and WOFF2 / JSON format integrity (5.0654ms)
✔ CHALLENGE 3.2: Language pack Cache API keys and active badge synchronization logic (0.3717ms)
✔ CHALLENGE 4.1: Mobile navigation tab bar geometry on 360px viewport (2.001ms)
✔ CHALLENGE 4.2: Downloads View Button Touch Targets & Ergonomics Inspection (1.101ms)
ℹ tests 8
ℹ pass 8
ℹ fail 0
```
- **SLM Toggle & WebGPU Fallback**: `aiAssistant.setMode()` toggles cleanly between `deterministic_m5` and `webgpu_slm`, dispatches `floodsaathi:slm_mode_changed`, and gracefully falls back to CPU/Wasm when WebGPU is missing or rejects. Crucially, all safety-critical queries (helplines 112/1078, water crossing, electrical 10m/1912, medical refusal, river gauges) strictly enforce deterministic formatters regardless of active SLM mode.
- **Python Probe**: Probe uses `AbortController` with an 1800ms timeout and falls back to `"Browser Native (Offline PWA Mode)"` upon connection failure, network timeout, or HTTP 500 error.
- **Language Pack Physical Assets**: All 5 referenced assets (`noto_gurmukhi_*.woff2`, `noto_devanagari_*.woff2`, `pa.json`, `hi.json`, `cards.json`) exist, are non-empty, and carry valid headers (WOFF2 magic bytes `wOF2` and valid JSON). Active badges synchronize with `getCurrentLanguage()`.
- **Mobile Navigation Geometry**: The 6-tab `.nav-tab-bar` with `grid-template-columns: repeat(6, 1fr)` provides $58.67\text{ px}$ width $\times$ $48\text{ px}$ `min-height` on a $360\text{ px}$ viewport ($\ge 48\text{ px}$ touch target satisfied).

---

## 2. Logic Chain

1. **Safety & Durability Invariant**:
   - From Observation 1, `sw.js` activate handler unconditionally executes `caches.delete(key)` for every cache that is not equal to `CACHE_NAME` (`"floodsaathi-v1.6.0"`).
   - Because `floodsaathi-offline-maps-v1`, `floodsaathi-lang-packs-v1`, and `floodsaathi-ai-models-v1` are separate named caches, any service worker update or re-activation permanently deletes all user-downloaded maps, fonts, and model files.
   - In an emergency or offline flood event, the app would report packs as downloaded in IndexedDB while the actual tile and font assets in Cache API have been silently wiped out by the Service Worker. This directly violates the offline-first core mission of FloodSaathi.

2. **Calculator Monotonicity & Robustness Invariant**:
   - From Observation 2, `estimateDownloadSize` produces illogical inversions where a larger radius is calculated to have a smaller download size than a smaller radius (e.g. $11\text{ km} = 9.7\text{ MB} < 10\text{ km} = 12\text{ MB}$).
   - Furthermore, passing $\text{NaN}$ or negative numbers produces $\text{NaN}$ or positive non-zero numbers without boundary clamping.
   - This misinforms users regarding required cellular bandwidth and device storage before initiating downloads.

3. **Touch Target Ergonomics Invariant**:
   - `AGENTS.md` and `DISPATCH.md` mandate that touch targets be $\ge 48\text{ px}$ on a $360\text{ px}$ mobile viewport.
   - While the mobile bottom navigation bar (`.nav-tab-bar`) achieves this ($58.67\text{ px} \times 48\text{ px}$), Observation 3 demonstrates that `.btn-plugin-download` was hardcoded to `height: 44px;` and the language pack download buttons were given inline styles of `padding: 3px 8px; font-size: 11.5px;` (~22px height).
   - In emergency conditions, small touch targets degrade usability and cause missed taps.

---

## 3. Caveats

- **WebGPU Hardware Testing**: Tests were performed under headless Node.js 22 runtime environments with simulated `navigator.gpu` adapters and rejection mocks; physical mobile GPU hardware rendering was not directly tested on an Android device screen.
- **Relay Server**: The Python relay probe was tested via simulated network endpoints and HTTP mocks; a live running Uvicorn server on port 8000 was not kept permanently active in the test runner.
- No caveats regarding code review coverage: all assigned files and components were inspected and verified empirically.

---

## 4. Conclusion

**Verdict**: **`REQUEST_CHANGES`**

While Milestone 1 provides high-quality implementations for the SLM model toggle, Python runtime probe timeout handling, regional language pack asset resolution, and mobile navigation bar geometry, it cannot be approved due to three specific issues that must be remediated:

### Required Changes for Worker:

1. **Fix Service Worker Cache Whitelist (`app/sw.js:55-58`)**:
   Preserve persistent application data caches during the `activate` event by whitelisting them:
   ```javascript
   const PRESERVED_CACHES = new Set([
     CACHE_NAME,
     "floodsaathi-offline-maps-v1",
     "floodsaathi-lang-packs-v1",
     "floodsaathi-ai-models-v1"
   ]);
   if (!PRESERVED_CACHES.has(key)) {
     return caches.delete(key);
   }
   ```

2. **Fix Monotonicity & Clamping in Map Size Calculator (`app/js/map_downloader.js:8-35`)**:
   Sanitize the input `radiusKm` (handle `NaN`, $\le 0$, non-numeric), and clamp or interpolate fallback calculations so the returned size is strictly monotonic ($\text{size}(r_2) \ge \text{size}(r_1)$ for $r_2 > r_1$).

3. **Enforce $\ge 48\text{ px}$ Touch Targets on Downloads View Buttons**:
   - In `app/css/main.css`: change `.btn-plugin-download` from `height: 44px;` to `min-height: var(--touch-target);` ($48\text{ px}$).
   - In `app/index.html`: remove the restrictive inline style `padding: 3px 8px; font-size: 11.5px;` from `#btn-download-lang-pa` and `#btn-download-lang-hi`, and apply a class or style ensuring at least $48\text{ px}$ touch target height.

4. **Add Array Guard in `getDownloadedMapPacks` (`app/js/map_downloader.js`)**:
   Ensure `Array.isArray(parsed)` is checked before returning, falling back to `[]` if storage is corrupted or contains a non-array object.

---

## 5. Verification Method

To independently reproduce all empirical findings:

1. **Run Challenger 2 Deep Stress Suite**:
   ```powershell
   node --test app/test/challenger_m1_2_deep_stress.test.mjs
   ```
   *Result*: 8 passing tests verifying SLM mode toggle transitions, WebGPU detection fallback, Python runtime probe 1800ms timeout handling, language pack asset resolution, and 360px viewport geometry.

2. **Run Adversarial Challenge Suite**:
   ```powershell
   node --test tests/adversarial/m1_stress_challenge.mjs
   ```
   *Result*: Exits with code 1. Shows verbatim failure of STRESS 5.1 (SW cache deletion), STRESS 1.1 (size calculator monotonicity inversion), STRESS 2.1 (boundary values / NaN), and STRESS 4.1 (localStorage corruption).

3. **Inspect Problematic Source Lines**:
   - `app/sw.js` lines 50–62 (`caches.delete(key)` unconditionally deletes offline packs).
   - `app/js/map_downloader.js` lines 8–35 (size calculator inversions).
   - `app/css/main.css` line 1617 (`.btn-plugin-download { height: 44px; }`).
   - `app/index.html` lines 813 and 826 (compact inline styling on language download buttons).

4. **Invalidation Conditions**:
   This challenge is invalidated only when `sw.js` activate preserves persistent caches, `estimateDownloadSize` is strictly monotonic and NaN-safe, all download buttons have touch targets $\ge 48\text{ px}$, and `node --test tests/adversarial/m1_stress_challenge.mjs` passes 100%.
