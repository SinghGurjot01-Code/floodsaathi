# FloodSaathi: Scientific and Safety Audit

**Date:** 2026-10-30  
**Status:** Completed Phase 1 Audit  
**Author:** FloodSaathi Engineering & Scientific Safety Review

---

## Executive Summary

A comprehensive line-by-line scientific, mathematical, and safety audit was performed across the FloodSaathi codebase, specifications (`docs/PRD.md`), data contracts (`schemas/`), logic modules (`app/js/`), relay pipelines (`relay/`), and test suites.

This audit confirmed four critical failure modes in the baseline design that jeopardize user safety and physical fidelity:
1. **Silent "SAFE" Default on Failure / Missing Data**: When live data fails to load, is corrupted, or has no gauges, the status engine falls through to `Safe`, telling users they are safe when flooding could be actively underway.
2. **HAND Vertical Datum Reference Mismatch**: The inundation formulas subtract channel-relative HAND from bank-relative stage ($\Delta h - \text{HAND}$), conflating the channel bed with the river bank and creating massive vertical elevation errors.
3. **Unused Hydraulic Celerity Claim ($c_k = \frac{5}{3}v$)**: Theoretical wide-rectangular wave celerity was claimed in documentation/responses while the actual pipeline relies strictly on empirical travel-time lags.
4. **Temporal Data Leakage in Model Evaluation**: PRD Section 13 specified "Train to 2024; test Aug–Sep 2025 + 2023 peaks", which trains on 2023 flood data and evaluates on the same 2023 events.

---

## Detailed Audit Findings

