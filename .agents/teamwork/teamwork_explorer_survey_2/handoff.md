# Handoff Report: Web Frontend Architecture, Downloads & Plugins, GPS Re-Sync & Telemetry Proximity

**Agent**: Survey Explorer 2 (`teamwork_explorer_survey_2`)  
**Parent Agent**: `9cc25926-f064-4a11-b0f8-934dad82bf28`  
**Milestone**: Web Frontend Architecture & UI Investigation  
**Working Directory**: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_2\`  
**Date**: 2026-10-30  

---

## 1. Observation

1. **Desktop vs Mobile Navigation**:
   - `app/index.html` lines 45–81 defines `.desktop-nav` (active $\ge 768\text{ px}$ via `app/css/main.css` line 147). Line 74 contains `<button class="nav-tab-btn" data-tab="downloads">`, but no corresponding `<section id="view-downloads">` exists in `index.html`.
   - `app/index.html` lines 634–655 defines `.nav-tab-bar` with 5 mobile tabs (`home`, `map`, `saathi`, `alerts`, `more`). In `app/index.html` lines 508–516 within `#view-more`, there is `<button class="action-report-btn" id="nav-to-downloads">`.
   - `app/js/main.js` lines 101–133 (`setupNavigation`) and lines 135–164 (`switchTab`):
     - `switchTab(tab)` toggles `.active` on `.nav-tab-btn` and `#view-${tab}`.
     - Event listener for `#nav-to-downloads` is missing in `setupNavigation()`.
     - `switchTab("downloads")` does not call any renderer because none is registered.

2. **Downloads View CSS & Assets**:
   - `app/css/main.css` lines 1452–1653 already contains complete CSS for the Downloads view and plugins grid: `.downloads-container`, `.plugins-grid`, `.plugin-card`, `.plugin-card.recommended`, `.plugin-badge`, `.radius-selector-row`, `.radius-pill`, `.plugin-stat-row`, `.btn-plugin-download`, and `.plugin-progress-wrap`.
   - `app/js/map_downloader.js`: Lines 8–45 define `MAP_PRESETS` (10, 25, 50 km). Function `estimateDownloadSize(radiusKm)` at line 61 calculates estimated MB. Function `downloadMapPack` at line 69 uses Cache API (`caches.open("floodsaathi-offline-maps-v1")`).
   - `app/js/ai_assistant.js`: Lines 80–117 implement hardware capability detection (`navigator.gpu` for WebGPU). Lines 130–142 provide `getMode()` and `setMode()`.
   - `app/fonts/`: Contains offline WOFF2 fonts for Noto Sans Devanagari (`noto_devanagari_*.woff2`, ~81 KB) and Noto Sans Gurmukhi (`noto_gurmukhi_*.woff2`, ~31 KB).
   - `app/i18n/`: `en.json`, `hi.json`, and `pa.json` all already have `"nav.downloads"` localized ("Downloads", "डाउनलोड / पैक", "ਡਾਊਨਲੋਡ / ਪੈਕ").

3. **GPS Re-Sync Button**:
   - `app/index.html` lines 129–132 contains:
     ```html
     <button class="btn-resync-gps" id="btn-resync-gps" title="Re-sync device GPS location" aria-label="Re-sync GPS">
       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"/><circle cx="12" cy="12" r="2"/></svg>
       <span>Re-sync GPS</span>
     </button>
     ```
   - `app/css/main.css` lines 337–364 defines `.btn-resync-gps` and `.btn-resync-gps.spinning svg` (`animation: spin 1s linear infinite;`).
   - `grep_search` confirmed zero references to `btn-resync-gps` in `app/js/`. No event listener or error feedback is attached.

4. **Telemetry Proximity Indicator**:
   - `app/index.html` lines 138–141 contains:
     ```html
     <div class="telemetry-proximity-banner" id="telemetry-proximity-banner">
       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
       <span id="telemetry-proximity-text">Your location: Taman, Jalandhar · Hydrologic telemetry from: CWC Beas Gauge (3.8 km away)</span>
     </div>
     ```
   - `app/data/latest/punjab.json` lines 22–71 contains active CWC gauges: `G_HARIKE` (Harike Barrage, lat 31.15, lon 74.95), `G_KOLDAM` (Kol Dam, lat 31.3824, lon 76.87199), `G_RSD` (Ranjit Sagar Dam, lat 32.444, lon 75.734).
   - In `app/js/main.js`, `telemetry-proximity-text` is never dynamically populated from `snapshot.gauges`.

5. **Automated Test Suites**:
   - Running `node --test app/test/*.test.mjs`:
     ```
     ✔ AI Assistant: Default mode is deterministic_m5 for offline safety
     ...
     ✔ Safety 8: Offline never-lower invariant holds previous Warning/Danger
     ℹ tests 34 | pass 34 | fail 0 | duration_ms 264.364
     ```
   - Running `python scripts/check_no_mock.py`:
     ```
     check_no_mock: OK
     ```

---

## 2. Logic Chain

1. **Navigation Integration**:
   - Based on Observation 1, the desktop nav button for `downloads` and the More-hub button `#nav-to-downloads` already exist in the HTML layout.
   - Adding a `<button class="nav-tab-btn" data-tab="downloads">` to `.nav-tab-bar` with an updated grid layout (`repeat(6, 1fr)`) makes Downloads directly accessible from mobile navigation while maintaining the existing desktop header navigation.
   - Because `switchTab(tab)` in `app/js/main.js` automatically looks for `document.getElementById("view-" + tab)`, adding `<section class="view-section" id="view-downloads">` to `index.html` and wiring the click handlers in `setupNavigation()` establishes a seamless, two-way routed view without any external framework.

