# Comprehensive Survey & Architecture Report: R1–R4

**Agent**: Survey Explorer 1 (`teamwork_explorer_survey_1`)  
**Mission**: Extract all requirements, specifications, guidelines, formulas, constants, schemas, and architectural boundaries for R1, R2, R3, and R4.  
**Date**: 2026-10-30  

---

## Executive Summary
This survey establishes the complete technical and operational specifications for FloodSaathi's Downloads & Plugins interface (R1), GPS re-sync and telemetry proximity indicator (R2), AI model ingestion and fine-tuning pipeline rooted in `D:\FloodSaathi_AI\` (R3), and strict verification standards under the zero-mock-data invariant (R4). All underlying calculations, schemas, formulas, file paths, and implementation requirements are extracted directly from authoritative project documents (`docs/PRD.md`, `docs/tasks/STATUS.md`, `docs/DECISIONS.md`, and `ORIGINAL_REQUEST.md`) and verified against the live codebase.

---

## 1. R1: Downloads and Plugins Navigation & Management UI

### 1.1 Navigation Architecture & Requirements
- **Desktop Navigation (`.desktop-nav`)**:
  - Located in `app/index.html` (lines 45–82) inside `.app-header`. Visible on screens $\ge 768\text{ px}$.
  - Current status: Desktop navigation already includes the Downloads button:
    ```html
    <button class="nav-tab-btn" data-tab="downloads">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
      <span data-i18n="nav.downloads">Downloads</span>
    </button>
    ```
- **Mobile Navigation (`.nav-tab-bar`)**:
  - Located in `app/index.html` (lines 799–820) at the bottom viewport. Visible on mobile screens $< 768\text{ px}$.
  - **Identified Gap**: Currently contains 5 tabs: `home`, `map`, `saathi`, `alerts`, `more`. The `downloads` tab is missing from the mobile tab bar.
  - **Required Implementation**: Add `<button class="nav-tab-btn" data-tab="downloads">` with download icon and label `<span data-i18n="nav.downloads">Downloads</span>`.
- **Sub-View Routing in `app/js/main.js`**:
  - Current status: The section container `<section class="view-section" id="view-downloads">` is present in `app/index.html` (lines 631–791).
  - **Identified Gaps**:
    1. Navigation event listener for `#nav-to-downloads` (button in More Hub `app/index.html` line 508) is not wired in `setupNavigation()`.
    2. Back button event listener for `#btn-back-from-downloads` (`app/index.html` line 633) is not wired in `setupNavigation()`.
    3. `switchTab(tab)` in `app/js/main.js` must support activating `#view-downloads` and updating the active state of navigation buttons.

### 1.2 The Four Plugin & Pack Cards Specifications

#### Card 1: Offline Map Pack (Recommended)
- **HTML Container**: `app/index.html` lines 643–690 (`.plugin-card.recommended`).
- **Functionality**:
  - User-selectable radius pills: 10 km, 25 km, 50 km, 100 km.
  - Dynamic download size calculator values (per `ORIGINAL_REQUEST.md` R1):
    | Radius | Estimated Size | Primary Scope |
    |---|---|---|
    | **10 km** | **12 MB** | Village & immediate riverbank corridor |
    | **25 km** | **28 MB** | Tehsil level & local evacuation roads |
    | **50 km** | **65 MB** | Full District & major barrage reaches |
    | **100 km** | **140 MB** | Multi-district catchment & river basin |
  - **Identified Code Gap**: In `app/js/map_downloader.js` (line 66), `estimateDownloadSize(radiusKm)` previously capped values at `85.0 MB`. It must be aligned to return 12 MB (10 km), 28 MB (25 km), 65 MB (50 km), and 140 MB (100 km).
  - **UI Bindings**:
    - Radius pills (`.radius-pill` with `data-radius` and `data-mb`): Clicking a pill updates the `.active` class, calculates size, and updates `#map-selected-size-text`.
    - Download button: `#btn-download-map-pack-plugin`.
    - Download progress bar: `#map-plugin-progress-wrap`, `#map-plugin-progress-fill` (width 0%–100%), `#map-plugin-progress-pct` (`"X% (Y / Z MB)"`), and `#map-plugin-progress-msg`.
    - Status badge: `#map-pack-status-badge` updates to "Cached (Active)" upon download completion.
  - **Storage Architecture**:
    - Stores PMTiles and vector tiles locally via Cache API (`floodsaathi-offline-maps-v1`) and localStorage registry (`floodsaathi_offline_map_packs`).
    - Manifest metadata: `{ id, name, lat, lon, radiusKm, sizeMB, downloadedAt }`.

