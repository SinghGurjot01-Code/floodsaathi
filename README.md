# FloodSaathi (ਫਲੱਡ-ਸਾਥੀ · फ्लड-साथी)

> **Offline-First Flood Early-Warning & Emergency Assistant for India (Punjab Pilot · Hackathon CTBF-AI-12)**  
> *Real CWC river gauges · Verbatim NDMA SACHET alerts · Empirical time-to-arrival forecasting · On-device Small Language Model (SLM) · Zero mock data.*

[![Zero Mock Data](https://img.shields.io/badge/Data-100%25%20Real%20(Zero%20Mock)-16a34a.svg)](docs/DATA_SOURCES.md)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-89%2F89%20Passing-brightgreen.svg)](app/test/)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-139%2F139%20Passing-brightgreen.svg)](tests/e2e/)
[![Android Release](https://img.shields.io/badge/Android%20APK-v1.2.0%20Available-2563eb.svg)](https://github.com/SinghGurjot01-Code/floodsaathi/releases/tag/v1.2.0)
[![Hugging Face](https://img.shields.io/badge/Model-SinghGurjot01%2FFloodSaathi-yellow.svg)](https://huggingface.co/SinghGurjot01/FloodSaathi)
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20%E0%A8%AA%E0%A9%B0%E0%A8%9C%E0%A8%BE%E0%A8%AC%E0%A9%80%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-red.svg)](app/i18n/)

<div align="center">
  <img src="app/assets/ui/saathi-logo.png" width="120" height="120" alt="FloodSaathi Logo" style="border-radius:24px; box-shadow:0 8px 24px rgba(239,28,36,0.25);" />
  <p><em>"Alerts tell you a river is high. FloodSaathi tells you when it reaches your village, where to go, and what to do — even when cell towers fail."</em></p>
</div>

---

## 📌 Executive Summary for Evaluators

During monsoon flood disasters (such as the devastating Punjab floods affecting over 1,400 villages across the Sutlej, Beas, and Ravi basins), cellular towers and power grids frequently collapse. Existing solutions like Google Flood Hub or NDMA SACHET provide essential warnings, but villagers and rural responders face three critical challenges:
1. **Network Fragility:** Online-only portals become inaccessible when electricity and 4G/5G towers go down.
2. **Abstract Metrics:** Water discharge in *cusecs* or *metres above danger level* does not tell a family: *"Will water enter my home? In how many hours? Where is the nearest safe relief shelter?"*
3. **Language & Actionability Gap:** Flood safety advice is rarely actionable in regional languages (Punjabi Gurmukhi & Hindi) with exact chemical formulas (e.g. well chlorination ratios) and strict medical safety boundaries.

**FloodSaathi solves this with an honest, offline-first flood early-warning system:**
- **Zero Mock Data Invariant:** Every gauge level, elevation, rainfall figure, and disaster bulletin comes from real sources (Central Water Commission, NDMA SACHET, Open-Meteo, Copernicus GLO-30 DEM).
- **Offline Estimation Engine:** Predicts arrival windows using empirical river-reach lag distributions. Offline status **never silently lowers** without verified fresh data or user confirmation.
- **On-Device Neural AI (`Ask Saathi`):** Powered by the fine-tuned `SinghGurjot01/FloodSaathi` model running directly on device storage (`FloodSaathi/models/`) or via the local Python neural backend.
- **Interactive Offline Water & Risk Maps:** Live OpenStreetMap slippy tiles + MapLibre PMTiles with a custom radius offline tile downloader (`5 km` – `150 km`) and safe route navigation to 16 verified Punjab relief centers.
- **Multilingual Accessibility:** Full English, Punjabi (ਪੰਜਾਬੀ), and Hindi (हिन्दी) support with voice recognition (STT) and text-to-speech (TTS) audio narration.

---

## ⚡ Quickstart for Evaluators

You can test and evaluate FloodSaathi in **three ways**:

### Option 1: Install the Android APK (Real Device / Emulator)
1. Download **[`FloodSaathi.apk`](https://github.com/SinghGurjot01-Code/floodsaathi/releases/tag/v1.2.0)** (Release `v1.2.0`, ~12 MB).
2. Install on any Android 8.0+ device or emulator:
   ```bash
   adb install -r FloodSaathi.apk
   ```
3. Open **FloodSaathi**:
   - The app automatically creates the **`FloodSaathi/`** app directory on your device with **`FloodSaathi/models/`** and **`FloodSaathi/maps/`**.
   - Go to **Downloads** and tap **Download Model** to cache the neural model files directly into your device folder.
   - Switch your device to **Airplane Mode / Offline**: the app continues to estimate water arrival, displays cached OpenStreetMap tiles, and answers safety questions via the on-device AI.

---

### Option 2: 1-Click Launch on PC (Windows)
We provide automated launchers that start the local Python neural server and launch the app in your browser:
- Double-click **`start_app.bat`** (or **`start_app_silent.vbs`** for completely silent background launch).
- The script checks port `8080`, launches `server.py` in the background with `.venv`, and opens **`http://localhost:8080`**.

---

### Option 3: Manual Terminal Setup
```bash
# 1. Clone the repository
git clone https://github.com/SinghGurjot01-Code/floodsaathi.git
cd floodsaathi

# 2. Set up Python virtual environment
python -m venv .venv
.\.venv\Scripts\activate       # On Linux/macOS: source .venv/bin/activate
pip install -r relay/requirements.txt

# 3. Launch the FloodSaathi Neural Server
python server.py

# 4. Open in browser:
# Navigate to http://localhost:8080
```

---

## 🧪 Comprehensive Verification & Test Suite

FloodSaathi is tested against strict safety invariants, zero-mock policies, and real-world failure modes.

```bash
# 1. Run Unit Tests (89 tests: Status engine, estimator, i18n, map, AI retriever)
node --test app/test/*.test.mjs

# 2. Run E2E Master Suite (139 tests: Feature coverage, boundaries, stress tests, scenario tests)
node --test tests/e2e/*.mjs

# 3. Run Zero-Mock AST Verification
python scripts/check_no_mock.py

# 4. Run Historical Flood Arrival Backtests & Cards Evaluation
python eval/backtest.py
python eval/cards_eval.py
```

### Verified Test Results Summary

| Test Suite | Metric / Coverage | Result | Status |
|---|---|---|---|
| **Zero Mock Checker** (`scripts/check_no_mock.py`) | AST inspection of runtime files | **0 Mock Patterns Found** | ✅ **PASS** |
| **Unit Test Suite** (`app/test/*.test.mjs`) | Estimator, Status, Map, i18n, Storage | **89 / 89 Passed (100%)** | ✅ **PASS** |
| **E2E Master Suite** (`tests/e2e/*.mjs`) | F1–F15, Invariants, Edge Cases | **139 / 139 Passed (100%)** | ✅ **PASS** |
| **Safety Invariants** (`eval/cards_eval.py`) | 40 Must-pass safety items | **40 / 40 Passed (100%)** | ✅ **PASS** |
| **Multilingual Retrieval** (`eval/cards_eval.py`) | 100 queries across EN, HI, PA | **Top-1: 94.0% · Top-3: 100.0%** | ✅ **PASS** |
| **Historical Arrival Backtest** (`eval/backtest.py`) | 14 Punjab Flood Events (2019–2024) | **MAE = 2.0 h · 0 Wrongly Lowered** | ✅ **VERIFIED** |

---

## 📱 Feature Walkthrough & Architecture

```mermaid
flowchart TD
    subgraph Data Sources [Real External Telemetry]
        CWC[CWC River Gauges]
        NDMA[NDMA SACHET CAP Alerts]
        OM[Open-Meteo 72h Rain Forecast]
        DEM[Copernicus GLO-30 DEM]
        OSM[OpenStreetMap Slippy & PMTiles]
    end

    subgraph Relay & Engine [Python Relay & Server]
        Relay[relay/run.py]
        Server[server.py HTTP + Neural SLM]
        HF[Hugging Face: SinghGurjot01/FloodSaathi]
    end

    subgraph Client Application [FloodSaathi PWA & Android APK]
        SW[Service Worker sw.js Offline Cache]
        Bridge[FloodSaathiNativeBridge.java]
        Folder[Device Storage: FloodSaathi/models & maps]
        Estimator[estimator.js Empirical Arrival Engine]
        MapEngine[map.js OSM Slippy + MapLibre GL]
        ChatEngine[ai_assistant.js On-Device Neural AI]
    end

    CWC --> Relay
    NDMA --> Relay
    OM --> Relay
    DEM --> Relay
    Relay --> Server
    Server --> SW
    HF --> Folder
    Bridge --> Folder
    Folder --> ChatEngine
    OSM --> MapEngine
    SW --> Client Application
```

### 1. Home Dashboard — "My Status" (F1, F2, F4)
- **Live CWC River Gauges:** Monitors Harike Barrage (Sutlej-Beas), Kol Dam (Sutlej), and Ranjit Sagar Dam (Ravi) with real water levels, warning thresholds, danger marks, and rising/falling trends.
- **Empirical Arrival Estimation:** Computes estimated arrival windows (`12–18 hours`) based on upstream wave celerity lag distributions derived from real recorded Punjab flood events.
- **Verbatim Disaster Alerts:** Official CAP-compliant alerts from NDMA SACHET displayed verbatim with audio narration.
- **Transparent Proximity Indicator:** Displays exact distance and flow direction to reporting station (e.g. *Your location: Ludhiana, Punjab · Hydrologic telemetry from: Harike Barrage (90.8 km upstream)*).

### 2. Interactive Water & Risk Map (F3, F10)
- **Never a Static Picture:** Real, interactive, drag/pan/zoom map powered by OpenStreetMap raster tiles + MapLibre vector layers. Works seamlessly on WebGL-enabled screens as well as fallback environments (`renderInteractiveSlippyTileMap`).
- **Dynamic Multi-Band Risk Zones:** Renders High (red), Moderate (orange), and Low (yellow) inundation zones computed from elevation relative to nearest river drainage.
- **Custom Offline Map Downloader:** Users can choose any custom radius (`5 km` to `150 km`) via a live slider, inspect a dynamic radius circle on the map, and cache tiles into Cache API (`floodsaathi-offline-maps-v1`) and save metadata into `FloodSaathi/maps/`.

### 3. Ask Saathi AI Assistant (F6, M3, M5)
- **Mobile Folder Connection:** The chatbot reads model weights and the 115-entry verified disaster instruction dataset directly from the physical phone folder (`FloodSaathi/models/`).
- **Safety Invariant Guardrails:**
  - **Medical Inquiries:** Strictly refuses pharmaceutical dosages; instructs user to call **108** for medical ambulances.
  - **Water Crossing Dangers:** Strictly rejects wading or driving cars/tractors through flood waters ("Turn around, don't drown").
  - **Electrical Safety:** Enforces minimum 10m distance from downed powerlines and dials **1912** (PSPCL).
  - **Well Purification Formula:** Delivers exact verified formula: *50 grams of fresh bleaching powder per 1,000 litres of water*.
  - **Authorized Helplines Only:** Emergency numbers are restricted to **112**, **1078**, **1070**, and **1077**.

### 4. Verified Evacuation Shelters & Safe Routing (F5)
- **16 Verified Relief Centers in Punjab:** Includes Guru Nanak Stadium Relief Center, Khalsa College Relief Camp, Model Town Community Hall, with verified capacities, elderly accessibility tags, and amenities (potable water, medical aid, backup generators).
- **Interactive Route Mapping:** Computes and renders high-ground evacuation paths avoiding floodplains with one-tap OSM navigation directions.

### 5. Emergency SOS & Family Check-in (F7, F9)
- **Emergency Ring Dialers:** Instant connection to National Emergency Support System (112), NDMA (1078), and Punjab SEOC (1070).
- **One-Tap Geolocation SMS:** Composes SMS with exact GPS coordinates, village name, and battery level for designated emergency contacts.
- **Family Check-In ("I'm Safe"):** Broadcasts a pre-formatted status message indicating water is below ground level at user's coordinates.

---

## 🔒 Safety Invariants (Outranking Features & Deadlines)

FloodSaathi enforces safety invariants guaranteed by automated regression test suites:
1. **Never Silently Lower Offline:** When offline, status may escalate from *Safe* to *Watch*, *Warning*, or *Danger*; it **never drops** without fresh online telemetry or the user's explicit *"Water is receding"* confirmation.
2. **No "Safe" Estimate Labels:** The word "safe" is never used for an estimate; the app strictly displays *"Water likely to stay below your ground level"*.
3. **Data Age & Stale Boundaries:** Every telemetry point displays its exact timestamp and age. Data older than 24 hours displays **DATA UNAVAILABLE**, hides numerical estimates, and prominently shows emergency helplines.
4. **No Synthetic Numbers:** Helplines are never generated by AI; they are read strictly from verified government records in [`corpus/helplines.json`](corpus/helplines.json). Buttons for 112 and 1078 are pinned and always visible.
5. **Zero-Tracking Privacy:** Geolocation is processed strictly on-device. No accounts, no passwords, no mandatory phone numbers, and telemetry is strictly opt-in.

---

## 📂 Project Repository Structure

```
FloodSaathi/
├── android/                         # Capacitor native Android app project
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml      # GPS, Network & Storage permissions
│   │   └── java/org/floodsaathi/app/
│   │       ├── MainActivity.java    # Capacitor bridge & WebApp container
│   │       └── FloodSaathiNativeBridge.java # Physical folder bridge (FloodSaathi/models & maps)
├── app/                             # Core Web PWA application (Vanilla JS ES modules, plain CSS)
│   ├── index.html                   # Mobile-first app shell (Home, Map, Saathi, Alerts, Downloads, More)
│   ├── sw.js                        # Offline-first Service Worker with protected cache allowlist
│   ├── css/                         # Plain CSS styling (tokens.css, main.css, status.css, fonts.css)
│   ├── js/
│   │   ├── main.js                  # Master application controller and event coordinator
│   │   ├── ai_assistant.js          # On-device neural assistant & 115-entry instruction engine
│   │   ├── mobile_storage.js        # Mobile folder manager (FloodSaathi/models & maps)
│   │   ├── map.js                   # Interactive OSM slippy tile & MapLibre PMTiles engine
│   │   ├── map_downloader.js        # Custom radius offline map tile downloader
│   │   ├── estimator.js             # Pure logic: arrival estimation & time-to-water windows
│   │   ├── status.js                # Pure logic: safe/watch/warning/danger state machine
│   │   ├── shelters.js              # Haversine distance calculator & relief center directory
│   │   └── i18n.js                  # Trilingual dictionary loader (EN, HI, PA)
│   ├── i18n/                        # Real translations: en.json, hi.json, pa.json
│   ├── corpus/                      # Verified disaster guidelines & 16 Punjab shelters
│   ├── fonts/                       # Bundled offline fonts (Noto Sans Latin, Devanagari, Gurmukhi)
│   └── models/FloodSaathi/          # Trained FloodSaathi neural dataset & model manifests
├── relay/                           # Telemetry ingestion, training, and export pipeline
│   ├── run.py                       # Ingestion runner for CWC gauges, SACHET CAP, Open-Meteo
│   ├── train_mobile_model.py        # LoRA fine-tuning pipeline for Qwen2.5-0.5B-Instruct
│   └── export_mobile_model.py       # Int4 quantization and export pipeline
├── eval/                            # Scientific backtesting and evaluation suites
│   ├── backtest.py                  # 14 historical Punjab flood events arrival backtest
│   ├── cards_eval.py                # 100-query multilingual benchmark & 40 safety items
│   └── REPORT.md                    # Detailed scientific & safety evaluation report
├── server.py                        # Local Python HTTP server + real Neural SLM inference endpoint
├── start_app.bat                    # 1-Click Windows Auto-Launcher
├── start_app_silent.vbs             # Silent background auto-launcher for Windows
├── FloodSaathi.apk                  # Ready-to-install Android Release package (v1.2.0)
└── scripts/
    └── check_no_mock.py             # AST scanner enforcing zero mock/synthetic data in runtime
```

---

## 🌐 Data Sources & Acknowledgments

FloodSaathi builds on authentic open data from public institutions:
- **Central Water Commission (CWC):** Real river gauge levels, warning marks, and danger thresholds.
- **National Disaster Management Authority (NDMA) & SACHET:** Verbatim CAP disaster alerts and flood safety guidelines.
- **OpenStreetMap & Protomaps:** High-contrast offline vector and raster cartography.
- **Copernicus GLO-30 DEM:** 30m vertical elevation and Height Above Nearest Drainage (HAND).
- **Open-Meteo:** 72-hour precipitation forecast and meteorological telemetry.
- **Punjab State Disaster Management Authority & Revenue Dept:** Verified relief camps and district helpline directories.

---

## 📄 License & Integrity

- **Code:** Licensed under [MIT License](LICENSE).
- **Cartography:** © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- **Model Weights:** Fine-tuned on open safety datasets; weights available on [Hugging Face](https://huggingface.co/SinghGurjot01/FloodSaathi).
- **Evaluation Integrity:** Single source of truth is [`docs/PRD.md`](docs/PRD.md). All metric gates and evaluation reports reflect real measurements without artificial inflation.
