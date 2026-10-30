# Dispatch: Worker M1 Final Polish

## Objective
Apply the exact 3-point storage sanitization and touch target fix requested by Challenger 2 in `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_challenger_m1_iter2_2\handoff.md`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Fixes to Apply
1. In `app/js/map_downloader.js:getDownloadedMapPacks()`:
   Filter out null items:
   `return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p === "object") : [];`
2. In `app/js/map_downloader.js:isCoordinatesCached(lat, lon)`:
   Add finite and positive radius check:
   ```javascript
   if (
     !pack ||
     !Number.isFinite(pack.lat) ||
     !Number.isFinite(pack.lon) ||
     !Number.isFinite(pack.radiusKm) ||
     pack.radiusKm <= 0
   ) continue;
   ```
3. In `app/js/map_downloader.js:checkMapPackStatus(radiusKm, ...)`:
   Ensure `p && typeof p.radiusKm === "number"` before comparing.
4. In `app/js/map_downloader.js:deleteOfflineMapPack(packId)`:
   Ensure `p && p.id !== packId`.
5. In `app/css/main.css`:
   Update `.btn-resync-gps` to have:
   `min-height: var(--touch-target, 48px); min-width: 48px; padding: 8px 12px; display: inline-flex; align-items: center; justify-content: center;`
6. In `app/index.html`:
   Wrap `#toggle-slm-model` and its label in a `<label for="toggle-slm-model">` container with `min-height: 48px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;`.

## Verification Commands
Run:
- `node --test tests/adversarial/m1_challenger_empirical_oracle.mjs` (must pass 8/8)
- `node --test tests/adversarial/m1_stress_challenge.mjs` (must pass 6/6)
- `node --test app/test/*.test.mjs` (must pass 56/56)
- `node tests/e2e/run_e2e_tests.mjs` (must pass 137/137)
- `python scripts/check_no_mock.py` (must pass 0 violations)

Deliver handoff at `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m1_final\handoff.md` and notify parent when complete.


## 2026-10-30T15:27:37Z
[Message] sender=9cc25926-f064-4a11-b0f8-934dad82bf28 priority=MESSAGE_PRIORITY_HIGH
Apply the 6 points from DISPATCH.md in app/js/map_downloader.js, app/css/main.css, and app/index.html.
Run verification commands:
- node --test tests/adversarial/m1_challenger_empirical_oracle.mjs
- node --test tests/adversarial/m1_stress_challenge.mjs
- node --test app/test/*.test.mjs
- node tests/e2e/run_e2e_tests.mjs
- python scripts/check_no_mock.py

Deliver handoff in handoff.md and notify parent when complete.