#### Card 2: FloodSaathi SLM AI Model
- **HTML Container**: `app/index.html` lines 692–719.
- **Specifications**:
  - Model Name: FloodSaathi SLM (`Qwen2.5-0.5B-Instruct` Int4).
  - Target Quantized Size: ~340 MB.
  - Execution Engine: ONNX Int4 / WebGPU / WebAssembly SIMD.
  - Storage Target: `D:\FloodSaathi_AI\models`.
  - Status Indicators: Badges "Active Model" and "~340 MB (Int4)".
  - Controls: Action button `#btn-toggle-ai-model` toggling model state between "Active Model (M5 Deterministic Core Ready)" and "On-Device SLM (WebGPU Active)".
  - Connection Hook: Provides programmatic binding to `AskSaathiAssistant` (`app/js/ai_assistant.js`) to switch `assistant.setMode("deterministic_m5")` or `"webgpu_slm"`.

#### Card 3: Python Runtime / Local Engine
- **HTML Container**: `app/index.html` lines 721–746.
- **Specifications**:
  - Engine: Web Worker / Pyodide / Native WebAssembly runtime.
  - Size: ~18 MB.
  - Status Indicators: Badges "Local Engine", "~18 MB", "Runtime Ready".
  - Guidance Action: Button `#btn-check-python-runtime` displaying runtime verification dialog, capability details (reach speed empirical distributions, wave transit models), and installation guidance.

#### Card 4: Regional Language Packs (Recommended)
- **HTML Container**: `app/index.html` lines 748–788.
- **Specifications**:
  - Packs:
    1. **Punjabi Pack (Gurmukhi)**: ~4.2 MB. Bundles Noto Sans Gurmukhi font (`app/fonts/`), complete Punjabi disaster terminology dictionary, and 46 pre-translated offline protocol cards.
    2. **Hindi Pack (Devanagari)**: ~3.9 MB. Bundles Noto Sans Devanagari font (`app/fonts/`), Devanagari disaster vocabulary, and 46 pre-translated offline protocol cards.
    3. **English**: Built-in default (0 MB additional download).
  - Status Badges: "Recommended", "Active" / "Installed".
  - Action Button: `#btn-sync-lang-packs` triggers verification and re-sync of cached regional language dictionaries.

---

## 2. R2: GPS Re-sync and Proximity Telemetry Display

### 2.1 GPS Re-sync Button
- **HTML Element**: `<button class="btn-resync-gps" id="btn-resync-gps">` in `app/index.html` line 129.
- **CSS Styling**: `app/css/main.css` lines 337–365. Contains `.spinning` class triggering `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`.
- **Operational Logic**:
  1. User clicks `#btn-resync-gps`.
  2. Button immediately adds class `.spinning` to provide visual spinner feedback.
  3. Invokes `navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 })`.
  4. **On Success**:
     - Extract coordinates `lat`, `lon` and horizontal accuracy `accuracy_m`.
     - Update `userProfile.lat = lat` and `userProfile.lon = lon`.
     - Reverse-snap coordinates to nearest known Punjab village in `packs/region-amritsar/villages.json` or update location label: `#loc-village-name` and `#loc-state-name`.
     - Re-evaluate distances to hydrologic stations and re-compute raw and offline status.
     - Remove `.spinning` class and briefly display "GPS Synced".
  5. **On Error / Stale / Denied / Timeout**:
     - Remove `.spinning` class.
     - Display non-blocking feedback: "GPS fix unavailable / timed out. Using last saved location."
     - Maintain existing cached coordinates without crashing or setting ungrounded fallbacks.

### 2.2 Transparent Telemetry Proximity Indicator
- **HTML Element**: `app/index.html` lines 138–141:
  ```html
  <div class="telemetry-proximity-banner" id="telemetry-proximity-banner">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    <span id="telemetry-proximity-text">Your location: Taman, Jalandhar · Hydrologic telemetry from: CWC Beas Gauge (3.8 km away)</span>
  </div>
  ```
- **CSS Styling**: `app/css/main.css` lines 366–378. Background: `rgba(255, 255, 255, 0.9)`, border: `1px solid rgba(37, 99, 235, 0.15)`, radius: `12px`, color: `#1e3a8a`.
- **Text Pattern Specification**:
  `"Your location: {village_name} · Hydrologic telemetry from: {nearest_gauge_name} ({distance_km} km {direction})"`
