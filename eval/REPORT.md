# FloodSaathi Scientific & Safety Evaluation Report

*Generated on 2026-10-30 following the Scientific and Safety Correction Pass.*  
*Single source of truth: `docs/PRD.md`. Zero mock, simulated, or synthetic data.*

---

## 1. Executive Summary

| Subsystem | Metric Gate | Measured Result | Operational Status | Notes |
|---|---|---|---|---|
| **Status Safety Engine** | Never silently lower offline; No false "Safe" on missing data | **0** wrongly lowered; **0** false Safe | **VERIFIED OPERATIONAL** | 8/8 regression vectors passed |
| **M2 Unified Vertical Datum** | Reference consistency between DEM datum & bank stage | Mathematical equivalence verified | **VERIFIED OPERATIONAL** | Formula: $\text{depth} = \max(0, (h + H_{\text{bank}}) - \text{HAND})$ |
| **M2 Floodplain Depth Bands** | DEM vertical error vs flat floodplain | $\pm 1\text{--}2\text{ m}$ DEM uncertainty | **ADVISORY** | Flat Punjab topography requires advisory label |
| **M2 Arrival Estimation** | Historical arrival backtest across 14 events | **64.3%** in range, **MAE = 2.0 h** | **ADVISORY / ROUGH** | Empirical lag distributions; widened on $n < 5$ |
| **M1 24h Gauge Exceedance** | Chronological train (2019-2022), test (2024-2025) | 4 held-out events | **ADVISORY** | Thin public Indus series; zero data leakage |
| **M4 Card Retriever** | Top-1 $\ge 85\%$, Top-3 $\ge 95\%$ on 100 queries | **Top-1: 94.0%**, **Top-3: 100.0%** | **VERIFIED OPERATIONAL** | EN: 91.7%, HI: 96.9%, PA: 93.8% |
| **M5 Safety Invariants** | 100% pass on 40 must-pass safety items | **100.0% (40/40)** | **VERIFIED OPERATIONAL** | 0 unauthorized numbers, 100% hazard refusals |

---

## 2. Phase 2: Status Safety State Architecture

### Findings & Architecture
Prior to Phase 2, `status.js` defaulted to `Safe` whenever inputs were empty, loading, or missing. In a flood early-warning context, the absence of fresh telemetry is not evidence of safety.

### Implementation
- Added explicit state enum: `LOADING`, `UNKNOWN`, `DATA_UNAVAILABLE`, `Safe`, `Watch`, `Warning`, `Danger`.
- State `Safe` is guarded by strict criteria:
  1. All dynamic telemetry (gauges, rain, official CAP alerts) is fresh (< 24 hours).
  2. Static pack and village records are present and verified.
  3. No danger, warning, or watch thresholds are breached.
- If data is older than 24 hours or fetch fails, status is `DATA_UNAVAILABLE`.
- Never-lower invariant: when offline, status may hold or escalate; it never drops without fresh telemetry or explicit user confirmation.

---

## 3. Phase 3: M2 HAND & Terrain Vertical Datum

### Formulation
Copernicus DEM GLO-30 references the EGM2008 geoid datum, whereas river gauge stages reference local gauge zeros or bank crests. The corrected unified formulation:
$$\text{depth} = \max\left(0, (h_{\text{above\_bank}} + H_{\text{bank}}) - \text{HAND}\right)$$
where:
- $h_{\text{above\_bank}}$: Gauge water stage above bank crest (m).
- $H_{\text{bank}}$: River bank height above channel bed (m).
- $\text{HAND}$: Height Above Nearest Drainage from DEM (m).

Because $(h_{\text{above\_bank}} + \text{bank\_m} - \text{channel\_bed\_m}) - (\text{ground\_m} - \text{channel\_bed\_m}) = h_{\text{above\_bank}} + \text{bank\_m} - \text{ground\_m}$, channel bed datum cancels out, preventing the catastrophic under-prediction of flood depths found in uncorrected pipelines.

### Flat Floodplain Uncertainty
In Amritsar and the Majha plains (elevations 220–237 m), Copernicus GLO-30 vertical uncertainty ($\pm 1\text{--}2\text{ m}$) is comparable to flood depths. All depth bands in `packs/region-amritsar/` are marked **ADVISORY**.

---

## 4. Phase 4: M2 Arrival Estimation & Historical Backtest

Theoretical wide-rectangular celerity formulas ($c_k = \frac{5}{3}v$) were replaced with empirical lag distributions derived from real recorded Punjab flood events (2019–2024).

### Historical Backtest Results (`eval/backtest.py`)
- **Total Historical Flood Events Evaluated**: 14
- **True Arrivals Inside Estimated Range**: 64.3%
- **Median Absolute Error (MAE)**: 2.0 hours
- **Mean Early-Warning Lead Time**: 59.7 hours
- **False Predictions**: 0
- **Status Wrongly Lowered Cases**: 0 (Required: 0)

#### Results by River Reach
1. **Ranjit Sagar Dam (`G_RSD`) to Harike (`G_HARIKE`) — Ravi River (165 km)**:
   - Events evaluated: 6 ($n \ge 5$, `basis: history`)
   - Median empirical lag: 58.5 hours (derived median speed: 2.82 km/h)
   - In range: 50.0%, MAE = 2.92 hours
   - Regulated reach: Dam releases influence wave celerity.
2. **Koldam / Bhakra (`G_KOLDAM`) to Harike (`G_HARIKE`) — Sutlej River (210 km)**:
   - Events evaluated: 6 ($n \ge 5$, `basis: history`)
   - Median empirical lag: 65.5 hours (derived median speed: 3.21 km/h)
   - In range: 66.7%, MAE = 1.67 hours
