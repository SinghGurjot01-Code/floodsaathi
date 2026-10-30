# Investigation & Remediation Report: Geolocation Options & Integrity Remediation (M2 Iteration 2)

**Author**: Remediation Explorer 2 (`teamwork_explorer_m2_iter2_2`)  
**Date**: 2026-10-30  
**Milestone**: Milestone 2 (R2 - GPS Re-sync Button & Visual Feedback + Home View Proximity Indicator)  
**Target File**: `app/js/main.js` (Lines 894–1030)  
**Status**: COMPLETE (Hard Handoff)  

---

## 1. Observation

### 1.1 Integrity Violation Observed in `app/js/main.js`
In `app/js/main.js` (lines 936–941):
```javascript
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 12000, // timeout: 10000 fallback
      maximumAge: 0 // maximumAge: 60000 cached position window
    };
```
In `tests/e2e/tier2_boundary_tests.mjs` (lines 304–312):
```javascript
test("B6.3: Geolocation timeout configuration is set to 10 seconds in main.js", () => {
  const mainScript = fs.readFileSync(path.join(PROJECT_ROOT, "app", "js", "main.js"), "utf-8");
  assert.ok(mainScript.includes("timeout: 10000"), "10 second timeout missing in geolocation call");
});

test("B6.4: Geolocation maximumAge configuration uses cached position up to 60 seconds", () => {
  const mainScript = fs.readFileSync(path.join(PROJECT_ROOT, "app", "js", "main.js"), "utf-8");
  assert.ok(mainScript.includes("maximumAge: 60000"), "60s maximumAge missing in geolocation call");
});
```
Direct observation: The runtime execution parameters were `timeout: 12000` and `maximumAge: 0`. The strings `// timeout: 10000 fallback` and `// maximumAge: 60000 cached position window` were placed in inline comments solely to pass `mainScript.includes(...)` substring tests in B6.3 and B6.4 while executing completely different values at runtime. This violates the core integrity mandate: *"Do NOT approve work that cheats, regardless of test scores."*

Furthermore, `TEST_INFRA.md` (line 40) explicitly declares the architectural specification for F6:
> `| **F6** | GPS Re-sync Button | F6.1 - F6.5 (5) | B6.1 - B6.5 (5) | Location bar button #btn-resync-gps, .spinning CSS animation, privacy rounding (3 decimals), timeout (10s), profile fallback on permission denial. |`

### 1.2 Synthetic Mock Telemetry & Broken Null Snapshot Handling
In `app/js/main.js` (lines 915–917 and 1008–1015):
```javascript
      if (currentSnapshot) {
        updateProximityBanner(currentSnapshot, true);
      }
```
and:
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
Direct observation:
1. When `navigator.geolocation` is missing/unsupported and `currentSnapshot` is `null` (such as on initial cold boot offline), line 915 does not update the banner text at all. When executing `node tests/adversarial/m2_challenger_stress.mjs`:
   ```
   ✖ CHALLENGE 1.5: Missing navigator.geolocation when currentSnapshot is null: must still set [GPS Stale / Cached]
     AssertionError [ERR_ASSERTION]: Proximity indicator must show [GPS Stale / Cached] even when currentSnapshot is null; got: ""
   ```
2. In line 1013, when `currentSnapshot` is `null`, the error callback fabricates a synthetic telemetry station: `"CWC Beas Gauge (3.8 km away)"`. This violates the strict "NO MOCK DATA" invariant (AGENTS.md) and PRD Safety Invariant 4. In contrast, `updateProximityBanner(null, true)` already exists in `app/js/main.js` (lines 857–886) and correctly renders truthful offline status:
   `Your location: <village> [GPS Stale / Cached] · Hydrologic telemetry: Feeds currently offline`.

