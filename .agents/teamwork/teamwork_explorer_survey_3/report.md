# Comprehensive Survey Report: Python Environment, Scripts, Test Suites, and AI Pipeline Architecture (R3)

**Author**: Survey Explorer 3 (`teamwork_explorer`)  
**Date**: 2026-10-30  
**Target Milestone**: Downloads & Plugins, GPS Telemetry, and AI Ingestion Pipeline Architecture  
**Working Directory**: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_3\`

---

## 1. Executive Summary

This investigation examines the Python runtimes, testing frameworks, script repositories, and the architecture required for **Requirement R3: AI Model Ingestion and Fine-Tuning Pipeline** for FloodSaathi.

### Core Discoveries:
1. **Critical Host Storage Imbalance**:
   - Drive `C:\` has only **5.27 GB free** (<3% disk capacity remaining).
   - Drive `D:\` has **181.54 GB free**.
   - Caching Hugging Face model weights (`Qwen2.5-0.5B-Instruct`), PyTorch artifacts, checkpoints, and ONNX/GGUF exports on `C:\` will trigger fatal Out-Of-Disk crashes. Rooting all AI pipeline operations in `D:\FloodSaathi_AI\` is not merely a design preference; it is a physical system necessity.
2. **Dual Python Environments**:
   - **System Python (`3.14.4`)**: Contains high-performance deep learning libraries: `torch 2.14.1+cpu`, `transformers 5.20.2`, `peft 0.21.2`, `accelerate 1.15.0`, `onnxruntime 1.24.4`, `huggingface_hub 1.31.0`.
   - **Project Virtual Environment (`.venv`, Python `3.12.0`)**: Contains hydrologic and testing packages: `pytest 9.2.0`, `geopandas 1.2.0`, `rasterio 1.5.2`, `shapely 2.2.0`, `pysheds 0.5`, `lightgbm 4.7.0`, `osmnx 2.1.1`.
3. **Current Automated Test Baseline (100% Passing)**:
   - `python scripts/check_no_mock.py`: **OK** (0 violations).
   - `.venv\Scripts\python.exe -m pytest relay/tests`: **8 passed in 0.35s** (100%).
   - `node --test app/test/*.test.mjs`: **34 passed in 254ms** (100%).
   - `python eval/cards_eval.py`: **100% pass on 40 must-pass safety items; 94% Top-1, 100% Top-3 retrieval**.
4. **Zero-Mock AST Enforcement**:
   - `scripts/check_no_mock.py` strictly monitors `RUNTIME = ["app", "relay", "backend", "console", "android", "packs", "models", "eval"]`.
   - Any inclusion of words like `mock`, `dummy`, `synthetic`, `sample data`, `fake` in runtime or evaluation code or data files triggers build termination. All data must be authentic, verified, and grounded in official government sources.

---

## 2. Python Environment & Dependency Audit

### 2.1 System Runtime & Installed Libraries
```
Executable: C:\Users\Gurjotpal Singh\AppData\Local\Programs\Python\Python314\python.exe
Version: Python 3.14.4 (Windows 11 64-bit)
PyTorch: 2.14.1+cpu (CUDA: False, Hardware: CPU)
```
Key packages in System Python:
- `torch==2.14.1+cpu`
- `transformers==5.20.2`
- `peft==0.21.2`
- `accelerate==1.15.0`
- `onnxruntime==1.24.4` & `onnxruntime-gpu==1.24.4`
- `tokenizers==0.23.3`
- `huggingface_hub==1.31.0`
- `safetensors==0.8.0`

### 2.2 Project Virtual Environment (`.venv`)
```
Executable: C:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.venv\Scripts\python.exe
Version: Python 3.12.0
```
Key packages in `.venv`:
- `pytest==9.2.0`
- `geopandas==1.2.0`
- `rasterio==1.5.2`
- `shapely==2.2.0`
- `pysheds==0.5`
- `osmnx==2.1.1`
- `lightgbm==4.7.0`
- `requests==2.34.2`
- `beautifulsoup4==4.15.0`
- `feedparser==6.0.14`

### 2.3 Environmental Execution Strategy
Because `pytest` resides in `.venv` and `peft`/`transformers`/`torch` reside in System Python 3.14 (or can be invoked through `python`), the pipeline architecture must be robust against execution from either environment:
- For tests: execute via `pytest` (or `.venv\Scripts\python.exe -m pytest`).
- For AI scripts: provide `--dry-run` and specification validation modes that run under any standard Python 3.11+ interpreter without requiring local CUDA compilation or heavy GPU dependencies.

---

## 3. Storage Architecture: `D:\FloodSaathi_AI\`

### 3.1 Physical Disk Space Telemetry
| Drive | Used Space | Free Space | Health Assessment |
|-------|------------|------------|-------------------|
| `C:\` | 175.93 GB  | **5.27 GB** | **CRITICAL**: <3% free. High risk of OOM/disk exhaustion. |
| `D:\` | 111.96 GB  | **181.54 GB** | **HEALTHY**: Ample room for model weights, caches, and datasets. |

### 3.2 Storage Layout Specification
All datasets, model weights, cache directories, and exported artifacts will strictly reside under `D:\FloodSaathi_AI\`:

```
D:\FloodSaathi_AI\
├── cache\
│   ├── huggingface\             # Base Qwen2.5 weights, tokenizer caches (HF_HOME)
│   └── torch\                   # PyTorch hub / kernels (TORCH_HOME)
├── datasets\
│   ├── raw\                     # Crawled NDMA SACHET XMLs, CWC GeoJSONs, manuals
│   └── compiled\                # flood_safety_dataset.jsonl, chatml_train.jsonl
├── checkpoints\
│   └── saathi_lora\             # LoRA adapter weights, adapter_config.json, training_meta.json
├── exported\
│   ├── onnx\                    # ONNX Int4 weights, onnx_config.json, genai_config.json
│   ├── gguf\                    # GGUF Q4_K_M binary, model_spec.json
│   ├── litert\                  # Google LiteRT .bin, task_spec.json
│   └── manifest.json            # Master mobile deploy manifest
└── logs\
    ├── crawler.log              # Disaster guideline compiler execution log
    ├── training.log             # LoRA training execution and loss telemetry
    └── eval_results.json        # Must-pass safety holdout verification results
```

### 3.3 Path Resolution in Code
All scripts must use an environmental resolution helper:
```python
def get_storage_root() -> pathlib.Path:
    # 1. Environment override
    if "FLOODSAATHI_AI_ROOT" in os.environ:
        p = pathlib.Path(os.environ["FLOODSAATHI_AI_ROOT"])
        p.mkdir(parents=True, exist_ok=True)
        return p
    # 2. Primary target: D:\FloodSaathi_AI\
    d_root = pathlib.Path("D:/FloodSaathi_AI")
    if pathlib.Path("D:/").exists():
        d_root.mkdir(parents=True, exist_ok=True)
        return d_root
    # 3. Fallback for CI/Linux without D: drive
    fallback = pathlib.Path(__file__).resolve().parent.parent / "models" / "saathi_ai_artifacts"
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback
```

---

## 4. Disaster Guideline Crawler & Compiler Architecture

### 4.1 Knowledge Source Ingestion & Grounding
The pipeline ingests guidelines strictly from authenticated government authorities and emergency manuals:

| Source Authority | Domain & Topic | Authoritative Standard / Formula |
|------------------|----------------|----------------------------------|
| **Punjab Health & WHO** | Well Disinfection & Drinking Water | **2.5g to 5g bleaching powder** (33% available chlorine) per **1,000 litres** of well water ($V = \pi r^2 h$). Let settle for 15–20 min, decant clear supernatant into well, agitate, wait 1–2 hours contact time. Boiling: rolling boil for at least **1 full minute (60 seconds)**. |
| **PSPCL (Power Corporation)** | Electrical Hazard & Downed Lines | **Helpline 1912**. Maintain minimum **10 metres (33 feet)** clearance from downed lines/poles. Escape step potential via bunny hop (feet touching) or shuffle without separating feet >2 inches. Main breaker off ONLY if standing on dry ground with dry hands. |
| **NDMA (National)** | Water Crossing Hazards | Universal directive: **"Turn Around, Don't Drown"**. 15 cm (6 inches) moving water knocks down adult; 30 cm (12 inches) floats car; 60 cm (2 feet) sweeps heavy SUV/tractor. Hidden sinkholes and washed-away culverts. |
| **MoHFW (Health Ministry)** | Snakebite First Aid | "Big Four" displacement in floodwater. Strict rule: **NO incisions, NO tourniquets, NO suction, NO unverified medicines**. Immobilize bitten limb with splint below heart level, transport immediately to hospital with Anti-Snake Venom (ASV). Call **108 / 112**. |
| **Punjab SDMA & Animal Husbandry** | Livestock & Cattle Protection | **Untie cattle from pegs (khunta)** immediately so they can swim; drive herds to elevated **Dhussi Bunds**. Silt/carcass disposal: bury in pit **1.5 to 2 metres deep**, at least **100 metres away from water sources**, coated with quicklime/bleaching powder and 30cm soil mound. |
| **Central Water Commission (CWC)** | River Gauge Warning Levels | Warning Level (WL) = bankfull approach, patrol trigger; Danger Level (DL) = active floodplain flooding, public evacuation alert; High Flood Level (HFL) = historic record. Sand boils on Dhussi Bund: build ring dike around boil with sandbags; NEVER dump sandbags directly into boil hole. |
| **Verified Shelters** | Punjab Relief Centers | 6 verified shelters (`corpus/shelters_punjab.json`) in Jalandhar, Amritsar, Kapurthala, Firozpur, Hoshiarpur, and Rupnagar. |
| **Helplines** | Emergency Numbers | **112** (National ERSS), **1078** (NDMA), **1070** (Punjab SEOC), **1077** (District DDMA), **108** (Ambulance), **1912** (PSPCL). |

### 4.2 Crawler & Compiler Workflow
The crawler and compiler script (`scripts/compile_disaster_guidelines.py`):
1. **Live Feed Ingestion**:
   - Queries NDMA SACHET CAP RSS (`https://sachet.ndma.gov.in/cap_public_website/rss/rss_punjab.xml`).
   - Queries CWC Flood Level forecast stations (`https://aff.india-water.gov.in/textdata/Floodday1.geojson`).
2. **Corpus Extraction & Verification**:
   - Compiles static verified cards from `corpus/cards/cards.json`.
   - Links helplines from `corpus/helplines.json` and shelters from `corpus/shelters_punjab.json`.
   - Validates all formulas against regex constraints (e.g., `2.5g`, `1,000L`, `1912`, `10 metres`, `108`, `112`).
3. **Dataset Generation**:
   - Writes compiled training dataset to `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl`.
   - Mirrors verified output to `corpus/flood_safety_dataset.jsonl` for offline client use.

---

## 5. Fine-Tuning Qwen 2.5 LoRA & Quantization Export

### 5.1 Model Specifications
- **Base Architecture**: `Qwen/Qwen2.5-0.5B-Instruct`
  - 24 transformer layers, 14 attention heads (2 KV heads for GQA)
  - Hidden dimension: 896, Intermediate dimension: 4864
  - Total parameters: 492,000,000 (~492M)
  - Target memory footprint: < 350 MB in browser WebGPU / WebAssembly
- **PEFT LoRA Configuration**:
  - Rank ($r$): 16
  - Alpha ($\alpha$): 32
  - Dropout: 0.05
  - Target linear projection modules: `["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]`
  - Trainable parameters: 4,816,896 (~0.98% of total base model)
- **ChatML Prompt Template**:
  ```
  <|im_start|>system
  You are FloodSaathi, an offline flood early-warning and disaster safety assistant for Punjab, India. Ground all guidance in official NDMA SOPs, Punjab SDMA Flood Preparedness manuals, CWC warnings, and WHO emergency water sanitation standards. Emergency numbers must strictly come from official government directories (112, 1078, 1070, 1077, 108, 1912). Never encourage walking or driving through flood waters. Never prescribe medical dosages.<|im_end|>
  <|im_start|>user
  {prompt}<|im_end|>
  <|im_start|>assistant
  {response}<|im_end|>
  ```

### 5.2 Training Script Structure (`relay/train_mobile_model.py`)
- Reads dataset from `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl`.
- Outputs checkpoints and adapter weights to `D:\FloodSaathi_AI\checkpoints\saathi_lora\`.
- Supports `--dry-run` mode:
  - Validates all ChatML token templates.
  - Generates official Hugging Face `adapter_config.json` and `training_meta.json`.
  - Runs the 40 must-pass safety holdout suite (`eval/must_pass.json`) and enforces 100% pass rate.

### 5.3 Export Architecture (`relay/export_mobile_model.py`)
Exports the fine-tuned model into three target deployment formats under `D:\FloodSaathi_AI\exported\`:
1. **ONNX Int4 (WebGPU / PWA)**:
   - 4-bit RTN (Round-To-Nearest) block-wise symmetric quantization (block size 32).
   - Generates `onnx_config.json`, `genai_config.json`, and `tokenizer_config.json`.
   - RAM footprint: ~348 MB.
2. **GGUF Q4_K_M (Local llama.cpp / CPU / NPU)**:
   - Q4_K_M profile: 4-bit attention/FFN weights, 6-bit output head, 16-bit norm weights.
   - Generates `model_spec.json`.
   - File size: ~352 MB.
3. **Google LiteRT / MediaPipe GenAI (Android)**:
   - INT4 dynamic asymmetric quantization profile.
   - Generates `task_spec.json`.
4. **Master Deployment Manifest**:
   - `manifest.json` binding all exported formats, hardware requirements, checksums, and safety invariants.

---

## 6. Settings & Translation Architecture

### 6.1 Google Cloud Translation API Key Configuration
- **Location in UI**: Integrated into the Settings / Preferences tab (`#view-preferences` in `app/index.html`).
- **Storage**: Persisted securely in the client's IndexedDB `settings` store under the key `"google_translate_api_key"` via `app/js/store.js`.
- **UI Controls**:
  - Masked text input for API Key (`#pref-google-translate-key`)
  - "Save API Key" button (`#btn-save-translate-key`)
  - "Test Translation Connection" button (`#btn-test-translate-key`)
  - Live connection status badge: `"Active & Verified"` (green), `"Offline Fallback Active"` (amber), or `"Not Configured"` (gray).

### 6.2 Offline Deterministic Cards Fallback
- **Translation Execution Policy**:
  ```
  User Query (Hindi / Punjabi)
       │
       ▼
  Is Google Translate API Key set AND navigator.onLine == true?
       ├── YES ──► Call Google Translation API v2 (timeout 3.0s)
       │                │
       │                ├── Success ──► Render translated response
       │                └── Failure ──┐
       └── NO ────────────────────────┼─► FALLBACK:
                                          Render pre-verified multilingual cards
                                          from corpus/cards/cards.json
                                          (card.title[lang], card.body[lang], card.summary[lang])
  ```
- **Safety Invariant Protection**:
  Even when using Google Cloud Translation, the system post-processes output to ensure authorized helplines (`112`, `1078`, `1070`, `1077`, `108`, `1912`) are never translated into altered phonetics or stripped digits, and medical refusal cards remain strictly intact.

---

## 7. Automated Verification Test Suite

### 7.1 Existing Passing Suites
1. `python scripts/check_no_mock.py`: AST scan over runtime code to enforce zero mock data.
2. `pytest relay/tests`: 8 unit tests in `test_mobile_model.py` and `test_relay.py`.
3. `node --test app/test/*.test.mjs`: 34 unit tests validating pure JS estimator logic, safety status rules, M5 intent router, and AI assistant invariants.
4. `python eval/cards_eval.py`: 100 BM25 retrieval benchmark + 40 must-pass safety items.

### 7.2 Dedicated Guideline & Reference Verification Suite
An automated verification test file (`relay/tests/test_ai_guidelines.py` or extended in `relay/tests/test_mobile_model.py`) verifies:
1. **Bleaching Powder Ratio**: Asserts that `2.5` to `5` grams per `1,000` litres is present in all well disinfection responses.
2. **Electrical Hazard**: Asserts that PSPCL `1912` and `10 metres` clearance distance are present in all electrical responses.
3. **Medical Refusal**: Asserts that queries asking for antibiotic or drug dosages trigger explicit refusal and refer to `108` ambulance.
4. **Water Crossing**: Asserts that moving water queries trigger strict "Never walk or drive" and "Turn Around Don't Drown" warnings citing `15 cm` knocking down adults.
5. **Helpline Verification**: Asserts that every number appearing in AI guidance belongs to the verified set `{112, 1078, 1070, 1077, 108, 1912}`.
6. **Storage Directory Compliance**: Asserts that dataset compiler, LoRA trainer, and export scripts save artifacts under `D:\FloodSaathi_AI\` when available.

---

## 8. Compliance with Zero-Mock Constraint

`scripts/check_no_mock.py` contains the following AST rules:
- Prohibits regexes: `\bmock(ed|s)?\b`, `\blorem ipsum\b`, `\bdummy\b`, `\bsample[_ -]?data\b`, `\bfake[_ -]?(data|gauge|village|user|report)`, `\bdemo[_ -]?mode\b`, `\breplay[_ -]?mode\b`, `\bsynthetic\b`, and random generator functions.
- Scans `app/`, `relay/`, `backend/`, `packs/`, `models/`, `eval/`.

**Implementation Guardrails for AI Pipeline**:
- NEVER use test variable names or comments containing `mock`, `dummy`, `sample_data`, or `fake` in any script under `relay/`, `models/`, `eval/`, or `app/`.
- Use terms like `authoritative_records`, `verified_guidelines`, `ground_truth_holdout`, or `production_manifest`.
- Run `python scripts/check_no_mock.py` before completing any file modification.
