# Milestone 1 Handoff Report: Downloads and Plugins Navigation & Management UI (R1)

**Agent Archetype**: `teamwork_worker` (Milestone 1 Worker)  
**Date**: 2026-10-30  
**Target Milestone**: M1 (R1: Downloads & Plugins Interface)  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

1. **Mobile and Desktop Navigation (`app/index.html`)**:
   - Prior to implementation, `.desktop-nav` in `app/index.html` (lines 74–77) had `<button class="nav-tab-btn" data-tab="downloads">`, but the mobile bottom bar `.nav-tab-bar` (lines 799–820) lacked the tab button entirely.
   - The `#view-downloads` view section existed with early placeholder cards, but lacked complete badge bindings, the SLM on/off toggle input, WebGPU detection display, Python relay setup guidance snippet, separate Hindi and Punjabi download/status badges, and progress bar hooks.
2. **Map Tile Calculator & Downloader (`app/js/map_downloader.js`)**:
   - `estimateDownloadSize` previously returned area-based estimates that did not match the R1 specifications: 10 km computed to 7.9 MB (expected 12 MB), 25 km computed to 49.1 MB (expected 28 MB), 50 km capped at 85 MB (expected 65 MB), and 100 km lacked a 140 MB preset.
   - The function `checkMapPackStatus(radiusKm)` was missing.
3. **Application Controller Routing (`app/js/main.js`)**:
   - `switchTab(tab)` in `app/js/main.js` lacked rendering integration for `if (tab === "downloads") renderDownloadsView();`.
   - `setupDownloadsView()` was a placeholder with basic alert triggers and did not manage model toggle persistence (`slm_model_downloaded`, `slm_model_enabled`), custom event dispatching (`floodsaathi:slm_mode_changed`), Python relay endpoint probing (`http://127.0.0.1:8000/health`), or Cache API caching for regional language packs.
4. **Authoritative Execution Outputs**:
   - Node test suite execution command `node --test app/test/*.test.mjs`:
     ```
     ✔ Map Downloader: Dynamic size calculation matches specification exactly (2.52ms)
     ✔ Map Downloader: MAP_RADIUS_SIZES contains valid entries for all four presets (0.5042ms)
     ✔ Map Downloader: Custom radius falls back to area-proportional estimation (0.3306ms)
     ✔ Map Downloader: checkMapPackStatus reports accurately before and after download (651.8404ms)
     ✔ SLM Model: Mode toggling between deterministic_m5 and webgpu_slm (6.009ms)
     ✔ Language Packs: Regional fonts, dictionaries, and i18n keys exist on disk (2.2547ms)
     ✔ HTML DOM: Desktop navigation contains accessible Downloads tab (0.5452ms)
     ✔ HTML DOM: Mobile navigation contains accessible Downloads tab with >= 48px target (0.4116ms)
     ✔ HTML DOM: Secondary navigation from More hub connects to downloads (0.2308ms)
     ✔ HTML DOM: #view-downloads section is populated with all four plugin cards (0.6244ms)
     ℹ tests 44
     ℹ suites 0
     ℹ pass 44
     ℹ fail 0
     ```
   - No-mock AST check `python scripts/check_no_mock.py`:
     ```
     check_no_mock: OK
     ```
   - Pytest suite `.venv\Scripts\python -m pytest relay/tests`:
     ```
     8 passed in 0.44s
     ```

---

## 2. Logic Chain

1. **R1 Navigation Requirements**:
   - Observation 1 showed the absence of the downloads tab in the mobile navigation bar.
   - We updated `.nav-tab-bar` in `app/index.html` to include `<button class="nav-tab-btn" data-tab="downloads">` with an inline override `style="grid-template-columns: repeat(6, 1fr);"` to preserve touch targets $\ge 48\text{ px}$.
   - We wired `switchTab("downloads")` in `app/js/main.js` to call `renderDownloadsView()` so entering the tab immediately synchronizes local state.
2. **Card 1: Offline Map Pack**:
   - In accordance with R1 and `PROJECT.md` contracts, `app/js/map_downloader.js` was updated with `MAP_RADIUS_SIZES` mapping $10\text{ km} \rightarrow 12\text{ MB}$, $25\text{ km} \rightarrow 28\text{ MB}$, $50\text{ km} \rightarrow 65\text{ MB}$, and $100\text{ km} \rightarrow 140\text{ MB}$.
   - Added `checkMapPackStatus(radiusKm)` to check cached packs in `localStorage` / `Cache API` and return `{ downloaded, sizeMb }`.
   - Updated `downloadMapPack` to emit detailed progress chunks (`{ percent, loadedBytes, totalBytes, currentMB, totalMB }`) and store pack metadata in `floodsaathi-offline-maps-v1`.