- **Distance Formula (Haversine)**:
  $$\Delta\phi = (\text{lat}_2 - \text{lat}_1) \cdot \frac{\pi}{180}$$
  $$\Delta\lambda = (\text{lon}_2 - \text{lon}_1) \cdot \frac{\pi}{180}$$
  $$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\left(\frac{\text{lat}_1 \cdot \pi}{180}\right) \cdot \cos\left(\frac{\text{lat}_2 \cdot \pi}{180}\right) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
  $$c = 2 \cdot \arctan2(\sqrt{a}, \sqrt{1 - a})$$
  $$d = 6371 \cdot c \quad (\text{km})$$
- **Orientation Calculation (`direction`)**:
  - Compare user elevation and river reach direction:
    - If station has `lat > user.lat` or is upstream along river corridor: `"upstream"`.
    - If station has `lat < user.lat` or is downstream: `"downstream"`.
    - Fallback: `"away"`.

### 2.3 Authoritative CWC Hydrologic Station Telemetry Schema
From `relay/sources/cwc.py` and `app/data/latest/punjab.json`:
```json
{
  "id": "G_HARIKE",
  "name": "Harike Barrage",
  "river": "Sutlej-Beas",
  "lat": 31.150,
  "lon": 74.950,
  "level_m": 3.58,
  "warning_m": 3.80,
  "danger_m": 4.50,
  "bank_m": 4.20,
  "trend_m_per_h": 0.02,
  "observed_at": "2026-10-30T15:55:54+05:30",
  "upstream_id": "G_RSD",
  "downstream_id": null,
  "regulated": true
}
```
Secondary stations in Punjab basin:
- `G_RSD` (Ranjit Sagar Dam / Thein Dam, River Ravi): Lat 32.444, Lon 75.734, Warning: 525.91 m, Danger (FRL): 527.91 m, Bank: 528.91 m.
- `G_KOLDAM` (Kol Dam, River Sutlej): Lat 31.3824, Lon 76.87199, Warning: 722.22 m, Danger: 724.22 m, Bank: 725.72 m.

---

## 3. R3: AI Model Ingestion & Fine-Tuning Pipeline

