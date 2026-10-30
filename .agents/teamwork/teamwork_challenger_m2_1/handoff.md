# Handoff Report: Milestone 2 Adversarial Empirical Challenge (R2)

**Author**: Milestone 2 Challenger 1 (`teamwork_challenger_m2_1`)  
**Role**: EMPIRICAL CHALLENGER (critic, specialist)  
**Date**: 2026-10-30  
**Target Milestone**: R2 (GPS Re-sync Button & Visual Feedback + Home View Transparent Telemetry Proximity Indicator)  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Test Execution Command & Verbatim Failure Output
Authored and executed standalone adversarial test harness `tests/adversarial/m2_challenger_stress.mjs`:
Command:
```powershell
node --test tests/adversarial/m2_challenger_stress.mjs
```

Result:
```
GPS location error (User denied Geolocation prompt). Using saved profile: Taman, Jalandhar
GPS location error (Position unavailable: no satellite or cellular triangulation fix). Using saved profile: Taman, Jalandhar
GPS location error (Geolocation acquisition timed out after 12000ms). Using saved profile: Taman, Jalandhar
Geolocation API is unavailable in this environment. Using saved profile: Taman, Jalandhar
Geolocation API is unavailable in this environment. Using saved profile: Taman, Jalandhar
GPS location error (Timeout). Using saved profile: Taman, Jalandhar
✔ CHALLENGE 1.1: Error code 1 (PERMISSION_DENIED) releases disabled, removes spinner, applies red styling and stale text (3.5176ms)
✔ CHALLENGE 1.2: Error code 2 (POSITION_UNAVAILABLE) releases disabled, removes spinner, applies red styling and stale text (0.7902ms)
✔ CHALLENGE 1.3: Error code 3 (TIMEOUT) releases disabled, removes spinner, applies red styling and stale text (0.8511ms)
✔ CHALLENGE 1.4: Missing navigator.geolocation object entirely: releases disabled, removes spinner, applies red styling and stale text (0.8412ms)
✖ CHALLENGE 1.5: Missing navigator.geolocation when currentSnapshot is null: must still set [GPS Stale / Cached] (1.422ms)
✖ CHALLENGE 2.1: Rapid concurrent clicks during acquiring state: only one acquisition request runs at a time (0.8964ms)
✔ CHALLENGE 2.2: Concurrency lock prevents state corruption across sequential acquisition and error cycles (2.9579ms)
✔ CHALLENGE 3.1: Sub-kilometer distance threshold (< 1.0 km) formats as rounded meters ('0 m', '120 m', '750 m') (0.5058ms)
✔ CHALLENGE 3.2: Distance >= 1.0 km formats with exactly 1 decimal place ('1.0 km', '1.2 km', '38.5 km') (0.3336ms)
✔ CHALLENGE 3.3: Geodesic calculation precision: verify whether haversineDistanceKm preserves sub-km fidelity (0.3678ms)
✔ CHALLENGE 4.1: Flow direction determinism across Punjab latitudinal gradient (0.2138ms)
✔ CHALLENGE 4.2: Robustness against malformed gauge arrays and empty telemetry (0.2354ms)
ℹ tests 12
ℹ suites 0
ℹ pass 10
ℹ fail 2
ℹ duration_ms 188.9381

✖ failing tests:

test at tests\adversarial\m2_challenger_stress.mjs:303:1
✖ CHALLENGE 1.5: Missing navigator.geolocation when currentSnapshot is null: must still set [GPS Stale / Cached] (1.422ms)
  AssertionError [ERR_ASSERTION]: Proximity indicator must show [GPS Stale / Cached] even when currentSnapshot is null; got: ""
      at TestContext.<anonymous> (file:///C:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/tests/adversarial/m2_challenger_stress.mjs:325:12)

test at tests\adversarial\m2_challenger_stress.mjs:338:1
✖ CHALLENGE 2.1: Rapid concurrent clicks during acquiring state: only one acquisition request runs at a time (0.8964ms)
  AssertionError [ERR_ASSERTION]: VULNERABILITY DETECTED: Rapid concurrent clicks triggered 3 concurrent getCurrentPosition requests! Only 1 must run at a time.
  3 !== 1
      at TestContext.<anonymous> (file:///C:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/tests/adversarial/m2_challenger_stress.mjs:377:12)
```