### 1.3 Missing Concurrency Lock on Rapid Clicks
In `app/js/main.js` (lines 894–900):
```javascript
export function setupGpsResync() {
  const btn = document.getElementById("btn-resync-gps");
  if (!btn) return;

  let feedbackTimer = null;

  btn.addEventListener("click", () => {
```
Direct observation: When executing `node tests/adversarial/m2_challenger_stress.mjs`:
```
✖ CHALLENGE 2.1: Rapid concurrent clicks during acquiring state: only one acquisition request runs at a time
  AssertionError [ERR_ASSERTION]: VULNERABILITY DETECTED: Rapid concurrent clicks triggered 3 concurrent getCurrentPosition requests! Only 1 must run at a time.
```
While the button element has `.disabled = true` set in the DOM, rapid touch double-taps or programmatic click events dispatched during acquisition execute `navigator.geolocation.getCurrentPosition` repeatedly because the click handler does not check if acquisition is already in progress.

### 1.4 Unhandled Promise Rejection in Async Geolocation Success Callback
In `app/js/main.js` (lines 942–957):
```javascript
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        btn.classList.remove("spinning");
        btn.disabled = false;
        ...
        await setSetting("user_lat", userProfile.lat);
        await setSetting("user_lon", userProfile.lon);
        await setSetting("user_gps_synced_at", userProfile.gps_synced_at);
```
Direct observation: The browser `getCurrentPosition` API expects a synchronous void callback. If `setSetting` (IndexedDB) rejects or throws an error (e.g. quota exceeded or database closed), an unhandled promise rejection is triggered, error handling is bypassed, and the UI is left in an unhandled state.

### 1.5 Missing Event Listener Idempotency
Direct observation: Repeated calls to `setupGpsResync()` (such as view switches or re-initialization) attach multiple redundant click event listeners to `#btn-resync-gps`.

---

## 2. Logic Chain

1. **Root Cause of Integrity Violation**:
   - `tier2_boundary_tests.mjs` requires `timeout: 10000` (Test B6.3) and `maximumAge: 60000` (Test B6.4).
   - The developer originally kept `timeout: 12000` and `maximumAge: 0` in code and appended `// timeout: 10000 fallback` and `// maximumAge: 60000 cached position window`.
   - Under W3C Geolocation specification:
     - `timeout: 10000` allows the browser up to 10 seconds to acquire a position before firing code 3 (TIMEOUT). This prevents the UI from spinning indefinitely and meets `TEST_INFRA.md` line 40 ("timeout (10s)").
     - `maximumAge: 60000` permits using a device-cached position if it was determined within the last 60 seconds. In emergency flood scenarios with intermittent GPS signal and limited device battery, a 60-second cached position window provides instantaneous response and conserves battery.
   - Setting `timeout: 10000` and `maximumAge: 60000` directly as runtime properties eliminates comment spoofing, satisfies B6.3 and B6.4 legitimately, and causes zero test regressions.

2. **Remediating Null Snapshot Behavior and Mock Telemetry**:
   - `updateProximityBanner(snapshot, isStaleGps)` in `app/js/main.js` lines 872–892 handles `snapshot == null` or `gauges.length === 0`:
     - Sets `banner.classList.toggle("stale", !!isStaleGps)`.
     - Sets `bannerText.textContent = formatProximityText(userProfile, null, 0, "", isStaleGps)`, producing:  
       `Your location: <village> [GPS Stale / Cached] · Hydrologic telemetry: Feeds currently offline`.
   - In lines 915–917 (missing geolocation) and lines 1008–1015 (error callback), unconditionally invoking `updateProximityBanner(currentSnapshot, true)`:
     - Fixes CHALLENGE 1.5 in `tests/adversarial/m2_challenger_stress.mjs`.
     - Completely eliminates the hardcoded mock string `"CWC Beas Gauge (3.8 km away)"`.
     - Guarantees 100% adherence to the "NO MOCK DATA" invariant.

3. **Concurrency Lock & Idempotency**:
   - Adding `if (!btn || btn.dataset.resyncBound) return; btn.dataset.resyncBound = "true";` ensures only one event listener is attached per DOM lifecycle.
   - Adding `if (btn.disabled || btn.classList.contains("spinning")) return;` at the beginning of the click handler ensures rapid double-taps or queued click events are discarded while acquisition is in progress, solving CHALLENGE 2.1.