### Issue 1: Status Logic Fallback to `Safe` on Missing, Loading, or Stale Data
- **Severity:** Critical (P0 Safety Invariant Violation)
- **Status:** Confirmed in Code & PRD
- **Affected Files & Line Evidence:**
  - [`docs/PRD.md:280`](file:///c:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/docs/PRD.md#L280): `- Safe: otherwise.`
  - [`app/js/status.js:190-198`](file:///c:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/app/js/status.js#L190-L198):
    ```javascript
    // 4. Safe
    if (groundIsSafe) {
      reasons.push("Water likely to stay below your ground level.");
    } else {
      reasons.push("River levels are normal; no active warnings.");
    }
    return { status: "Safe", reasons, triggeringGauge };
    ```
  - [`app/index.html:43`](file:///c:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/app/index.html#L43): Initial static HTML renders `<div class="status-card safe" id="status-card">` with "Safe".
  - [`schemas/snapshot.v1.schema.json:178-183`](file:///c:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/schemas/snapshot.v1.schema.json#L178-L183): Status enum permits only `["Safe", "Watch", "Warning", "Danger"]`.
- **Scientific & Engineering Explanation:**
  In safety-critical warning systems, the absence of evidence is not evidence of absence. If cellular connectivity drops before the first fetch, if the relay endpoint returns an HTTP 500 error, if gauges array is empty, or if sensor telemetry is unmeasured (`-1.0`), the system evaluates 0 conditions as Danger, 0 as Warning, 0 as Watch, and falls through to `Safe`. A user standing in floodwaters who opens the app with no connectivity would be told "Safe: River levels are normal; no active warnings."
- **Proposed Fix:**
  Introduce explicit discrete states: `LOADING`, `UNKNOWN`, `DATA_UNAVAILABLE`, `WATCH`, `WARNING`, `DANGER`, `SAFE`. Enforce that `SAFE` is mathematically and logically unreachable unless:
  1. Dynamic inputs (gauges, rainfall, official alerts) meet strict freshness thresholds (<24h).
  2. Static inputs (village record, region pack, schema version) are verified and present.
  3. All evaluation rules completed with verified telemetry.
  If inputs are missing, stale, or loading, status MUST return `UNKNOWN` or `DATA_UNAVAILABLE`, never `SAFE`.
- **Verification Method:**
  Automated unit test suite asserting `computeRawStatus` returns `DATA_UNAVAILABLE` on empty gauges/alerts, `UNKNOWN` on unverified records, and `LOADING` while initial fetch is pending.

---

### Issue 2: Vertical Datum Frame Mismatch in HAND Inundation & Ground Check
- **Severity:** High (P1 Scientific Physics Inconsistency)
- **Status:** Confirmed in Code & PRD
- **Affected Files & Line Evidence:**
  - [`docs/PRD.md:400`](file:///c:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/docs/PRD.md#L400): `stage_depth: for stages h = 0, 0.5, 1, 1.5, 2, 3, 4 m above bank, depth at village = max(0, h − hand_m).`
  - [`app/js/estimator.js:199-206`](file:///c:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/app/js/estimator.js#L199-L206):
    ```javascript
    if (effectiveBankM !== null && village && village.hand_m !== null && village.hand_m !== undefined) {
      const rise = projectedLevel - effectiveBankM;
      if (rise < village.hand_m) {
        groundCheck = "likely_below_ground";
      } else {
        groundCheck = "potential_inundation";
      }
    }
    ```
- **Scientific & Engineering Explanation:**
  Height Above Nearest Drainage ($\text{HAND}$) is defined relative to the *channel bed* of the nearest drainage cell:
  $$\text{HAND}(x,y) = z_{\text{DEM}}(x,y) - z_{\text{channel\_bed}}$$
  In contrast, river flood stages in PRD 10.3 are defined as $h_{\text{above\_bank}}$ (height of water above river bank).
  If a channel has a bank height $H_{\text{bank}} = 4.0\text{ m}$ above the bed, and a village has $\text{HAND} = 5.0\text{ m}$ (1 m higher than the bank):
  - When water rises $h = 2.0\text{ m}$ above the bank, the water surface above channel bed is $4.0 + 2.0 = 6.0\text{ m}$.
  - The true physical water depth at the village is $6.0 - 5.0 = 1.0\text{ m}$.
  - But using $\max(0, h - \text{HAND}) = \max(0, 2.0 - 5.0) = 0\text{ m}$ falsely predicts **zero inundation** when the village is actually submerged in 1 meter of water!
  Similarly, in `estimator.js`, `projectedLevel` is in the gauge's local datum, while `village.hand_m` is derived from Copernicus GLO-30 DEM. Subtracting them directly without datum normalization yields arbitrary numbers.
- **Proposed Fix:**
  Unify the vertical reference system explicitly. Define and track:
  - $z_{\text{ground}}$: Village surface elevation in EGM2008 / GLO-30 datum.
  - $z_{\text{channel\_bed}}$: Drainage channel elevation in EGM2008 datum.
  - $H_{\text{bank}}$: River bank height above channel bed ($z_{\text{bank}} - z_{\text{channel\_bed}}$).
  - $h_{\text{above\_bank}}$: Gauge stage above bank level.
  The consistent depth formula must be:
  $$\text{depth} = \max\left(0, (h_{\text{above\_bank}} + H_{\text{bank}}) - \text{HAND}\right) \equiv \max\left(0, z_{\text{water\_surface}} - z_{\text{ground}}\right)$$
  Update `stage_depth` generation, ground checks in `estimator.js`, and bump schema contracts.
- **Verification Method:**
  Synthetic and real cross-section test vectors validating known benchmarks: where water surface elevation exceeds ground elevation, inundation depth matches $(z_{\text{water}} - z_{\text{ground}})$ exactly.

---

### Issue 3: Inaccurate Documentation / UI Claim of Hydraulic Celerity ($c_k = \frac{5}{3}v$)
- **Severity:** Medium (P2 Scientific Rigor)
- **Status:** Confirmed in Documentation
- **Affected Files & Line Evidence:**
  - Explanatory text and architectural briefs asserting flood wave propagation follows $c_k = \frac{dQ}{dA} \approx \frac{5}{3}v$ (Seddon's law for wide rectangular channels with Manning friction).
- **Scientific & Engineering Explanation:**
  Seddon's law applies strictly to uniform prismatic channels under turbulent Manning flow. Real Punjab rivers (Ravi, Beas, Sutlej) feature meandering channels, extensive sandbars, barrages (Harike, Ropar, Madhopur), flood embankments (bunds), and significant backwater effects. More importantly, the codebase does not solve dynamic wave equations using $\frac{5}{3}v$; it uses **empirical travel-time lags between upstream and downstream gauge crossings** ($t_{\text{downstream}} - t_{\text{upstream}}$). Claiming a theoretical formula that is not used in the code creates false scientific authority.
- **Proposed Fix:**
  Remove all claims of $c_k = \frac{5}{3}v$. Document clearly that travel times are derived empirically from gauge-to-gauge event histories, and that reach speed is an effective empirical propagation velocity across river-km.
- **Verification Method:**
  Grep verification across docs and codebase ensuring no ungrounded celerity claims remain.

---

### Issue 4: Temporal Data Leakage in PRD Section 13 Evaluation Protocol
- **Severity:** High (P1 Methodological Leakage)
- **Status:** Confirmed in PRD
- **Affected Files & Line Evidence:**
  - [`docs/PRD.md:473`](file:///c:/Users/Gurjotpal%20Singh/Desktop/FloodSaathi/docs/PRD.md#L473):
    `Train to 2024; test Aug–Sep 2025 + 2023 peaks`
- **Scientific & Engineering Explanation:**
  Evaluating a machine learning model on historical events that occurred within the training time window (testing on 2023 monsoon peaks while training through 2024) is temporal data leakage. A time-series model will memorize antecedent conditions or cross-correlations from 2023, yielding artificially high recall and deceptive confidence.
- **Proposed Fix:**
  Enforce a strict, chronological, forward-chaining split with zero overlap:
  - **Option A (If multi-year data sufficient)**: Train on data up to 2022-12-31; Validation on 2023 monsoon floods (severe Punjab floods); Final Test on Aug–Sep 2025.
  - **Option B (If pre-2023 records too sparse)**: Train strictly through 2024-12-31; Final Out-of-Sample Test exclusively on Aug–Sep 2025 events. 2023 peaks are relegated strictly to exploratory training analysis.
  Update PRD Section 13, `eval/backtest.py`, and record choice in `docs/DECISIONS.md`.
- **Verification Method:**
  Test split assertion in `eval/backtest.py` confirming $\max(\text{train\_timestamps}) < \min(\text{test\_timestamps})$.

---

## Suspects Confirmation Matrix

| Suspect | PRD / Code Reference | Status | Audit Verdict |
|---|---|---|---|
| **(a) Status logic shows SAFE on missing data** | PRD 8.1 line 280; `status.js` line 197 | Confirmed | **Flaw exists**: Empty inputs or loading state default to `Safe`. |
| **(b) HAND depth mixes channel vs bank reference** | PRD 10.3 line 400; `estimator.js` line 200 | Confirmed | **Flaw exists**: $\Delta h_{\text{above\_bank}} - \text{HAND}_{\text{channel}}$ creates large datum offset. |
| **(c) Docs claim $c_k = \frac{5}{3}v$ unused in code** | Technical explanations | Confirmed | **Flaw exists**: Pipeline uses empirical gauge lags, not Seddon's law. |
| **(d) PRD 13 trains to 2024 & tests on 2023** | PRD 13 table line 473 | Confirmed | **Flaw exists**: Direct temporal leakage between train and test sets. |

---

## Action Plan for Correction Passes

- **Phase 2 (P0)**: Re-architect status logic with explicit states (`LOADING`, `UNKNOWN`, `DATA_UNAVAILABLE`, `WATCH`, `WARNING`, `DANGER`, `SAFE`), strict data freshness gates, and comprehensive negative regression tests.
- **Phase 3 (P1)**: Standardize vertical elevation datums for M2 HAND and stage-depth generation, eliminating reference frame confusion.
- **Phase 4 (P2)**: Replace theoretical velocity claims with empirical gauge-pair lag distributions, handling regulated barrages and reach uncertainties.
- **Phase 5 (P3)**: Eliminate evaluation leakage with strict temporal partitioning; calibrate baseline M1 forecaster.
- **Phase 6**: Retrieval-lock guidance SLM, restrict helplines to verified corpus, verify all safety refusals.
- **Phase 7 & 8**: Full offline verification and documentation synchronization.
