## 2026-10-30T14:15:52Z
Sender: df6f2f94-a0fb-4239-a733-26618858c606
Content:
Build a production-ready Downloads & Plugins interface for offline maps, AI model, Python runtime, and regional language packs, implement GPS re-sync and telemetry proximity indicators, and establish the local AI model training and data ingestion pipeline for FloodSaathi.

Working directory: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi
Integrity mode: development

## Requirements

### R1. Downloads and Plugins Navigation and Management UI
Add a "Downloads" / "Plugins & Packs" tab (`downloads`) to both the desktop header navigation (`.desktop-nav`) and mobile navigation in the FloodSaathi web application. The tab must display four plugin/pack cards:
1. Offline Map Pack (Recommended): Allows user to select an area radius (10 km, 25 km, 50 km, 100 km), displays a dynamic download size calculator (e.g. 12 MB, 28 MB, 65 MB, 140 MB), provides a download progress bar, and caches map tiles locally via IndexedDB or Cache API.
2. FloodSaathi SLM AI Model: Qwen2.5-0.5B-Instruct Int4 (~340 MB) card featuring a download/active status indicator, toggle, and connection hook for future model endpoint integration.
3. Python Runtime / Local Engine: Card displaying local execution engine status with download and installation guidance.
4. Regional Language Packs (Recommended): Hindi Pack (~4 MB) and Punjabi Gurmukhi Pack (~4 MB) with download and active status badges; English remains the built-in default.

### R2. GPS Re-sync and Proximity Telemetry Display
Add a GPS re-sync button providing visual feedback when geolocation fails, is unavailable, or is stale. Display a transparent telemetry proximity indicator on the Home view showing the user's current or selected location alongside the nearest hydrologic reporting station and distance (e.g., "Your location: Taman, Jalandhar · Hydrologic telemetry from: CWC Beas Gauge (3.8 km upstream)").

### R3. AI Model Ingestion and Fine-Tuning Pipeline
Root all AI datasets, checkpoints, cache, and exported artifacts in `D:\FloodSaathi_AI\`. Build dataset compilation and crawler scripts for verified disaster guidelines (NDMA SOPs, Punjab SDMA manuals, CWC gauge warning/danger levels, Punjab Health well-chlorination formulas: 2.5g bleaching powder per 1000L, PSPCL 1912 electrical safety, helplines 112/1078/1070, and verified shelters). Fine-tune Qwen 2.5 LoRA, export to ONNX Int4 and GGUF formats, and integrate a Google Translate API key configuration option in settings for enhanced online translation into Punjabi/Hindi with offline deterministic cards fallback.

### R4. Architectural and Verification Standards
Maintain the vanilla JS ES module and plain CSS architecture with no external bundlers or frontend frameworks. Strictly follow the no-mock-data rule: no simulated, sample, or synthetic data in production runtime or relay. Existing automated test suites (`node --test app/test/*.test.mjs`, `pytest relay/tests`, and `python scripts/check_no_mock.py`) must pass 100%.

## Acceptance Criteria

### UI & Navigation
- [ ] "Downloads" tab is accessible from both desktop header nav and mobile navigation.
- [ ] Offline Map Pack card dynamically computes and displays estimated download size for 10 km, 25 km, 50 km, and 100 km radii.
- [ ] Offline Map Pack initiates tile download with a visible progress indicator and caches to local storage.
- [ ] SLM AI Model and Python runtime cards render with accurate download and active status indicators.
- [ ] Hindi and Punjabi Gurmukhi language pack cards render with download status and active badges.
- [ ] GPS re-sync button triggers geolocation refresh with visual feedback.
- [ ] Home view shows the transparent proximity indicator with user location and nearest gauge telemetry distance.

### Pipeline & Storage
- [ ] AI data ingestion, fine-tuning scripts, and exports save artifacts strictly under `D:\FloodSaathi_AI\`.
- [ ] Disaster guideline crawler/compiler extracts verified guidelines into structured dataset files.
- [ ] Fine-tune script executes LoRA adaptation on Qwen 2.5 and outputs ONNX Int4 and GGUF formats.
- [ ] Google Translate API key configuration persists in settings and falls back to offline deterministic cards when offline or unset.
- [ ] Automated verification test suite compiles and checks key guideline outputs against ingested NDMA/Punjab SDMA reference data.

### Automated Verification
- [ ] `node --test app/test/*.test.mjs` passes with zero failures.
- [ ] `pytest relay/tests` passes with zero failures.
- [ ] `python scripts/check_no_mock.py` passes with zero violations.