3. **Card 2: FloodSaathi SLM AI Model**:
   - Added status badges (`#slm-download-status-badge`, `#slm-active-status-badge`), WebGPU hardware detection (`#slm-webgpu-detection`), model download action (`#btn-download-slm`), and on/off toggle checkbox (`#toggle-slm-model`).
   - Wired the toggle to persist `slm_model_enabled` in IndexedDB via `setSetting`, invoke `aiAssistant.setMode("webgpu_slm" | "deterministic_m5")`, and dispatch the window event `floodsaathi:slm_mode_changed`.
4. **Card 3: Python Runtime / Local Engine**:
   - Added status badges (`#py-engine-status-badge`, `#py-engine-status-text`), local relay setup command block (`git clone ...; pip install ...; python relay/run.py`), and endpoint probe button (`#btn-check-python-runtime`).
   - The probe attempts an asynchronous health check against `http://127.0.0.1:8000/health` with a 1.8-second timeout, falling back cleanly to "Browser Native (Offline PWA Mode)" if the local daemon is not running.
5. **Card 4: Regional Language Packs**:
   - Implemented individual rows for Hindi Devanagari (~3.9 MB) and Punjabi Gurmukhi (~4.2 MB) alongside English built-in default.
   - Buttons fetch actual local font files (`noto_devanagari_*.woff2`, `noto_gurmukhi_*.woff2`) and translation dictionaries (`hi.json`, `pa.json`), storing them in Cache API `floodsaathi-lang-packs-v1`.
   - Badges dynamically update to "Downloaded" and "Active" based on `getCurrentLanguage()`.

---

## 3. Caveats

- **WebGPU in Headless Environments**: Headless Node.js unit tests do not possess a native GPU adapter; the assistant correctly detects this and falls back to deterministic M5 mode, ensuring safety invariants are preserved.
- **Local Python Relay Execution**: The probe against `http://127.0.0.1:8000/health` assumes the user runs the optional local relay sidecar; if inactive, the browser gracefully defaults to native offline PWA execution without error.
- No caveats regarding specification coverage: all four plugin cards, both navigation menus, and all interface contracts are fully implemented and verified.

---

## 4. Conclusion

Requirement R1 (Downloads and Plugins Navigation and Management UI) is 100% complete and verified:
- Accessible navigation is present on both desktop (`.desktop-nav`) and mobile (`.nav-tab-bar`), maintaining touch targets $\ge 48\text{ px}$.
- All four plugin cards (Offline Map Pack, SLM AI Model, Python Runtime, Regional Language Packs) maintain genuine state in Cache API and IndexedDB with dynamic calculators, status indicators, and toggle hooks.
- Zero mock data exists in runtime code, 10 new unit tests pass in `app/test/downloads.test.mjs`, and 100% of all existing test suites pass without regression.

---

## 5. Verification Method

To independently reproduce and verify this milestone:

1. **Frontend Unit Test Suite**:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   *Expected*: 44 passing tests (including all 10 tests in `downloads.test.mjs`), 0 failures.

2. **No-Mock AST Verification**:
   ```powershell
   python scripts/check_no_mock.py
   ```
   *Expected*: `check_no_mock: OK` with exit code 0.

3. **Backend & Relay Test Suite**:
   ```powershell
   .venv\Scripts\python -m pytest relay/tests
   ```
   *Expected*: 8 passed in ~0.44s with exit code 0.

4. **DOM & File Inspection**:
   - Inspect `app/index.html` lines 631–793 (`#view-downloads`) and line 800 (`.nav-tab-bar`).
   - Inspect `app/js/map_downloader.js` lines 8–80 (`MAP_RADIUS_SIZES`, `estimateDownloadSize`, `checkMapPackStatus`).
   - Inspect `app/js/main.js` lines 864–1100 (`renderDownloadsView`, `setupDownloadsView`).
   - Invalidation conditions: Any test failure in `downloads.test.mjs`, any mock pattern reported by `check_no_mock.py`, or failure to switch to `#view-downloads` upon tapping the downloads tab.
