# BRIEFING — 2026-10-30T15:45:00Z

## Mission
Implement Milestone 2 (R2): GPS Re-sync button with visual feedback and Home view transparent telemetry proximity indicator in FloodSaathi.

## 🔒 My Identity
- Archetype: teamwork_worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m2\
- Original parent: 9cc25926-f064-4a11-b0f8-934dad82bf28
- Milestone: Milestone 2 (R2 - GPS Re-sync & Proximity Telemetry Display)

## 🔒 Key Constraints
- Real data only; zero mock/simulated/synthetic data in product or runtime.
- Vanilla JS ES modules, plain CSS, no frontend frameworks, no bundlers.
- 48px minimum touch target sizing for mobile-first accessibility.
- Node.js native testing via `node --test app/test/*.test.mjs`.
- All verification test suites must pass 100%.

## Current Parent
- Conversation ID: 9cc25926-f064-4a11-b0f8-934dad82bf28
- Updated: not yet

## Task Summary
- **What to build**:
  1. GPS Re-sync button (`#btn-resync-gps`) in `app/js/main.js` with acquiring spinner animation, geolocation retrieval (`enableHighAccuracy: true`, `timeout: 12000`, `maximumAge: 0`), persistence in `store.js` settings, green success feedback ("GPS Synced" for 3s), and red error/stale feedback ("GPS Stale" for 4s with banner update).
  2. Transparent telemetry proximity indicator (`#telemetry-proximity-banner`) on Home view with live Haversine distance calculation to nearest reporting gauge station, upstream/downstream flow direction determination based on Punjab basin geography, stale GPS suffix handling, and live integration into `renderSnapshotData(snapshot)`.
  3. Comprehensive unit test suite in `app/test/downloads_proximity.test.mjs` verifying distance calculations, nearest gauge finding, direction calculation, and GPS stale banner text formatting.
  4. Full verification across all test suites (`node --test`, `e2e`, `check_no_mock`, `pytest`).
- **Success criteria**:
  - GPS re-sync handles permissions, timeouts, success with green feedback, error with red feedback and banner stale marker.
  - Proximity banner calculates real distances from user coordinates to live gauges.
  - All tests in `app/test/*.test.mjs` pass cleanly.
  - E2E tests, check_no_mock, and relay pytest pass with 0 errors.
- **Interface contracts**: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md`
- **Code layout**: `PROJECT.md` § Code Layout

## Key Decisions Made
- Use standard Haversine distance formula with Earth radius $R = 6371\text{ km}$.
- Punjab hydrological flow (Indus basin): rivers flow NE to SW; `gauge.lat >= user.lat` indicates upstream, `<` indicates downstream.
- Export pure calculation helper functions from a clean module or test-accessible export to ensure isolated zero-DOM unit testing.

## Artifact Index
- `app/js/main.js` — GPS re-sync wiring, proximity calculation, and banner updates
- `app/index.html` — Verify `#btn-resync-gps` and `#telemetry-proximity-banner` DOM structure
- `app/css/main.css` — Verify spinning animation and styling for GPS re-sync button and proximity banner
- `app/test/downloads_proximity.test.mjs` — Unit test suite for R2 proximity and GPS re-sync calculations

## Change Tracker
- **Files modified**:
  - `app/js/main.js`: implemented `haversineDistanceKm`, `findNearestGauge`, `determineFlowDirection`, `formatProximityText`, `updateProximityBanner`, `setupGpsResync`, getters/setters, DOM guards for headless testing, restored saved user coordinates from store.
  - `app/css/main.css`: added feedback state styles for `.btn-resync-gps.success`, `.btn-resync-gps.stale`, `.btn-resync-gps:disabled`, and `.telemetry-proximity-banner.stale`.
  - `app/test/downloads_proximity.test.mjs`: authored 21 unit tests covering Haversine distance, nearest gauge resolution, flow direction, string formatting, DOM banner live updates, and GPS re-sync state machine.
- **Build status**: 100% PASS across all suites (77/77 unit tests, 137/137 E2E tests, 8/8 relay pytest, 0 mock violations)
- **Pending issues**: None

## Quality Status
- **Build/test result**: All passing (77 frontend unit tests, 137 E2E master tests, 8 pytest relay tests)
- **Lint status**: Clean (check_no_mock passed with 0 violations)
- **Tests added/modified**: Created `app/test/downloads_proximity.test.mjs` (21 new rigorous behavioral tests)

## Loaded Skills
- None requested in task dispatch.
