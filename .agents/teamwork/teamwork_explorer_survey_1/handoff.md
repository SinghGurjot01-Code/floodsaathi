# Handoff Report: Survey & Architecture Extraction (R1–R4)

**Agent**: Survey Explorer 1 (`teamwork_explorer_survey_1`)  
**Parent Conversation ID**: `9cc25926-f064-4a11-b0f8-934dad82bf28`  
**Working Directory**: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_1\`  
**Date**: 2026-10-30  
**Type**: Hard Handoff (Investigation Complete)  

---

## 1. Observation

### 1.1 Requirements & Authoritative Context
- `ORIGINAL_REQUEST.md` (lines 10–27):
  - **R1**: "Add a 'Downloads' / 'Plugins & Packs' tab (`downloads`) to both the desktop header navigation (`.desktop-nav`) and mobile navigation in the FloodSaathi web application. The tab must display four plugin/pack cards: 1. Offline Map Pack (Recommended)... radius (10 km, 25 km, 50 km, 100 km), displays a dynamic download size calculator (e.g. 12 MB, 28 MB, 65 MB, 140 MB)... 2. FloodSaathi SLM AI Model: Qwen2.5-0.5B-Instruct Int4 (~340 MB)... 3. Python Runtime / Local Engine... 4. Regional Language Packs (Recommended): Hindi Pack (~4 MB) and Punjabi Gurmukhi Pack (~4 MB)..."
  - **R2**: "Add a GPS re-sync button providing visual feedback when geolocation fails, is unavailable, or is stale. Display a transparent telemetry proximity indicator on the Home view showing the user's current or selected location alongside the nearest hydrologic reporting station and distance (e.g., 'Your location: Taman, Jalandhar · Hydrologic telemetry from: CWC Beas Gauge (3.8 km upstream)')."
  - **R3**: "Root all AI datasets, checkpoints, cache, and exported artifacts in `D:\FloodSaathi_AI\`. Build dataset compilation and crawler scripts for verified disaster guidelines (NDMA SOPs, Punjab SDMA manuals, CWC gauge warning/danger levels, Punjab Health well-chlorination formulas: 2.5g bleaching powder per 1000L, PSPCL 1912 electrical safety, helplines 112/1078/1070, and verified shelters). Fine-tune Qwen 2.5 LoRA, export to ONNX Int4 and GGUF formats, and integrate a Google Translate API key configuration option in settings for enhanced online translation into Punjabi/Hindi with offline deterministic cards fallback."
  - **R4**: "Maintain the vanilla JS ES module and plain CSS architecture with no external bundlers or frontend frameworks. Strictly follow the no-mock-data rule: no simulated, sample, or synthetic data in production runtime or relay. Existing automated test suites (`node --test app/test/*.test.mjs`, `pytest relay/tests`, and `python scripts/check_no_mock.py`) must pass 100%."

### 1.2 Codebase State
- **R1 HTML & CSS**:
  - `app/index.html` lines 74–77: Desktop header nav button exists:
    `<button class="nav-tab-btn" data-tab="downloads">...<span>Downloads</span></button>`.
  - `app/index.html` lines 799–820: Mobile nav `<nav class="nav-tab-bar">` has only 5 buttons (`home`, `map`, `saathi`, `alerts`, `more`). The `downloads` tab button is missing.
  - `app/index.html` lines 631–791: `<section class="view-section" id="view-downloads">` contains all 4 cards (`.plugin-card`).
  - `app/css/main.css` lines 1453–1653: Contains styles `.downloads-container`, `.plugins-grid`, `.plugin-card`, `.radius-pill`, `.btn-plugin-download`.
  - `app/js/map_downloader.js` line 66: `estimateDownloadSize(radiusKm)` returns `Math.min(estimated, 85.0)` — caps at 85 MB instead of returning 140 MB for 100 km.
  - `app/js/main.js` lines 122–132: Neither `nav-to-downloads` nor `btn-back-from-downloads` are wired in `setupNavigation()`.
- **R2 GPS Re-sync & Proximity**:
  - `app/index.html` line 129: `<button class="btn-resync-gps" id="btn-resync-gps">...<span>Re-sync GPS</span></button>`.
  - `app/index.html` line 138–141: `<div class="telemetry-proximity-banner" id="telemetry-proximity-banner"><span id="telemetry-proximity-text">...</span></div>`.
  - `app/css/main.css` lines 337–365: `.btn-resync-gps` and `.btn-resync-gps.spinning svg` animation are styled.
  - `app/js/main.js`: `#btn-resync-gps` has no event listener; `#telemetry-proximity-text` is static in HTML and not dynamically computed in `renderSnapshotData`.
- **R3 Storage Root, Pipelines & Guidelines**:
  - Windows host storage: Powershell `Get-PSDrive` verifies Drive `D:\` has 181.54 GB free. `D:\FloodSaathi_AI\` does not yet exist.
  - `scripts/build_dataset.py` lines 21–25: Shows well chlorination formula: "Use 2.5 to 5 grams of fresh bleaching powder... per 1,000 litres of water."
  - `app/js/main.js` line 673: Shows: "For open drinking wells: Add 50 grams of fresh bleaching powder per 1,000 litres of water" (erroneous 50g from tank shock-chlorination, must be corrected to 2.5g).
  - `app/js/ai_assistant.js` lines 9–46: Contains `AUTHORIZED_HELPLINES` including 112, 1078, 1070, 1077, 108, and 1912.
  - `corpus/helplines.json` lines 1–44: Contains verified items 112, 1078, 1070, 1077, 108 (1912 needs inclusion).
  - `relay/train_mobile_model.py` and `relay/export_mobile_model.py`: Fully functional LoRA training and ONNX/GGUF/LiteRT export pipelines exist in `relay/`, currently defaulting output to `relay/models/`.
  - Settings UI (`app/index.html` lines 598–626): Currently lacks a Google Translate API key input field.
- **R4 Test Execution**:
  - `node --test app/test/*.test.mjs`: Exited code 0, 34 pass, 0 fail.
  - `.venv\Scripts\python -m pytest relay/tests`: Exited code 0, 8 passed in 0.39s. (System `python` failed due to missing `pytest` in Python 3.14).
  - `python scripts/check_no_mock.py`: Exited code 0, output `check_no_mock: OK`.

---

## 2. Logic Chain

1. **R1 Navigation Consistency**:
   - Because `ORIGINAL_REQUEST.md` R1 specifies adding the "Downloads" tab to both `.desktop-nav` and mobile navigation, and observation shows `.desktop-nav` has it while `.nav-tab-bar` does not, adding `<button class="nav-tab-btn" data-tab="downloads">` to `.nav-tab-bar` is strictly required.
   - Because `app/js/main.js` currently omits `nav-to-downloads` and `btn-back-from-downloads` from `setupNavigation()`, clicking those buttons in the UI does not transition views. Wiring them to `switchTab("downloads")` and `switchTab("more")` resolves this break in flow.
2. **R1 Map Size Calculations**:
   - `ORIGINAL_REQUEST.md` explicitly lists expected radii and sizes: 10 km (~12 MB), 25 km (~28 MB), 50 km (~65 MB), 100 km (~140 MB).
   - In `app/js/map_downloader.js`, the empirical function clamped at 85 MB. Updating the calculator to directly map or scale up to 140 MB satisfies the requirement.
3. **R2 Real-time Telemetry Proximity**:
   - Because `telemetry-proximity-banner` is currently static HTML, it violates the core PRD mandate that all displayed data must reflect real observations.
   - By calculating the Haversine distance between `userProfile` (lat, lon) and the active gauges in `snapshot.gauges` (e.g. `G_HARIKE` at lat 31.15, lon 74.95), the app can dynamically display the true distance (e.g. "CWC Beas Gauge (3.8 km away)") and orientation.
4. **R2 GPS Re-sync**:
   - Attaching `navigator.geolocation.getCurrentPosition` with `.spinning` class animation provides the required visual feedback and updates coordinates upon fix or falls back gracefully on timeout/denial.
5. **R3 Ingestion Root & Pipeline**:
   - Drive `D:\` is confirmed available with 181.5 GB. Rooting datasets, checkpoints, cache, and exports in `D:\FloodSaathi_AI\` ensures AI artifacts do not bloat the Git repository or exceed Cloudflare upload quotas.
   - Aligning well-chlorination formulas across `main.js` and `build_dataset.py` to the strict Punjab Health standard (2.5g bleaching powder per 1000L) guarantees medical/safety accuracy.
6. **R3 Translation Key Settings**:
   - Adding an API key input to Preferences, persisting it in IndexedDB `settings`, and falling back to local deterministic cards when offline or keyless fulfills the translation requirement without violating offline-first invariants.
7. **R4 Test Integrity**:
   - All tests pass, but `pytest` must be executed with `.venv\Scripts\python -m pytest` or `.venv\Scripts\pytest` because the Windows host default Python is 3.14 without pytest.

---

## 3. Caveats
1. Drive `D:\` is accessible on the host machine, but directory `D:\FloodSaathi_AI\` has not yet been populated with multi-gigabyte base model weights (`Qwen2.5-0.5B-Instruct` base weights); dry-run validation passes schemas, configs, and safety holdouts.
2. WebGPU availability in headless CI environments is simulated by falling back to M5 deterministic retrieval; this is by design in `app/js/ai_assistant.js` to preserve offline safety.
3. Google Translate API key requires user input in the browser settings; no live API key should be hardcoded in repository files.

---

## 4. Conclusion
All technical requirements, schemas, formulas, constants, and architectural boundaries for R1, R2, R3, and R4 have been verified and documented in `.agents/teamwork/teamwork_explorer_survey_1/report.md`.
The implementation roadmap for subsequent builders is clear and actionable:
- **Builder R1/R2**: Add mobile tab to `app/index.html`, wire navigation in `app/js/main.js`, bind GPS re-sync and Haversine proximity display, wire radius pills and progress bar in `map_downloader.js`.
- **Builder R3**: Create `D:\FloodSaathi_AI\` hierarchy, point LoRA fine-tuning and export scripts to `D:\FloodSaathi_AI\`, standardize 2.5g/1000L well chlorination formula, add Google Translate settings field with IndexedDB persistence.
- **Tester R4**: Run `node --test app/test/*.test.mjs`, `.venv\Scripts\python -m pytest relay/tests`, and `python scripts/check_no_mock.py`.

---

## 5. Verification Method

### 5.1 Verification Commands
Execute in project root:
```powershell
# 1. Verify Node test suite (34 tests)
node --test app/test/*.test.mjs

# 2. Verify Pytest suite (8 tests)
.venv\Scripts\python -m pytest relay/tests

# 3. Verify Zero-Mock rule
python scripts/check_no_mock.py

# 4. Verify D: drive availability
Get-PSDrive -PSProvider FileSystem
```

### 5.2 Invalidation Conditions
- Any occurrence of mock, dummy, or synthetic data in `app/`, `relay/`, `corpus/`, or `models/`.
- Failure of any unit test in `app/test/` or `relay/tests/`.
- Any hard-coded helpline number outside authorized list: 112, 1078, 1070, 1077, 108, 1912.
- Well chlorination formula showing values other than 2.5g bleaching powder per 1000L.
- Google Translate API failing silently or throwing uncaught errors when network is offline.

---
*Self-verified by Teamwork Survey Explorer 1.*