2. **Downloads View & 4 Plugin Cards**:
   - Based on Observation 2, the CSS for all 4 cards is already present in `app/css/main.css` (lines 1452–1653).
   - Card 1 (Offline Map Pack): Updating `estimateDownloadSize` in `app/js/map_downloader.js` to return exactly 12 MB (10 km), 28 MB (25 km), 65 MB (50 km), and 140 MB (100 km) satisfies R1 dynamic size calculator. The existing `downloadMapPack` method caches to the Cache API and reports byte chunks to the progress bar.
   - Card 2 (SLM AI Model): `AskSaathiAssistant` in `app/js/ai_assistant.js` already provides hardware capability detection (`init()` checks WebGPU) and execution mode switching (`setMode("webgpu_slm")`). Connecting the UI toggle to `aiAssistant.setMode()` and persisting the preference in `store.js` fulfills R1.
   - Card 3 (Python Runtime / Local Engine): A lightweight fetch probe (`fetch("http://127.0.0.1:8000/health", { mode: 'no-cors', signal: AbortSignal.timeout(1500) })`) determines whether the local sidecar is running, displaying "Connected" vs "Standalone Web PWA" with expandable setup instructions.
   - Card 4 (Regional Language Packs): Offline fonts (`Noto Sans Devanagari` and `Noto Sans Gurmukhi`) and JSON dictionaries are already present in `app/fonts/` and `app/i18n/`. Caching them via Cache API upon button tap and checking `getCurrentLanguage()` fulfills the badge status requirement.

3. **GPS Re-Sync & Visual Feedback**:
   - Based on Observation 3, `#btn-resync-gps` and `.btn-resync-gps.spinning svg` are styled in CSS but lack JS logic.
   - Invoking `navigator.geolocation.getCurrentPosition` upon button tap, adding `.spinning` during acquisition, updating `userProfile.lat/lon` on success, and displaying a transient green success label or red stale error label provides complete visual feedback without breaking offline execution.

4. **Telemetry Proximity Indicator**:
   - Based on Observation 4, `punjab.json` provides live CWC gauge coordinates.
   - Computing the Haversine distance from `userProfile.lat, userProfile.lon` to each gauge in `snapshot.gauges` identifies the nearest station.
   - Comparing gauge latitude to user latitude determines upstream vs downstream flow in Punjab's southwest-flowing river basin.
   - Dynamically formatting `#telemetry-proximity-text` during `renderSnapshotData(snapshot)` provides the required transparent indicator.

5. **Test Architecture**:
   - Based on Observation 5, all 34 existing tests run with `node --test app/test/*.test.mjs` using pure ES modules.
   - New unit tests for radius size formulas, Haversine distances, upstream/downstream flow, and SLM mode transitions can be added cleanly to `app/test/downloads_proximity.test.mjs` with zero bundler overhead.

---

## 3. Caveats

1. **Hardware WebGPU Support**: WebGPU availability depends on the client browser and GPU hardware. The design gracefully falls back to deterministic M5 safety cards when WebGPU is unavailable or disabled.
2. **Local Python Engine Probe**: Browsers may restrict cross-origin requests to `http://127.0.0.1:8000`. Using `{ mode: 'no-cors' }` and an `AbortSignal.timeout(1500)` ensures the probe fails silently and swiftly without blocking the UI when no local server is running.
3. **GPS Accuracy**: In remote villages, GPS acquisition may take several seconds or time out. Storing the last verified coordinates in `store.js` guarantees that the app remains functional even if GPS fails completely.

---

## 4. Conclusion

The FloodSaathi web frontend is architecturally well-structured and ready for the implementation of R1 (Downloads & Plugins View with 4 cards) and R2 (GPS Re-Sync and Telemetry Proximity Indicator). Complete CSS styling is already in place. The missing elements are:
1. Adding `<section class="view-section" id="view-downloads">` and the mobile nav button in `app/index.html`.
2. Wiring event listeners, renderers, GPS re-sync feedback, and dynamic proximity indicator updates in `app/js/main.js`.
3. Calibrating radius sizes in `app/js/map_downloader.js` (10km $\rightarrow 12\text{ MB}$, 25km $\rightarrow 28\text{ MB}$, 50km $\rightarrow 65\text{ MB}$, 100km $\rightarrow 140\text{ MB}$).
4. Adding `app/test/downloads_proximity.test.mjs` to maintain 100% automated test coverage.

---

## 5. Verification Method

1. **Automated Unit Tests**:
   Execute the test suite to verify all logic passes:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   *Expected outcome*: 0 failures across all test suites.

2. **No-Mock Verification**:
   Execute the no-mock scanner:
   ```powershell
   python scripts/check_no_mock.py
   ```
   *Expected outcome*: `check_no_mock: OK`.

3. **DOM & Route Verification**:
   - Open `app/index.html` in browser.
   - Click "Downloads" in desktop header nav $\rightarrow$ verify `#view-downloads` displays active class.
   - In mobile view (< 768px), click "Downloads" tab in bottom nav or "Offline Packs & Plugins" in More hub $\rightarrow$ verify view switches smoothly.
   - On Downloads view, click radius pills 10, 25, 50, 100 km $\rightarrow$ verify download size calculator updates dynamically (12, 28, 65, 140 MB).
   - Click "Re-sync GPS" on Home $\rightarrow$ verify button displays spinning animation and updates location / proximity text.
   - Verify Home telemetry proximity indicator displays nearest gauge name, distance in km, and upstream/downstream label.