### 1.2 Existing Project Test Suites
1. Frontend unit test suite:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   Output: `77 pass, 0 fail (610ms)`.
2. E2E Master Opaque-Box Suite:
   ```powershell
   node tests/e2e/run_e2e_tests.mjs
   ```
   Output: `137 passed, 0 failed across 4 tiers (7.28s)`.
3. Anti-mock compliance:
   ```powershell
   python scripts/check_no_mock.py
   ```
   Output: `check_no_mock: OK`.
4. Pytest relay suite:
   ```powershell
   .venv\Scripts\python -m pytest relay/tests
   ```
   Output: `8 passed in 0.33s`.

### 1.3 Code Inspection Observations
1. **Concurrency Lock Absence (`app/js/main.js`, lines 894–935)**:
   ```javascript
   export function setupGpsResync() {
     const btn = document.getElementById("btn-resync-gps");
     if (!btn) return;

     let feedbackTimer = null;

     btn.addEventListener("click", () => {
       if (feedbackTimer) {
         clearTimeout(feedbackTimer);
         feedbackTimer = null;
       }

       const label = btn.querySelector("span");

       if (typeof navigator === "undefined" || !navigator.geolocation) {
         ...
         return;
       }

       // Acquiring state: add .spinning class, disable button, set label to "Acquiring..."
       btn.classList.add("spinning");
       btn.classList.remove("success", "stale");
       btn.disabled = true;
       if (label) label.textContent = "Acquiring...";

       const geoOptions = { ... };

       navigator.geolocation.getCurrentPosition(
         async (pos) => { ... },
         (err) => { ... },
         geoOptions
       );
     });
   }
   ```
   There is **no check** of `btn.disabled` or `btn.classList.contains("spinning")` at the beginning of the `click` listener. While `btn.disabled = true` is set on the DOM element, event listeners invoked via rapid touch event synthesis (e.g., queued tap events in mobile webviews prior to DOM repaint), programmatic clicks, or synthetic events re-enter the handler, causing multiple in-flight `navigator.geolocation.getCurrentPosition(...)` calls.

2. **Inconsistent Snapshot Fallback Branch (`app/js/main.js`, lines 908–917 vs 1008–1015)**:
   In the missing geolocation branch (line 915):
   ```javascript
   if (currentSnapshot) {
     updateProximityBanner(currentSnapshot, true);
   }
   // NO else branch when currentSnapshot is null!
   ```
   In the error callback branch (lines 1008–1015):
   ```javascript
   if (currentSnapshot) {
     updateProximityBanner(currentSnapshot, true);
   } else {
     const bannerText = document.getElementById("telemetry-proximity-text");
     if (bannerText) {
       bannerText.textContent = `Your location: ${userProfile.village_name} [GPS Stale / Cached] · Hydrologic telemetry from: CWC Beas Gauge (3.8 km away)`;
     }
   }
   ```
   When `navigator.geolocation` is missing/unavailable on initial boot (before `currentSnapshot` is loaded), line 915 does nothing, leaving `#telemetry-proximity-text` blank without appending `[GPS Stale / Cached]`.

3. **Haversine Pre-Rounding Precision (`app/js/main.js`, line 834)**:
   ```javascript
   export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
     ...
     return Math.round(R * c * 10) / 10;
   }
   ```
   `haversineDistanceKm` rounds to 1 decimal place in km (multiples of 0.1 km = 100 m). Consequently, when `findNearestGauge` passes this distance to `formatProximityText`, sub-kilometer distances are quantized to 100m buckets (e.g., 745 m becomes 700 m, 35 m becomes 0 m), rather than showing continuous meter precision.

---

## 2. Logic Chain

1. **Premise**: In an offline-first emergency PWA operating on mobile hardware (Capacitor/Android), user interaction must be robust against rapid double-taps and network partitions.
2. **From Observation 1.1 & 1.3 (Challenge 2.1)**:
   - When a user double-taps `#btn-resync-gps`, or when click events are queued before DOM property synchronization, the click handler executes for each invocation because `setupGpsResync()` lacks an initial guard:
     `if (btn.disabled || btn.classList.contains("spinning")) return;`
   - In our empirical test harness, dispatching 3 rapid clicks while acquisition was in-flight triggered `navigator.geolocation.getCurrentPosition` 3 times concurrently (`invocationCount = 3 !== 1`).
   - Multiple concurrent geolocation calls create device hardware contention and race conditions where an early timeout or error callback can overwrite a subsequent successful location fix.
