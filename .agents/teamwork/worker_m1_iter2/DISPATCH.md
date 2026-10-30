# Dispatch: Worker M1 Iteration 2 (Remediation Implementation)

## 2026-10-30T15:05:54Z

## Objective
Implement the complete, genuine, robust remediation for Milestone 1 (Downloads and Plugins Navigation & Management UI, R1) resolving all Forensic Audit INTEGRITY VIOLATION findings, Reviewer findings, and Challenger findings.

## Authoritative Inputs
- Requirements: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Specs: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md`
- Auditor Report: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_auditor_m1\handoff.md`
- Remediation Blueprints:
  - `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m1_iter2_1\report.md`
  - `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m1_iter2_3\report.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Tasks to Implement
1. **Continuous Monotonic Map Size Calculation (`app/js/map_downloader.js`)**:
   - Replace the discrete dictionary and discontinuous area formula with the verified Piecewise Linear Interpolation model:
     Knots: `(0, 0), (10, 12), (25, 28), (50, 65), (100, 140)`, slope 1.5 beyond 100km.
     Returns strictly monotonic values (zero negative jumps across all radii 1..150 km).
     Input sanitization: clamp radius <= 0 to 0 MB, sanitize NaN/undefined/non-numeric inputs to 0 MB (never return NaN).
   - Array guard: in `getDownloadedMapPacks`, check `Array.isArray(parsed)` before returning to prevent TypeError crashes on corrupted localStorage.
   - Genuine map tile caching in `downloadMapPack`: fetch and cache real local vector assets (`./packs/region-amritsar/*`, `./vendor/pmtiles/*`, `./vendor/maplibre-gl/*`) into `floodsaathi-offline-maps-v1` with authentic byte tracking.
2. **Service Worker Cache Eviction Protection (`app/sw.js`)**:
   - In the `activate` event handler, define `PROTECTED_CACHES = new Set([CACHE_NAME, "floodsaathi-offline-maps-v1", "floodsaathi-lang-packs-v1", "floodsaathi-ai-models-v1"])`.
   - Do NOT delete protected user offline caches when the service worker activates or updates.
3. **Atomic Language Pack Verification (`app/js/main.js`)**:
   - In `downloadLangPack`, verify that every asset fetch succeeds (`res.ok`) and is stored in `floodsaathi-lang-packs-v1`.
   - If any asset fetch fails, abort, display clear error feedback, and retain status "Not Downloaded".
   - Only set `lang_pack_${langCode}_downloaded` to `true` when all assets are genuinely verified.
4. **Touch Target Accessibility >= 48px (`app/css/main.css`, `app/index.html`)**:
   - `.btn-plugin-download`: set `min-height: 48px;`.
   - Language pack download buttons: create `.btn-lang-action` with `min-height: 48px; min-width: 48px;` instead of tiny inline padding.
   - Radius pills: ensure `min-height: 48px;` and adequate padding.
   - `#btn-back-from-downloads`: ensure `min-height: 48px;`.
5. **Automated Verification**:
   - Ensure all tests pass:
     `node --test app/test/*.test.mjs`
     `node --test tests/adversarial/m1_stress_challenge.mjs`
     `node tests/e2e/run_e2e_tests.mjs`
     `python scripts/check_no_mock.py`
     `.venv\Scripts\python -m pytest relay/tests`

Deliver handoff at `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m1_iter2\handoff.md` and notify parent when complete.
