# Project: FloodSaathi Offline Resilience & AI Pipeline

## Architecture
FloodSaathi is an offline-first flood early-warning web application and Python data relay/AI pipeline for Punjab, India.
The system consists of three primary tiers:
1. **Frontend PWA (`app/`)**:
   - Zero-bundler, vanilla ES modules and plain CSS.
   - Core controllers: `app/js/main.js`, `app/js/map_downloader.js`, `app/js/ai_assistant.js`, `app/js/store.js`, `app/js/i18n.js`.
   - UI views: Home (`#view-home`), Map (`#view-map`), Saathi (`#view-saathi`), Alerts (`#view-alerts`), Shelters (`#view-shelters`), SOS (`#view-sos`), More (`#view-more`), Preferences (`#view-preferences`), Downloads & Plugins (`#view-downloads`).
   - Local storage: IndexedDB (`store.js`) and Cache API (`floodsaathi-offline-maps-v1`, `floodsaathi-lang-packs-v1`).
2. **AI Model Ingestion & Fine-Tuning Pipeline (`scripts/`, `relay/`)**:
   - Storage Root: Strict storage root at `D:\FloodSaathi_AI\` (`datasets/`, `checkpoints/`, `cache/`, `exported/`) to preserve C: drive capacity.
   - Guideline Compiler (`scripts/compile_disaster_guidelines.py`): Ingests NDMA SOPs, Punjab SDMA manuals, CWC gauge warning/danger levels, Punjab Health well-chlorination formula (2.5g bleaching powder per 1000L), PSPCL 1912 electrical safety (10m distance), emergency helplines (112, 1078, 1070, 1077, 108, 1912), and verified shelters.
   - LoRA Fine-Tuning (`relay/train_mobile_model.py`): Qwen2.5-0.5B-Instruct adaptation (r=16, alpha=32).
   - Export Engine (`relay/export_mobile_model.py`): Exports ONNX Int4 and GGUF Q4_K_M formats.
3. **Verification & Testing Tier (`app/test/`, `relay/tests/`, `eval/`, `tests/e2e/`)**:
   - Node test suite: `node --test app/test/*.test.mjs`.
   - Pytest suite: `.venv\Scripts\python -m pytest relay/tests`.
   - AST check: `python scripts/check_no_mock.py`.
   - E2E 4-tier opaque-box test suite: `node tests/e2e/run_e2e_tests.mjs`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Desktop & Mobile Downloads Nav | Accessible "Downloads" tab in desktop header (`.desktop-nav`) and mobile nav (`.nav-tab-bar` + More hub) | M1 | R1 |
| F2 | Offline Map Pack Card | Radius selector (10, 25, 50, 100 km), dynamic size calculator (12, 28, 65, 140 MB), progress bar, Cache API tile caching | M1 | R1 |
| F3 | FloodSaathi SLM AI Model Card | Qwen2.5-0.5B-Instruct Int4 (~340 MB) card with download/active badges, toggle, and WebGPU connection hook | M1 | R1 |
| F4 | Python Runtime / Local Engine Card | Local execution engine status display, connection probe, and installation/run guidance | M1 | R1 |
| F5 | Regional Language Packs Card | Hindi (~4 MB) and Punjabi Gurmukhi (~4 MB) packs with download/active badges, English built-in default | M1 | R1 |
| F6 | GPS Re-sync Button | Geolocation re-sync button with visual feedback (`.spinning` animation), error/stale fallback display | M2 | R2 |
| F7 | Telemetry Proximity Indicator | Transparent banner on Home view showing user location + nearest CWC reporting gauge & distance upstream/downstream | M2 | R2 |
| F8 | Storage Root Routing | Root all AI datasets, checkpoints, cache, and exported artifacts strictly in `D:\FloodSaathi_AI\` | M3 | R3 |
| F9 | Disaster Guideline Compiler | Compiler script extracting verified NDMA, SDMA, CWC, 2.5g bleaching powder / 1000L, PSPCL 1912, helplines, shelters | M3 | R3 |
| F10 | LoRA Fine-Tuning & Quantization | Qwen 2.5 LoRA adaptation with ONNX Int4 and GGUF exports | M3 | R3 |
| F11 | Google Translate Settings & Fallback | Persistent API key setting in IndexedDB with seamless offline deterministic cards fallback | M3 | R3 |
| F12 | Automated Verification & Invariants | Automated test suite verifying guidelines, zero-mock AST rules, and existing test suites (100% pass) | M4 (Final) | R4 |
| F13 | Opaque-Box E2E Testing Suite | Comprehensive 4-tier requirement-driven test suite with test runner publishing TEST_READY.md | E2E Track | R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Requirement-driven test harness and test cases (Tiers 1-4), publishes TEST_READY.md | none | DONE |
| M1 | Downloads & Plugins UI | R1: Downloads tab navigation (desktop + mobile), 4 plugin cards (Maps, SLM, Python, Language Packs) | none | DONE |
| M2 | GPS Re-sync & Proximity Display | R2: GPS re-sync with visual feedback and Home view transparent telemetry proximity indicator | M1 (UI layout) | IN_PROGRESS |
| M3 | AI Model Ingestion & Fine-Tuning | R3: D:\FloodSaathi_AI\ storage root, disaster guideline compiler, LoRA training, ONNX/GGUF exports, Google Translate settings | none | PLANNED |
| M4 | Final Milestone & Hardening | R4: Pass 100% E2E test suite (Tiers 1-4) + Phase 2 Tier 5 Adversarial Coverage Hardening | E2E, M1, M2, M3 | PLANNED |

## Interface Contracts
### `app/js/map_downloader.js` ↔ `app/js/main.js`
- `estimateDownloadSize(radiusKm)`: returns numeric MB (10 -> 12, 25 -> 28, 50 -> 65, 100 -> 140).
- `downloadMapPack(lat, lon, radiusKm, onProgress)`: async function caching tiles in `floodsaathi-offline-maps-v1`, reports `{ percent, loadedBytes, totalBytes }`.
- `checkMapPackStatus(radiusKm)`: returns `{ downloaded: boolean, sizeMb: number }`.

### `app/js/ai_assistant.js` ↔ `app/js/main.js`
- `aiAssistant.setMode(mode)`: accepts `"deterministic_m5"` or `"webgpu_slm"`.
- `aiAssistant.getMode()`: returns current active mode.
- `aiAssistant.getHardwareCapabilities()`: returns `{ webgpu: boolean }`.
- Event `floodsaathi:slm_mode_changed`: dispatched on window when toggle changes.

### `app/js/main.js` (Proximity Indicator) ↔ `punjab.json` Telemetry
- `updateProximityBanner(snapshot, isStaleGps)`: calculates Haversine distance from `userProfile.lat/lon` to nearest gauge in `snapshot.gauges`, computes upstream/downstream orientation, renders string: `Your location: <village> · Hydrologic telemetry from: <gauge_name> (<distance> <upstream/downstream>)`.

### Settings ↔ IndexedDB (`store.js`)
- `getSetting(key)` / `setSetting(key, value)`: persists `google_translate_api_key`, `slm_model_downloaded`, `slm_model_enabled`, `lang_pack_hi_downloaded`, `lang_pack_pa_downloaded`.

### AI Pipeline (`scripts/`, `relay/`) ↔ `D:\FloodSaathi_AI\`
- Root path: `D:\FloodSaathi_AI\`.
- Subdirectories: `datasets/raw/`, `datasets/compiled/`, `checkpoints/`, `cache/huggingface/`, `cache/torch/`, `exported/`.
- Dataset format: JSONL with schema `{"id", "instruction", "input", "output", "source", "safety_category", "verified"}`.
- Export formats: ONNX Int4 (`model_int4.onnx`), GGUF (`qwen2.5-0.5b-instruct-q4_k_m.gguf`), `manifest.json`.

## Code Layout
- `app/index.html`: Web application HTML shell (navbars, views, cards, proximity banner).
- `app/css/main.css`: Styling for navigation, downloads view, plugin cards, telemetry banner, and animations.
- `app/js/main.js`: Primary UI controller, navigation routing, GPS re-sync logic, proximity calculation, and settings integration.
- `app/js/map_downloader.js`: Map tile downloader, size estimation, and Cache API caching.
- `app/js/ai_assistant.js`: AI assistant logic, WebGPU hook, and M5 deterministic safety card retrieval.
- `app/test/`: Frontend test suites (`downloads_proximity.test.mjs`, etc.).
- `scripts/compile_disaster_guidelines.py`: Crawler and compiler for official disaster guidelines.
- `relay/train_mobile_model.py`: LoRA fine-tuning script rooted in `D:\FloodSaathi_AI\`.
- `relay/export_mobile_model.py`: ONNX Int4 and GGUF model quantization exporter rooted in `D:\FloodSaathi_AI\`.
- `relay/tests/test_mobile_model.py`: Pytest suite for model pipeline, guidelines, and storage assertions.
- `tests/e2e/`: E2E opaque-box test runner and test cases (Tiers 1-4).
