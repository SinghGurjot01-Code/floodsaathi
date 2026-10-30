# FloodSaathi Test Infrastructure (TEST_INFRA.md)

## 1. Overview & Architectural Philosophy
The FloodSaathi test infrastructure is designed around a **4-Tier Opaque-Box Methodology** rooted strictly in user requirements from `ORIGINAL_REQUEST.md`, system scope in `PROJECT.md`, and product specifications in `docs/PRD.md`.

In strict adherence to project invariants:
- **Zero Mock Data**: No mocked, simulated, sample, or synthetic data in production runtime or relay. AST validator `scripts/check_no_mock.py` enforces this.
- **Pure ES Modules & Vanilla Architecture**: No external bundlers, no compilation steps, zero npm package lock-in. Tests run directly on Node.js (v20+) using standard `node:test` and `node:assert/strict`.
- **Opaque-Box Verification**: The test suite evaluates observable behavior, interface contracts, DOM structure, exported APIs, and file-system artifacts without mutating product code.

---

## 2. Test Suite Architecture

```
FloodSaathi Root
├── TEST_INFRA.md                     # This document (test architecture & feature mapping)
├── TEST_READY.md                     # Ready certification and baseline test results
└── tests/
    └── e2e/
        ├── run_e2e_tests.mjs         # Master test runner executing all tiers with ASCII/JSON reports
        ├── test_helpers.mjs          # Opaque-box DOM inspector, mock browser env, Haversine calculators
        ├── tier1_feature_tests.mjs   # Tier 1: 60 feature coverage tests (F1 to F12, >=5 each)
        ├── tier2_boundary_tests.mjs  # Tier 2: 60 boundary & corner tests (F1 to F12, >=5 each)
        ├── tier3_cross_feature_tests.mjs # Tier 3: 12 pairwise cross-feature interaction tests
        └── tier4_real_world_tests.mjs    # Tier 4: 5 multi-step emergency and field responder journeys
```

---

## 3. Feature Inventory & Coverage Mapping

