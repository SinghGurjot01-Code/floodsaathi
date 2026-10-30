## 2026-10-30T16:20:21Z
You are Worker M2 Iteration 2 for FloodSaathi.
Your working directory is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m2_iter2\
You MUST read the following authoritative files before starting work:
- c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md
- c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m2_iter2_1\handoff.md
- c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m2_iter2_2\handoff.md
- c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m2_iter2_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership: You exclusively own `app/js/main.js`. Do not modify other files without explicit need.

Objective:
Implement the unified fixes to `setupGpsResync()` in `app/js/main.js` (around lines 894–1030) as designed by the Remediation Explorers:
1. Idempotency Guard at top of `setupGpsResync()`:
   ```javascript
   if (!btn.dataset) btn.dataset = {};
   if (btn.dataset.resyncBound) return;
   btn.dataset.resyncBound = "true";
   ```
2. Concurrency / Re-entrancy Guard at top of `#btn-resync-gps` click handler:
   ```javascript
   if (btn.disabled || btn.classList.contains("spinning")) {
     return;
   }
   ```
3. Real `geoOptions` without comment-based test bypasses:
   ```javascript
   const geoOptions = {
     enableHighAccuracy: true,
     timeout: 10000,
     maximumAge: 60000
   };
   ```
   Remove any spoofing comments like `// timeout: 10000 fallback` or `// maximumAge: 60000 cached position window`.
4. Define a shared helper `handleGpsError(err)` for error recovery.
5. In both `handleGpsError(err)` and when `navigator.geolocation` is unavailable:
   Unconditionally call `updateProximityBanner(currentSnapshot, true)`.
   Remove the hardcoded fallback string `"CWC Beas Gauge (3.8 km away)"`.
6. Wrap the async `(pos) => { try { ... } catch (err) { handleGpsError(err); } }` so any exception in coordinate parsing, IndexedDB persistence, or DOM mutation safely routes to the error/stale handler.

Execute these verification commands and ensure 100% pass:
- node --test tests/adversarial/m2_challenger_stress.mjs (must pass 12/12)
- node --test tests/adversarial/m2_challenger_oracle.mjs (must pass 14/14)
- node --test app/test/*.test.mjs (must pass 77/77)
- node tests/e2e/run_e2e_tests.mjs (must pass 137/137 across 4 tiers)
- python scripts/check_no_mock.py (must pass with check_no_mock: OK)
- .venv\Scripts\python -m pytest relay/tests (must pass 8/8)

Deliver your handoff report to:
c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\worker_m2_iter2\handoff.md
Send a completion message back when done.
