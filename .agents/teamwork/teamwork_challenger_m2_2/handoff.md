# Empirical Oracle & Mathematical Verification Report: Milestone 2 (R2)

**Author**: Milestone 2 Challenger 2 (`teamwork_challenger_m2_2`)  
**Role**: Empirical Challenger / Mathematical Critic & Specialist  
**Date**: 2026-10-30  
**Target Milestone**: Milestone 2 (R2 - GPS Re-sync & Telemetry Proximity Indicator)  
**Verdict**: **APPROVE**  

---

## 1. Observation

1. **Test Harness Creation & Execution**:
   - Authored standalone empirical test harness in `tests/adversarial/m2_challenger_oracle.mjs` (310 lines) implementing:
     - Independent Spherical Law of Cosines oracle: $d = R \arccos(\sin\phi_1\sin\phi_2 + \cos\phi_1\cos\phi_2\cos\Delta\lambda)$ with $R = 6371\text{ km}$.
     - 100 pseudorandom coordinate pairs across the Punjab bounding box (lat: $29.5^\circ\text{N}$ to $32.5^\circ\text{N}$, lon: $73.8^\circ\text{E}$ to $76.9^\circ\text{E}$) generated using a deterministic linear congruential generator (seed `20261030`).
     - Hydrologic orientation verification across boundary latitudes ($\text{gauge.lat} > \text{user.lat}$, $\text{gauge.lat} < \text{user.lat}$, $\text{gauge.lat} === \text{user.lat}$, and micro-steps down to $\pm 10^{-12\circ}$).
     - Fuzzing of `haversineDistanceKm` and `findNearestGauge` with non-numeric, `NaN`, `null`, `undefined`, arrays of corrupted objects, extreme coordinates (`1e12`), and `Infinity`.
     - Physical Punjab station nearest resolution using real authoritative telemetry from `app/data/latest/punjab.json`.
     - Output string formatting and sub-kilometer meter resolution verification.
   - Command: `node --test tests/adversarial/m2_challenger_oracle.mjs`:
     ```
     ✔ ORACLE 1.1: Precision comparison across 100 random coordinate pairs in Punjab bounding box (3.1382ms)
     ✔ ORACLE 1.2: Boundary and corner precision of Punjab bounding box (0.455ms)
     ✔ ORACLE 1.3: Zero distance and sub-meter precision (0.2585ms)
     ✔ ORACLE 2.1: Flow direction across boundary latitudes (0.3269ms)
     ✔ ORACLE 2.2: Micro-step orientation stress around epsilon boundaries (0.4351ms)
     ✔ ORACLE 3.1: haversineDistanceKm input fuzzing with invalid types and NaN (0.7703ms)
     ✔ ORACLE 3.2: haversineDistanceKm with extreme and infinity coordinates (0.4044ms)
     ✔ ORACLE 3.3: findNearestGauge input fuzzing with invalid gauge collections (0.7909ms)
     ✔ ORACLE 3.4: findNearestGauge gracefully handles corrupted gauge amidst valid gauges (1.172ms)
     ✔ ORACLE 4.1: Real punjab.json telemetry structure contains authoritative stations (0.5787ms)
     ✔ ORACLE 4.2: Nearest gauge resolution for Pathankot user coordinates (0.3599ms)
     ✔ ORACLE 4.3: Nearest gauge resolution for Jalandhar / Taman user coordinates (0.246ms)
     ✔ ORACLE 4.4: Nearest gauge resolution for Ropar (Rupnagar) user coordinates (0.3395ms)
     ✔ ORACLE 5.1: formatProximityText formatting strings and units (0.41ms)
     ℹ tests 14
     ℹ suites 0
     ℹ pass 14
     ℹ fail 0
     ℹ cancelled 0
     ℹ skipped 0
     ℹ todo 0
     ℹ duration_ms 222.8196
     ```

2. **Core Test Suites Verification**:
   - Command `node --test app/test/*.test.mjs`:
     ```
     ℹ tests 77
     ℹ suites 0
     ℹ pass 77
     ℹ fail 0
     ℹ duration_ms 653.7036
     ```
   - Command `node tests/e2e/run_e2e_tests.mjs`:
     ```
     >> Executing [Tier 1] Feature Coverage (F1-F12)... [PASS] (60/60 passed, 3.16s)
     >> Executing [Tier 2] Boundary & Corner Cases... [PASS] (60/60 passed, 0.48s)
     >> Executing [Tier 3] Cross-Feature Interactions... [PASS] (12/12 passed, 1.34s)
     >> Executing [Tier 4] Real-World Workload Scenarios... [PASS] (5/5 passed, 2.52s)
     TOTAL 4 Tiers Across F1-F12: 137 passed, 0 failed. Pass rate: 100.0%.
     ```
   - Command `python scripts/check_no_mock.py`:
     ```
     check_no_mock: OK
     ```
   - Command `.venv\Scripts\python -m pytest relay/tests`:
     ```
     8 passed in 0.34s
     ```

3. **Implementation Code Observations**:
   - `app/js/main.js` (lines 816–835): `haversineDistanceKm` implements type checking returning `Infinity` on non-numeric or `NaN` inputs, computes geodesic distance with $R = 6371\text{ km}$, and quantizes via `Math.round(R * c * 10) / 10`.
   - `app/js/main.js` (lines 837–850): `findNearestGauge` guards against non-arrays or empty arrays, filters out gauges without valid numeric `lat`/`lon`, and computes `minKm` returning `{ gauge, distanceKm }`.
   - `app/js/main.js` (lines 852–855): `determineFlowDirection(gaugeLat, userLat)` evaluates `gaugeLat >= userLat ? "upstream" : "downstream"`.
   - `app/js/main.js` (lines 857–870): `formatProximityText` renders sub-kilometer distances in meters (`Math.round(distKm * 1000) m`), $\ge 1\text{ km}$ in decimal kilometers, and appends `[GPS Stale / Cached]` when `isStaleGps = true`.