3. **From Observation 1.1 & 1.3 (Challenge 1.5)**:
   - When the user launches the app in an offline environment where geolocation is disabled or unsupported, and clicks `#btn-resync-gps` before an initial telemetry snapshot is loaded (`currentSnapshot === null`), line 915 evaluates `if (currentSnapshot)` to `false`.
   - Because no fallback branch exists (unlike line 1010 in the error handler), `#telemetry-proximity-text` is never updated with `[GPS Stale / Cached]`.
   - This violates the PRD safety invariant that stale GPS coordinates must always be explicitly flagged in the proximity indicator.
4. **From Observation 1.3 (Challenge 3.3)**:
   - While `formatProximityText` correctly formats arbitrary sub-kilometer distances (< 1.0 km) in rounded meters (e.g., 0.75 km -> "750 m", 0.12 km -> "120 m", 0 km -> "0 m"), `haversineDistanceKm` quantizes all upstream geodesic distances to 0.1 km increments via `Math.round(R * c * 10) / 10`.
5. **Conclusion from Steps 2–4**:
   Because two empirical tests failed with reproducible race conditions and missing fallback banner updates, the implementation does not meet the necessary robustness threshold for Milestone 2.

---

## 3. Caveats

- In standard desktop Chromium browsers, a natively clicked `<button disabled>` element will generally suppress secondary user mouse clicks at the browser level. However, this relies entirely on browser UI thread state and does not protect against queued touch events in mobile WebViews (Capacitor), keyboard repeats, or synthetic dispatch. A defensive guard in JavaScript is mandatory for high-reliability software.
- The `haversineDistanceKm` 1-decimal rounding is consistent with existing shelters code (`app/js/shelters.js`) and tests, but limits the sub-kilometer telemetry indicator to 100-meter steps.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

The worker must address two specific, easily remediable issues in `app/js/main.js`:

1. **Fix Concurrency / Re-entrancy Lock in `setupGpsResync()`**:
   Add an explicit guard at the very start of the click listener in `app/js/main.js` (line 901):
   ```javascript
   btn.addEventListener("click", () => {
     if (btn.disabled || btn.classList.contains("spinning")) {
       return;
     }
     ...
   ```
2. **Add Missing Fallback Branch in Missing Geolocation Check**:
   In `app/js/main.js` (line 915), update the missing geolocation branch to mirror lines 1008–1015:
   ```javascript
     if (currentSnapshot) {
       updateProximityBanner(currentSnapshot, true);
     } else {
       const bannerText = document.getElementById("telemetry-proximity-text");
       if (bannerText) {
         bannerText.textContent = `Your location: ${userProfile.village_name} [GPS Stale / Cached] · Hydrologic telemetry: Feeds currently offline`;
       }
     }
   ```
3. (Optional / Recommendation): To provide genuine meter-level precision under 1 km, allow `haversineDistanceKm` to return high precision (e.g. `Math.round(R * c * 1000) / 1000`), or document the 100m quantization.

---

## 5. Verification Method

To independently verify the failure modes and validate the fix once applied:

1. **Run Standalone Adversarial Stress Suite**:
   ```powershell
   node --test tests/adversarial/m2_challenger_stress.mjs
   ```
   - *Current Result*: Fails on `CHALLENGE 1.5` and `CHALLENGE 2.1`.
   - *Target Result After Fix*: 12 of 12 tests pass (100%).

2. **Run Existing App Test Suite**:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   - *Expected*: 77 of 77 pass.

3. **Run E2E Master Test Suite**:
   ```powershell
   node tests/e2e/run_e2e_tests.mjs
   ```
   - *Expected*: 137 of 137 pass across 4 tiers.

4. **Run No-Mock Policy Check**:
   ```powershell
   python scripts/check_no_mock.py
   ```
   - *Expected*: `check_no_mock: OK`.