### 3.1 Storage Root Architecture (`D:\FloodSaathi_AI\`)
- **System Verification**: Drive `D:\` is verified mounted and operational on the target host with **181.54 GB** free storage.
- **Directory Hierarchy**:
  ```
  D:\FloodSaathi_AI\
  ├── datasets\            # Cleaned domain JSONL, Parquet, guidelines corpus
  │   ├── flood_safety_dataset.jsonl
  │   └── crawler_outputs\
  ├── checkpoints\         # PEFT LoRA adapter checkpoints, optimizer states
  │   └── saathi_lora\
  │       ├── adapter_config.json
  │       ├── adapter_model.safetensors
  │       └── training_meta.json
  ├── cache\               # Hugging Face transformers, tokenizer & datasets cache
  └── models\              # Exported deployment artifacts
      ├── onnx\            # Int4 ONNX models for WebGPU
      │   ├── onnx_config.json
      │   ├── genai_config.json
      │   └── tokenizer_config.json
      ├── gguf\            # Q4_K_M GGUF format
      │   └── model_spec.json
      ├── litert\          # Google LiteRT / MediaPipe task specs
      │   └── task_spec.json
      └── manifest.json    # Master deployment manifest with SHA-256
  ```

### 3.2 Authoritative Disaster Guidelines & Key Formulas

#### 1. Well-Water Disinfection (Punjab Health & WHO)
- **Authoritative Standard**: World Health Organization (WHO) Guidelines for Drinking-water Quality in Emergencies & Punjab State Disaster Management Authority (SDMA).
- **Exact Dosing Constant**: **2.5 grams of fresh bleaching powder (containing ~33% available chlorine) per 1,000 litres of water**.
- **Well Volume Formula**:
  $$V = \pi \cdot r^2 \cdot h \quad (\text{m}^3)$$
  $$\text{Capacity in Litres} = V \cdot 1,000$$
  where $r$ is the well radius in metres, and $h$ is the water column depth in metres.
- **Preparation Protocol**:
  1. Measure water volume.
  2. Weigh bleaching powder at 2.5 g per 1,000 L (up to 5 g/1000L if water is visibly murky).
  3. Form a paste with water in a clean bucket, then add more water and stir thoroughly.
  4. Allow slurry to settle undisturbed for 15–20 minutes so insoluble lime drops to the bottom.
  5. Decant only the clear supernatant liquid into the well.
  6. Agitate well with a clean bucket and allow a minimum **1 to 2 hours of contact time** before drawing water.
- **Boiling Standard**: Minimum **1 full minute (60 seconds) rolling boil** to destroy waterborne pathogens.

#### 2. Electrical Safety (PSPCL & Central Electricity Authority)
- **Authoritative Source**: Punjab State Power Corporation Limited (PSPCL) & Central Electricity Authority (CEA) Safety Regulations.
- **Helpline**: **1912** (PSPCL 24/7 Electrical Emergency).
- **Step Potential Hazard**: High-voltage lines in wet ground form concentric voltage gradients.
- **Safe Clearance**: Keep a distance of **at least 10 metres (33 feet)** from any downed power line or flooded electrical pole.
- **Escape Protocol**: Hop with both feet pressed together ("bunny hop") or shuffle without lifting feet or separating them by more than 2 inches.
- **Submerged Circuits**: Never re-energize flooded breakers or motors until cleared by a licensed electrician via insulation resistance (Megger) test.

#### 3. Emergency Helplines (Strict Invariant)
From `corpus/helplines.json` and Government of Punjab directories:
| Number | Authority | Purpose |
|---|---|---|
| **112** | ERSS (National Emergency) | Search & rescue, life safety, Police, Fire, NDRF/SDRF deployment |
| **1078** | NDMA Control Room | National disaster alert verification and interstate coordination |
| **1070** | Punjab SEOC (State Control) | Punjab state flood control, boat dispatch, relief logistics |
| **1077** | DDMA (District Control) | District emergency control room, local relief camp allocation |
| **108** | Punjab Ambulance | Free emergency medical transport and hospital admission |
| **1912** | PSPCL | Downed power lines, transformer fires, feeder shutdown |

#### 4. Water-Crossing Directives
- **Universal Safety Directive**: "Turn Around, Don't Drown."
- 15 cm (6 inches) moving water knocks down an adult.
- 30 cm (12 inches) moving water floats and derails small cars.
- 60 cm (2 feet) moving water sweeps away large tractors, SUVs, and heavy trucks.
- Categorical refusal of all queries asking if it is safe to walk or drive through flood waters.

#### 5. Evacuation Shelters & Relief Centers
From `corpus/shelters_punjab.json`:
- `sh-jal-001`: Govt Model Senior Secondary School, Jalandhar (Lat 31.326, Lon 75.576, Cap: 850, Elev: 232 m).
- `sh-asr-002`: Khalsa College Relief Center, Amritsar (Lat 31.642, Lon 74.832, Cap: 1200, Elev: 234 m).
- `sh-kpt-003`: Civil Hospital Relief Camp, Kapurthala (Lat 31.222, Lon 75.198, Cap: 600, Elev: 220 m).

### 3.3 LoRA Fine-Tuning Pipeline (`relay/train_mobile_model.py`)
- Base Model: `Qwen/Qwen2.5-0.5B-Instruct`.
- Format: ChatML template (`<|im_start|>system...<|im_end|>`).
- LoRA Parameters: Rank $r=16$, Alpha $\alpha=32$, Dropout $0.05$.
- Target Linear Modules: `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`.
- Trainable Parameter Footprint: ~4.2M parameters (~0.85% of total 492M parameters).
- Safety Invariant Gate: Evaluates against `eval/must_pass.json` (40 must-pass safety items). Requires **100% pass rate** before artifacts are approved.

### 3.4 Export Pipeline (`relay/export_mobile_model.py`)
- **ONNX Int4**: Quantized via RTN symmetric 4-bit, block size 32. RAM footprint estimated at **348 MB**, satisfying the $< 400\text{ MB}$ browser memory budget.
- **GGUF Q4_K_M**: Quantized for CPU/NPU inference on Android devices (~352 MB).
- **LiteRT**: TensorFlow Lite GenAI task specification for Android NPU/GPU delegates.
- **Master Manifest**: Schema `floodsaathi.exported_model.v1` with SHA-256 integrity hash.

### 3.5 Google Translate API Key Integration in Settings
- **Preferences UI Placement**: Add an API key configuration card inside `#view-preferences` (`app/index.html`):
  - Password input field `#pref-google-translate-key`.
  - Toggle visibility button (Eye icon).
  - "Save API Key" button `#btn-save-translate-key`.
- **Persistence**: Stored in IndexedDB `settings` store via `setSetting("google_translate_api_key", key)` and retrieved via `getSetting("google_translate_api_key")`.
- **Online Translation**: When `navigator.onLine` is true and API key is present:
  - Dynamically translate custom responses via `POST https://translation.googleapis.com/language/translate/v2?key={API_KEY}` into Hindi (`hi`) or Punjabi (`pa`).