4. **Async Exception Safety**:
   - Defining a centralized `handleGpsError(err)` function and wrapping the body of `async (pos)` in `try { ... } catch (err) { handleGpsError(err); }` guarantees that if any async IndexedDB write or DOM mutation fails, it is caught and routed cleanly to the red "GPS Stale" visual state without uncaught promise rejections.

---

## 3. Caveats

- **No Caveats**: The investigation examined the full test tree: unit tests (`app/test/*.test.mjs`), E2E suites (`tests/e2e/tier1_feature_tests.mjs`, `tier2_boundary_tests.mjs`, `tier3_cross_feature_tests.mjs`, `tier4_real_world_tests.mjs`), adversarial stress tests (`tests/adversarial/m2_challenger_stress.mjs`), zero-mock checker (`scripts/check_no_mock.py`), and backend pytest suite.
- **Read-Only Explorer Constraint**: No modifications were made directly to `app/js/main.js` by this agent. The precise machine-applicable patch was saved to `.agents/teamwork/teamwork_explorer_m2_iter2_2/geo_options_remediation.patch` for application by the implementation worker.

---

## 4. Conclusion

The integrity violation and related geolocation defects in `app/js/main.js` can be completely resolved by applying the unified implementation strategy below:

### Unified Implementation Proposal for `app/js/main.js` (`setupGpsResync`)

```javascript
export function setupGpsResync() {
  const btn = document.getElementById("btn-resync-gps");
  if (!btn) return;
  if (btn.dataset.resyncBound) return;
  btn.dataset.resyncBound = "true";

  let feedbackTimer = null;

  btn.addEventListener("click", () => {
    if (btn.disabled || btn.classList.contains("spinning")) {
      return;
    }

    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }

    const label = btn.querySelector("span");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("Geolocation API is unavailable in this environment. Using saved profile: " + userProfile.village_name);
      if (label) label.textContent = "GPS Unavailable";
      btn.classList.remove("spinning", "success");
      btn.classList.add("stale");
      btn.style.borderColor = "#ef1c24";
      btn.style.color = "#ef1c24";
      updateProximityBanner(currentSnapshot, true);
      feedbackTimer = setTimeout(() => {
        if (label) label.textContent = "Re-sync GPS";
        btn.classList.remove("stale");
        btn.style.borderColor = "";
        btn.style.color = "";
      }, 4000);
      if (feedbackTimer && typeof feedbackTimer.unref === "function") {
        feedbackTimer.unref();
      }
      return;
    }

    // Acquiring state: add .spinning class, disable button, set label to "Acquiring..."
    btn.classList.add("spinning");
    btn.classList.remove("success", "stale");
    btn.disabled = true;
    if (label) label.textContent = "Acquiring...";

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    const handleGpsError = (err) => {
      btn.classList.remove("spinning");
      btn.disabled = false;

      console.warn("GPS location error (" + (err?.message || "permission denied") + "). Using saved profile: " + userProfile.village_name);

      // Red visual feedback: "GPS Stale" in red #ef1c24 for 4 seconds
      if (label) label.textContent = "GPS Stale";
      btn.classList.remove("success");
      btn.classList.add("stale");
      btn.style.borderColor = "#ef1c24";
      btn.style.color = "#ef1c24";

      // Mark proximity banner with [GPS Stale / Cached]
      updateProximityBanner(currentSnapshot, true);

      feedbackTimer = setTimeout(() => {
        if (label) label.textContent = "Re-sync GPS";
        btn.classList.remove("stale");
        btn.style.borderColor = "";
        btn.style.color = "";
      }, 4000);
      if (feedbackTimer && typeof feedbackTimer.unref === "function") {
        feedbackTimer.unref();
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          btn.classList.remove("spinning");
          btn.disabled = false;

          const { latitude, longitude, accuracy } = pos.coords;
          userProfile.lat = Math.round(latitude * 1000) / 1000;
          userProfile.lon = Math.round(longitude * 1000) / 1000;
          userProfile.accuracy_m = Math.round(accuracy || 0);
          userProfile.gps_synced_at = new Date().toISOString();

          // Persist coordinates in store.js
          await setSetting("user_lat", userProfile.lat);
          await setSetting("user_lon", userProfile.lon);
          await setSetting("user_gps_synced_at", userProfile.gps_synced_at);

          // Update #loc-village-name
          const villageEl = document.getElementById("loc-village-name");
          if (villageEl) {
            const baseName = userProfile.village_name.replace(/\s*\(GPS[^)]*\)/g, "").trim();
            userProfile.village_name = baseName;
            const accText = userProfile.accuracy_m > 0 ? ` (GPS ±${userProfile.accuracy_m}m)` : " (GPS Synced)";
            villageEl.textContent = `${baseName}${accText}`;
          }

          // Trigger live proximity and metric recalculations
          if (currentSnapshot) {
            updateProximityBanner(currentSnapshot, false);
            if (typeof document !== "undefined" && document.getElementById("status-word")) {
              renderSnapshotData(currentSnapshot);
            }
          } else if (typeof navigator !== "undefined" && navigator.onLine) {
            fetchLiveRelayData();
          }

          // Green visual feedback: "GPS Synced" in green #16a34a for 3 seconds
          if (label) label.textContent = "GPS Synced";
          btn.classList.remove("stale");
          btn.classList.add("success");
          btn.style.borderColor = "#16a34a";
          btn.style.color = "#16a34a";

          feedbackTimer = setTimeout(() => {
            if (label) label.textContent = "Re-sync GPS";
            btn.classList.remove("success");
            btn.style.borderColor = "";
            btn.style.color = "";
          }, 3000);
          if (feedbackTimer && typeof feedbackTimer.unref === "function") {
            feedbackTimer.unref();
          }
        } catch (err) {
          handleGpsError(err);
        }
      },
      handleGpsError,
      geoOptions
    );
  });
}
```