---

## 2. Logic Chain

1. **Haversine vs Spherical Law of Cosines Precision**:
   - Observation 1 demonstrates that across 100 random coordinate pairs spanning the Punjab bounding box, the maximum discrepancy between `haversineDistanceKm` and the independent Spherical Law of Cosines oracle was $0.04997\text{ km}$.
   - Because `haversineDistanceKm` quantizes to 1 decimal place ($0.1\text{ km}$ precision), the maximum rounding deviation from unrounded great-circle distance is strictly bounded by $0.05\text{ km}$.
   - When both formulas are rounded to 1 decimal place, their absolute difference across all 100 pairs is identically $0.0\text{ km}$.
   - Commutativity ($d(A, B) === d(B, A)$) and corner boundary precision across the SW, NW, NE, and SE extremities of Punjab held with zero deviation.

2. **Hydrologic Flow Direction**:
   - Punjab river basins (Ravi, Beas, Sutlej) descend from the Himalayan foothills in the northeast to the southwest plains.
   - For any station located at a higher latitude than the user (`gauge.lat > user.lat`), river water flows toward the user, correctly classified as `"upstream"`.
   - For stations at a lower latitude (`gauge.lat < user.lat`), water flows away from the user, correctly classified as `"downstream"`.
   - At exact boundary equality (`gauge.lat === user.lat`), the function defaults to `"upstream"` per the hydrologic specification. Micro-step tests down to $\pm 10^{-12\circ}$ confirm absolute stability without floating point flips.

3. **Malformed Input Fuzzing & Exception Freedom**:
   - `haversineDistanceKm` was fuzzed with `[NaN, null, undefined, "invalid", {}, [], false, true]`. In all cases, type validation caught the malformed parameters and returned `Infinity` safely without throwing an exception.
   - `findNearestGauge` was fuzzed with `null`, `undefined`, `[]`, strings, numbers, empty objects, and arrays containing invalid gauge items. In all invalid cases, it returned `null` without throwing uncaught exceptions.
   - When given an array containing corrupted items alongside valid stations, `findNearestGauge` ignored the corrupt entries and correctly identified the closest valid station.

4. **Authoritative Punjab Stations Grounding**:
   - `app/data/latest/punjab.json` contains three real CWC/BBMB stations: Harike Barrage ($31.15^\circ\text{N}, 74.95^\circ\text{E}$), Kol Dam ($31.3824^\circ\text{N}, 76.87199^\circ\text{E}$), and Ranjit Sagar Dam ($32.444^\circ\text{N}, 75.734^\circ\text{E}$).
   - Testing user coordinates for Pathankot ($32.268^\circ\text{N}, 75.649^\circ\text{E}$) resolved to Ranjit Sagar Dam at $21.1\text{ km}$ upstream.
   - Testing user coordinates for Jalandhar / Taman ($31.25^\circ\text{N}, 75.35^\circ\text{E}$) resolved to Harike Barrage at $39.6\text{ km}$ downstream.
   - Testing user coordinates for Ropar ($30.966^\circ\text{N}, 76.533^\circ\text{E}$) resolved to Kol Dam at $56.4\text{ km}$ upstream.
   - All station names, river identifications, and coordinates match real physical geography and pass anti-mock verification (`check_no_mock.py`).

---

## 3. Caveats

- **Earth Ellipsoid Flattening**: The implementation utilizes a spherical Earth model with mean radius $R = 6371\text{ km}$. On the WGS-84 ellipsoid, Punjab's geodesic distance differs by less than $0.2\%$, which is well within the hydrologic early-warning operational tolerance ($\pm 0.5\text{ km}$).
- **River Meanders vs Geodesic Distance**: Straight-line great-circle distance provides radial station proximity; actual hydraulic water travel along river meanders is modeled downstream by `reach_speeds` and the `estimator.js` arrival model.

---

## 4. Conclusion

The empirical evidence confirms that Milestone 2 (R2) meets all mathematical precision, hydrologic orientation, exception robustness, and real-data grounding criteria:
1. Haversine distance matches the independent Spherical Law of Cosines oracle within $\le 0.05\text{ km}$ across 100 random coordinate pairs in Punjab.
2. Hydrologic orientation correctly identifies upstream and downstream flows across all boundary latitudes and micro-step boundaries.
3. Malformed input fuzzing produces zero uncaught exceptions with safe fallbacks (`Infinity` and `null`).
4. Physical Punjab stations from `punjab.json` accurately resolve nearest stations for Pathankot, Jalandhar, and Ropar.
5. All 14 oracle tests, 77 unit tests, 137 E2E tests, 8 pytest tests, and zero-mock checks pass 100%.

**Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce the empirical findings:

1. **Adversarial Empirical Oracle Suite**:
   ```powershell
   node --test tests/adversarial/m2_challenger_oracle.mjs
   ```
   *Expected*: 14 passed, 0 failed.

2. **Frontend Unit Test Suite**:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   *Expected*: 77 passed, 0 failed.

3. **Master E2E Opaque-Box Suite**:
   ```powershell
   node tests/e2e/run_e2e_tests.mjs
   ```
   *Expected*: 137 passed across 4 tiers, 0 failed.

4. **Zero-Mock AST Audit**:
   ```powershell
   python scripts/check_no_mock.py
   ```
   *Expected*: `check_no_mock: OK`.

5. **Python Relay Test Suite**:
   ```powershell
   .venv\Scripts\python -m pytest relay/tests
   ```
   *Expected*: 8 passed, 0 failed.