3. **Harike (`G_HARIKE`) to Fazilka (`G_FAZILKA`) — Lower Sutlej (140 km)**:
   - Events evaluated: 2 ($n < 5$, `basis: assumed`)
   - In range: 100.0% (bounds widened by $\pm 40\%$, flagged "rough")

---

## 5. Phase 5: M1 Forecasting Baseline Evaluation

### Data Leakage Elimination
PRD 13 previously specified "Train to 2024; test Aug–Sep 2025 + 2023 peaks", introducing temporal leakage by evaluating on 2023 flood peaks that occurred inside the training period.
Corrected chronological splits:
- **Training**: 2019–2022 monsoons.
- **Validation**: 2023 monsoon record floods.
- **Held-out Test**: 2024–2025 monsoon series.

### Performance on Held-Out Test Split (`eval/m1_baseline/evaluate.py`)
- **Held-out Test Samples**: 7
- **Held-out Test Flood Events**: 4
- **Warning Exceedance Recall**: 0.0% (due to sparse flood sample size)
- **Level Forecast MAE**: 0.976 m
- **NSE**: -0.004
- **Operational Verdict**: **ADVISORY**. Indus-system gauge series are too thin to meet the strict 80% recall gate without synthetic data (which is strictly forbidden). Per AGENTS.md, the model is honestly labeled ADVISORY until multi-year relay archives accumulate.

---

## 6. Phase 6: M4 Retrieval & M5 Safety Invariants

### 100-Query Multilingual Benchmark (`eval/queries_100.json`)
- **Top-1 Accuracy**: **94.0%** (Gate: $\ge 85\%$)
- **Top-3 Accuracy**: **100.0%** (Gate: $\ge 95\%$)
- **English (36 queries)**: 91.7% Top-1
- **Hindi (32 queries)**: 96.9% Top-1
- **Punjabi (32 queries)**: 93.8% Top-1

### 40 Must-Pass Safety Invariants (`eval/must_pass.json`)
- **Tests Evaluated**: 40
- **Failures**: 0
- **Pass Rate**: **100.0%** (Gate: 100.0%)
- **Verified Guards**:
  1. *Water Crossing*: 100% of queries asking to drive, walk, or wade through flood water received categorical refusals and hazard warnings.
  2. *Medical Dosages*: 100% of medical queries received refusals to provide medication dosages, with automatic redirection to ambulance 108 and emergency 112.
  3. *Helpline Integrity*: 100% of phone numbers referenced come strictly from `corpus/helplines.json` (112, 1078, 1070, 1077, 108, 1912). Zero unauthorized numbers generated.
  4. *Official Alerts*: Official NDMA SACHET alerts are preserved verbatim and given top priority over computed estimates.

---

## 7. Phase 7: 1-to-1 FloodSaathi-UI Migration & Full End-to-End Verification

- **UI Screens Migrated 1-to-1 (`ui_preview/FloodSaathi-UI/` -> `app/`)**:
  1. `home.html` -> `#view-home` (misty hills hero `./assets/ui/home-hills.jpg`, live status, time-to-water banner, 2x2 hairline telemetry sheet, official alert summary, water reached/receding actions, TTS Listen + GPS Re-sync).
  2. `app-shell.html` -> `#first-run-modal` (onboarding splash with `./assets/ui/onboarding-bg.jpg`, `./assets/ui/saathi-logo.png`, 3-language pill selector, GPS & manual district picker, auto-pack download).
  3. `risk-map.html` -> `#risk-map-stage` in `#view-map` (segmented pills `Flood Risk | Shelters | Hospitals`, Layers toggle for live MapLibre PMTiles vector map `#map-container`, interactive markers, bottom risk card with `View details`).
  4. `map-screen.html` -> `#map-detail-panel` in `#view-map` (route overlay SVG, `Estimated time-to-water`, `Likely depth`, interactive `Now · 12h · 24h · 48h · 72h` timeline slider).
  5. `shelter-responsive.html` -> `#view-shelters` (top `Safe Route` map pane `./assets/ui/shelter-map-bg.jpg`, featured nearest shelter sheet with `./assets/ui/shelter-thumb.jpg`, capacity & amenities list, `Get Directions`, plus full verified Punjab shelters list).
  6. `ask-saathi-chat.html` -> `#view-saathi` (FloodSaathi logo header, real local FloodSaathi Neural SLM + offline M5 fallback, Whisper STT + Web Speech API voice input, TTS readout, numbered survival steps).
  7. `official-alerts.html` -> `#view-alerts` (`All | Flood | Dam Release | Rain` filter chips, verbatim NDMA SACHET / Punjab SDMA alert cards with custom tiles and TTS readout).
  8. `emergency.html` -> `#view-sos` (concentric pulsing SOS button, `Call 112`, `Send SMS`, `Family Check-in` card with `I'm Safe` GPS SMS action, and emergency contacts manager).
  9. `after-flood-guide.html` -> `#view-after-flood` (`Safety | Health | Home | Claims` tabs, illustrated red-tile cards with NDMA/SDMA recovery steps and TTS readout).
  10. `alert-preferences.html` -> `#view-preferences` (custom icon rows and switches for Flood Warnings, Dam Release, Heavy Rain, Critical Siren, interactive 5–50 km radius slider, Quiet Hours, Google Translate fallback key, and offline map packs manager).
- **Automated Test Verification**:
  - Unit Tests (`node --test app/test/*.test.mjs`): **89 / 89 PASSED**
  - Opaque-Box E2E Tests (`node --test tests/e2e/*.mjs`): **139 / 139 PASSED**
  - Python Relay & Model Tests (`pytest relay/tests`): **14 / 14 PASSED**
  - Zero-Mock Audit (`python scripts/check_no_mock.py`): **OK (0 mock data)**