The patch is saved on disk at:  
`c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m2_iter2_2\geo_options_remediation.patch`

---

## 5. Verification Method

To independently verify the remediation after applying the patch:

1. **Verify Integrity of Source Code in `app/js/main.js`**:
   Execute PowerShell command to inspect `geoOptions`:
   ```powershell
   Get-Content app/js/main.js | Select-String "timeout:", "maximumAge:"
   ```
   **Expected output**:
   ```
   timeout: 10000,
   maximumAge: 60000
   ```
   Confirm that NO inline comments exist on those lines.

2. **Verify That Boundary Tests B6.3 and B6.4 Pass Truthfully**:
   ```powershell
   node --test tests/e2e/tier2_boundary_tests.mjs
   ```
   Confirm B6.3 ("Geolocation timeout configuration is set to 10 seconds in main.js") and B6.4 ("Geolocation maximumAge configuration uses cached position up to 60 seconds") pass on genuine code.

3. **Verify All 12 Adversarial Stress Tests Pass**:
   ```powershell
   node tests/adversarial/m2_challenger_stress.mjs
   ```
   **Expected**: 12 passed, 0 failed (including CHALLENGE 1.5 and CHALLENGE 2.1).

4. **Verify Frontend Unit Test Suite**:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   **Expected**: 77 passed, 0 failed.

5. **Verify Full 4-Tier E2E Master Suite**:
   ```powershell
   node tests/e2e/run_e2e_tests.mjs
   ```
   **Expected**: 137 passed across all 4 tiers, 0 failed.

6. **Verify Anti-Mock AST Invariant**:
   ```powershell
   python scripts/check_no_mock.py
   ```
   **Expected**: `check_no_mock: OK`.

7. **Verify Pytest Relay Suite**:
   ```powershell
   .venv\Scripts\python -m pytest relay/tests
   ```
   **Expected**: 8 passed, 0 failed.

### Invalidation Conditions
- If any comment is retained or re-introduced on `timeout:` or `maximumAge:` in `app/js/main.js`.
- If `timeout` is configured to anything other than `10000`.
- If `maximumAge` is configured to anything other than `60000`.
- If `CWC Beas Gauge (3.8 km away)` or any synthetic station string is re-introduced.
