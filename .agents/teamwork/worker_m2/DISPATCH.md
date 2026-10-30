# Dispatch: Milestone 2 Worker (GPS Re-sync & Proximity Telemetry Display)

## Objective
Implement R2: GPS re-sync button with visual feedback and Home view transparent telemetry proximity indicator in `app/js/main.js`, `app/index.html`, and `app/css/main.css`.

## Authoritative Inputs
- Requirements: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Specs: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md`
- Frontend Blueprint: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_2\report.md` (Sections 3 & 4)

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks to Implement
1. **GPS Re-sync Button (`#btn-resync-gps`)**:
   - Implement `setupGpsResync()` in `app/js/main.js` and call it on initialization.
   - On click: check `navigator.geolocation`. If unavailable, show notice.
   - Acquiring state: add `.spinning` class, disable button, set label to "Acquiring...".
   - Use `navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 })`.
   - On success: remove `.spinning`, enable button, update `userProfile.lat/lon/accuracy_m/gps_synced_at`. Persist in `store.js` settings (`user_lat`, `user_lon`, `user_gps_synced_at`). Update `#loc-village-name`. Trigger `updateProximityBanner(currentSnapshot)`. Provide green visual feedback ("GPS Synced" in green `#16a34a` for 3 seconds).
   - On error (timeout, permission denied, position unavailable): remove `.spinning`, enable button. Show red visual feedback ("GPS Stale" in red `#ef1c24` for 4 seconds). Update proximity banner with `[GPS Stale / Cached]`.
2. **Transparent Telemetry Proximity Indicator (`#telemetry-proximity-banner`)**:
   - Implement `updateProximityBanner(snapshot, isStaleGps)` in `app/js/main.js`.
   - Calculate genuine Haversine distance from `userProfile.lat/lon` to each gauge in `snapshot.gauges` (`punjab.json`).
   - Find nearest reporting station.
   - Determine flow orientation: if `gauge.lat >= userProfile.lat` -> "upstream", else "downstream".
   - Format: `Your location: ${userProfile.village_name}${gpsSuffix} · Hydrologic telemetry from: ${gaugeName}${riverName} (${distFormatted} ${direction})`.
   - Integrate `updateProximityBanner` into `renderSnapshotData(snapshot)` so proximity updates live whenever telemetry loads or coordinates change.
3. **Unit Tests**:
   - Create `app/test/downloads_proximity.test.mjs` testing Haversine distance, nearest gauge selection, upstream/downstream orientation, and GPS stale banner formatting.
4. **Verification**:
   - Run:
     `node --test app/test/*.test.mjs`
     `node tests/e2e/run_e2e_tests.mjs`
     `python scripts/check_no_mock.py`
     `.venv\Scripts\python -m pytest relay/tests`


## 2026-10-30T15:43:47Z
You are Milestone 2 Worker (teamwork_worker).
Your working directory is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m2\
Your DISPATCH file is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m2\DISPATCH.md
The authoritative original request is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md
The project scope is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md
The blueprint is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_2\report.md (Sections 3 & 4)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement R2: GPS Re-sync button with visual feedback and Home view transparent telemetry proximity indicator.
Files you own:
- app/js/main.js
- app/index.html
- app/css/main.css
- app/test/downloads_proximity.test.mjs

Execute verification tests:
- node --test app/test/*.test.mjs
- node tests/e2e/run_e2e_tests.mjs
- python scripts/check_no_mock.py
- .venv\Scripts\python -m pytest relay/tests

Deliver your handoff in handoff.md and notify parent when complete.