- **Offline & Fallback Safety**:
  - When offline, if key is missing/invalid, or on network timeout, the application falls back 100% to verified deterministic cards in `corpus/cards/cards.json` and local M5 router responses.

---

## 4. R4: Architectural & Verification Standards

### 4.1 Architecture & Stack
- **Web App (`app/`)**: Vanilla JS ES modules, plain CSS, NO build step, NO bundler, NO external frameworks.
- **Libraries**: Vendored locally in `app/vendor/` with pinned versions and licenses.
- **Pure Logic Modules**: `app/js/estimator.js`, `app/js/status.js`, `app/js/ai_assistant.js` have zero DOM or network dependencies, running under `node --test`.

### 4.2 Zero Mock Data Rule (Hard Invariant)
- Regulated by `scripts/check_no_mock.py`.
- Forbids: `mock`, `lorem ipsum`, `dummy`, `sample-data`, `fake-(data|gauge|village|user|report)`, `demo-mode`, `replay-mode`, `synthetic`, and random generators for flood parameters in runtime code.
- Current status: **PASS** (`check_no_mock: OK`).

### 4.3 Automated Verification Suites Status
1. **Node Test Suite**:
   - Command: `node --test app/test/*.test.mjs`
   - Results: **34 passing tests, 0 failures** (Duration: ~220 ms).
   - Validates: Section 9.7 test vectors, unified vertical datum HAND check, offline never-lower rules, safety status classification (Safe/Watch/Warning/Danger/Unknown/Data Unavailable), and M5 AI Assistant invariants.
2. **Pytest Suite**:
   - Command: `.venv\Scripts\python -m pytest relay/tests`
   - **Environment Finding**: System Python is Python 3.14 (lacking pytest), whereas project virtual environment `.venv` contains Python 3.12 with all dependencies. Downstream commands must invoke `.venv\Scripts\python -m pytest` or `.venv\Scripts\pytest`.
   - Results: **8 passing tests, 0 failures** (Duration: ~0.4 s).
   - Validates: Flood front detection, relay payload schema validation, LoRA dry-run config, ChatML formatting, safety holdout gate (100%), and model export specifications.
3. **Dataset Verification**:
   - Script: `scripts/build_dataset.py`
   - Result: 46 authoritative disaster guidance entries compiled to `corpus/flood_safety_dataset.jsonl`.

---

## 5. Synthesis of Gaps and Concrete Recommendations

| Component | Current State | Required Modification | Target Files |
|---|---|---|---|
| **R1 Mobile Nav** | 5 tabs (`home`, `map`, `saathi`, `alerts`, `more`) | Add 6th tab for `downloads` with download icon | `app/index.html` |
| **R1 Nav Wiring** | `nav-to-downloads` & `btn-back-from-downloads` not bound | Wire event listeners and `switchTab("downloads")` | `app/js/main.js` |
| **R1 Map Radius** | Size calculation capped at 85MB | Update to 10km (12MB), 25km (28MB), 50km (65MB), 100km (140MB) | `app/js/map_downloader.js`, `app/js/main.js` |
| **R1 Card Actions** | Cards static in `#view-downloads` | Wire radius pills, download progress bar, SLM toggle, Python info, lang pack re-sync | `app/js/main.js` |
| **R2 GPS Re-sync** | `#btn-resync-gps` present in HTML/CSS | Attach geolocation listener, spinner animation, success/failure feedback | `app/js/main.js` |
| **R2 Proximity** | Hardcoded text in banner | Dynamically calculate nearest station & Haversine distance from live gauges | `app/js/main.js` |
| **R3 AI Storage** | Rooted in repo `relay/models/` | Create `D:\FloodSaathi_AI\` and point datasets, checkpoints, cache, exports there | `relay/train_mobile_model.py`, `relay/export_mobile_model.py` |
| **R3 Well Formula** | In `main.js` line 673 erroneously shows 50g | Ensure strict 2.5g bleaching powder per 1000L formula across all files | `app/js/main.js`, `scripts/build_dataset.py` |
| **R3 Translate Key** | Missing in Settings | Add API key input, eye toggle, IndexedDB persistence, online translate + fallback | `app/index.html`, `app/js/main.js`, `app/js/store.js` |
| **R4 Test Execution** | System `python` lacks pytest | Document and invoke test commands via `.venv\Scripts\python -m pytest` | Runbooks and CI workflows |

---
*Report prepared and self-verified by Teamwork Survey Explorer 1.*
