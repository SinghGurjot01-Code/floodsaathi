# Dispatch: Milestone 1 Worker (Downloads & Plugins UI)

## Objective
Implement R1: Production-ready Downloads & Plugins interface in the FloodSaathi web application.

## Authoritative Inputs
- Requirements: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Specs: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md`
- Frontend Blueprint: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_2\report.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Scope of Work (R1)
1. **Navigation**:
   - Add the "Downloads" tab to mobile navigation (`.nav-tab-bar`) in `app/index.html` alongside existing tabs, keeping touch targets >= 48px.
   - Wire navigation buttons (`#nav-to-downloads`, `#btn-back-from-downloads`, `.nav-tab-btn[data-tab="downloads"]`) in `setupNavigation()` and `switchTab("downloads")` in `app/js/main.js`.
2. **Downloads View (`#view-downloads`)**:
   - Render the complete `#view-downloads` DOM in `app/index.html` with the 4 plugin cards matching the CSS classes in `app/css/main.css`.
3. **Card 1: Offline Map Pack (Recommended)**:
   - Area radius selector (10 km, 25 km, 50 km, 100 km).
   - Dynamic download size calculator in `app/js/map_downloader.js`: 10 km -> 12 MB, 25 km -> 28 MB, 50 km -> 65 MB, 100 km -> 140 MB.
   - Download progress bar with percentage readout.
   - Caching in Cache API (`floodsaathi-offline-maps-v1`).
4. **Card 2: FloodSaathi SLM AI Model**:
   - Qwen2.5-0.5B-Instruct Int4 (~340 MB) card.
   - Download/active status badges.
   - On/Off toggle wired to `aiAssistant.setMode("webgpu_slm" / "deterministic_m5")` and saved in `store.js` settings.
   - WebGPU detection indicator and connection hook.
5. **Card 3: Python Runtime / Local Engine**:
   - Local engine status card with connection probe (`http://127.0.0.1:8000/health`) and installation/run guidance for local relay.
6. **Card 4: Regional Language Packs (Recommended)**:
   - Hindi Pack (~4 MB) and Punjabi Gurmukhi Pack (~4 MB) with download buttons, Cache API caching (`floodsaathi-lang-packs-v1`), and active badges synced with current language. English remains built-in default.
7. **Unit Tests**:
   - Create `app/test/downloads.test.mjs` verifying map size calculations, radius selection, SLM mode toggling, and language pack manifests.

## File Ownership
You exclusively own:
- `app/index.html`
- `app/js/map_downloader.js`
- `app/js/main.js` (downloads navigation & card wiring)
- `app/test/downloads.test.mjs`

## Verification Requirements
You MUST run the following commands and include full output in your report:
1. `node --test app/test/*.test.mjs` (must pass 100%)
2. `python scripts/check_no_mock.py` (must pass with 0 violations)
3. `.venv\Scripts\python -m pytest relay/tests` (must pass 100%)

Deliver handoff at `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m1\handoff.md`.

## 2026-10-30T14:29:02Z
You are Milestone 1 Worker (teamwork_worker).
Your working directory is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m1\
Your DISPATCH file is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m1\DISPATCH.md
The authoritative original request is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md
The project scope is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md
The frontend survey report is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_2\report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement R1: Downloads and Plugins Navigation and Management UI.
Files you own:
- app/index.html
- app/js/map_downloader.js
- app/js/main.js (downloads routing & card handlers)
- app/test/downloads.test.mjs

Execute verification tests:
1. `node --test app/test/*.test.mjs`
2. `python scripts/check_no_mock.py`
3. `.venv\Scripts\python -m pytest relay/tests`

Deliver your progress in `.agents/teamwork/worker_m1/progress.md` and complete handoff at `.agents/teamwork/worker_m1/handoff.md`.
Notify parent when complete.