| Feature ID | Feature Name | Tier 1 Tests | Tier 2 Tests | Key Coverage Focus |
|---|---|---|---|---|
| **F1** | Desktop & Mobile Downloads Nav | F1.1 - F1.5 (5) | B1.1 - B1.5 (5) | Header `.desktop-nav` button, Mobile `#nav-to-downloads`, `#view-downloads` container, accessible aria/SVG, back button routing. |
| **F2** | Offline Map Pack Card | F2.1 - F2.5 (5) | B2.1 - B2.5 (5) | Preset radii (10, 25, 50, 100 km), dynamic MB calculator, progress bar elements, Cache API `floodsaathi-offline-maps-v1` caching, bounds clamping. |
| **F3** | FloodSaathi SLM AI Model Card | F3.1 - F3.5 (5) | B3.1 - B3.5 (5) | Qwen2.5-0.5B-Instruct Int4 (~340 MB) specs, active status badges, `D:\FloodSaathi_AI\models` target, toggle, fallback to M5 deterministic safety core. |
| **F4** | Python Runtime / Local Engine Card | F4.1 - F4.5 (5) | B4.1 - B4.5 (5) | ~18 MB badge, Runtime Ready status, Pyodide/Web Worker execution engine, probe button, reach lag & wave propagation bridge documentation. |
| **F5** | Regional Language Packs Card | F5.1 - F5.5 (5) | B5.1 - B5.5 (5) | Hindi Devanagari (~3.9 MB), Punjabi Gurmukhi (~4.2 MB), English default, download buttons, bundled offline fonts, mixed script handling. |
| **F6** | GPS Re-sync Button | F6.1 - F6.5 (5) | B6.1 - B6.5 (5) | Location bar button `#btn-resync-gps`, `.spinning` CSS animation, privacy rounding (3 decimals), timeout (10s), profile fallback on permission denial. |
| **F7** | Proximity Telemetry Indicator | F7.1 - F7.5 (5) | B7.1 - B7.5 (5) | Transparent Home banner `#telemetry-proximity-banner`, nearest CWC gauge station (Harike, Kol Dam, RSD), Haversine km math, upstream/downstream orientation. |
| **F8** | AI Storage Root Routing (`D:\FloodSaathi_AI\`) | F8.1 - F8.5 (5) | B8.1 - B8.5 (5) | C: drive capacity preservation, D: drive root standard, `datasets/`, `checkpoints/`, `models/`, `exported/`, CLI `--output_dir` overrides. |
| **F9** | Disaster Guidelines Compiler | F9.1 - F9.5 (5) | B9.1 - B9.5 (5) | NDMA/SDMA/CWC citations, 2.5g bleaching powder per 1000L formula, 10m electrical distance + PSPCL 1912, water crossing refusal (15cm knockdown), verified helplines (112, 1078, 1070, 1077, 108, 1912). |
| **F10** | Qwen 2.5 LoRA & Quantization Exports | F10.1 - F10.5 (5) | B10.1 - B10.5 (5) | LoRA rank r=16, alpha=32, ChatML template, 100% holdout pass rate gate on `eval/must_pass.json`, ONNX Int4 (<350 MB RAM), GGUF Q4_K_M profile, LiteRT manifest. |
| **F11** | Google Translate Settings & Offline Fallback | F11.1 - F11.5 (5) | B11.1 - B11.5 (5) | IndexedDB `settings` object store, `google_translate_api_key` persistence, offline deterministic cards fallback, multi-lingual cards in `cards.json`. |
| **F12** | Automated Test Baseline & Invariants | F12.1 - F12.5 (5) | B12.1 - B12.5 (5) | Baseline validation: unit tests (`node --test app/test/*.test.mjs`), relay tests (`pytest relay/tests`), AST check (`scripts/check_no_mock.py`), SACHET priority, offline never-lower invariant. |

---

## 4. 4-Tier Test Methodology

### Tier 1: Feature Coverage (60 Tests)
- **Requirement**: Minimum 5 test cases per feature (F1 to F12).
- **Scope**: Primary functional paths (happy paths), contract validations, element existence, schema verification, and baseline script executions.
- **Location**: `tests/e2e/tier1_feature_tests.mjs`

### Tier 2: Boundary & Corner Cases (60 Tests)
- **Requirement**: Minimum 5 edge and boundary test cases per feature (F1 to F12).
- **Scope**:
  - Non-standard radii (<10 km, >100 km, 0 km, 500 km)
  - Extreme coordinates (Poles, equator, anti-meridian, out-of-basin points)
  - Storage quota limits and cache miss conditions
  - Long prompts (>1000 chars), unicode emojis, and mixed Gurmukhi/Devanagari scripts
  - Corrupt or empty datasets, missing geolocation API, timeout handling
  - Gauge levels exactly at warning/danger thresholds, stale telemetry (>24h).
- **Location**: `tests/e2e/tier2_boundary_tests.mjs`

### Tier 3: Cross-Feature Interactions (12 Tests)
- **Requirement**: Pairwise and multi-module interaction combinations.
- **Scope**:
  - Language switching while map tile downloading is active.
  - GPS re-sync while viewing Downloads & Plugins view.
  - SLM mode toggling under completely offline network conditions.
  - Google Translate fallback under active Punjabi Gurmukhi regional pack.
  - Proximity telemetry updating when river gauge reaches Danger stage.
  - User observation ("Water reached my street") elevating status while conversing with Ask Saathi.
  - 100 km map tile caching with storage quota checks.
  - Dataset compilation generating valid ChatML prompt tokens for Qwen 2.5 LoRA.
  - Pediatric medical symptoms query in Hindi triggering refusal and ORS guidance.
  - Wave front arrival time bounding using reach speed distributions.
  - Concurrent Cache API deletion and localStorage cleanup.
  - Offline never-lower invariant holding Warning status across stale telemetry refresh.
- **Location**: `tests/e2e/tier3_cross_feature_tests.mjs`

### Tier 4: Real-World Workload Scenarios (5 Tests)
- **Requirement**: Minimum 5 comprehensive, multi-step user workload journeys simulating realistic disaster and field situations.
- **Scope**:
  1. **Scenario 1**: Rural Punjab user in Jalandhar (Taman Village) during active monsoon flood warning (Map Caching -> GPS Re-sync -> Telemetry Inspection -> Tractor Crossing Refusal -> Helpline Dial).
  2. **Scenario 2**: Midnight embankment breach on Ravi River in Amritsar (NDMA SACHET Extreme Alert -> Danger Status Override -> Gurmukhi Power Line Safety -> Verified Shelter Lookup).
  3. **Scenario 3**: Post-flood recovery in Firozpur (Water Receding Tap -> Safe Status -> 2.5g Bleaching Powder Well Chlorination -> Medical Refusal).
  4. **Scenario 4**: Multi-lingual field responder rapid assessment (Hindi Language Switch -> 50 km Radius Selection -> Python Runtime Probe -> Multi-Station Basin Telemetry Sweep -> Helpline Validation).
  5. **Scenario 5**: Complete cold-start device onboarding under airplane mode (Zero Network Start -> Offline Invariant Guard -> Plugin Cards Check -> Offline Deterministic Cards -> Baseline 100% Verification).
- **Location**: `tests/e2e/tier4_real_world_tests.mjs`

---

## 5. Execution Guide

### Run Full Master Suite
```bash
node tests/e2e/run_e2e_tests.mjs
```

### Run Full Master Suite with JSON Machine-Readable Output
```bash
node tests/e2e/run_e2e_tests.mjs --json
```

### Run Individual Tiers
```bash
# Tier 1 only
node --test tests/e2e/tier1_feature_tests.mjs

# Tier 2 only
node --test tests/e2e/tier2_boundary_tests.mjs

# Tier 3 only
node --test tests/e2e/tier3_cross_feature_tests.mjs

# Tier 4 only
node --test tests/e2e/tier4_real_world_tests.mjs
```

### Run Existing Subsystem Test Suites
```bash
# Pure JS frontend tests
node --test app/test/*.test.mjs

# Python relay and model tests
.venv\Scripts\python -m pytest relay/tests

# Zero-mock AST compliance
.venv\Scripts\python scripts/check_no_mock.py
```

---

## 6. Baseline Test Results & Pass Thresholds
- **Pass Threshold**: 100.0% pass rate required for all tiers. Zero failures permitted.
- **Baseline Execution Timestamp**: 2026-10-30T14:48:58Z
- **Baseline Results**:
  - Tier 1: 60 / 60 Passed (100.0%)
  - Tier 2: 60 / 60 Passed (100.0%)
  - Tier 3: 12 / 12 Passed (100.0%)
  - Tier 4: 5 / 5 Passed (100.0%)
  - **Total**: 137 / 137 Passed (100.0%) in 9.07s
