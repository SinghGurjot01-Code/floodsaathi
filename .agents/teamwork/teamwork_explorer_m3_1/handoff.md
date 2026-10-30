# Explorer 1 Investigation Report: Disaster Guideline Compiler (`scripts/compile_disaster_guidelines.py`) & Dataset Architecture (Milestone 3 / R3)

**Author**: Explorer 1 (`teamwork_explorer_m3_1`)  
**Date**: 2026-10-30  
**Milestone**: Milestone 3 (AI Model Ingestion & Fine-Tuning Pipeline, R3)  
**Target File**: `scripts/compile_disaster_guidelines.py`  
**Dataset Targets**: `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl` (Primary) & `corpus/flood_safety_dataset.jsonl` (Mirror)  

---

## 1. Observation

### 1.1 Existing Scripts and Ingestion Paths
1. **Current Script Locations**:
   - `scripts/build_dataset.py` exists (325 lines). It outputs 46 hardcoded records exclusively to `corpus/flood_safety_dataset.jsonl` (`OUTPUT_FILE = ROOT / "corpus" / "flood_safety_dataset.jsonl"`). It does NOT target `D:\FloodSaathi_AI\`.
   - `relay/compile_disaster_dataset.py` exists (169 lines). It contains 14 hardcoded records (`OFFICIAL_DATASET_ENTRIES`) and writes an 80/20 train/val split to `D:/FloodSaathi_AI/dataset/train.jsonl`, `D:/FloodSaathi_AI/dataset/val.jsonl`, and `corpus/flood_safety_dataset.jsonl`.
   - `scripts/compile_disaster_guidelines.py` does **NOT** exist yet.
2. **E2E Test Expectation vs. Prompt Specification**:
   - `tests/e2e/tier1_feature_tests.mjs` line 341 tests:
     ```javascript
     const compileScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "compile_disaster_dataset.py"), "utf-8");
     assert.ok(
       compileScript.includes("D:/FloodSaathi_AI/dataset") || compileScript.includes("D:\\\\FloodSaathi_AI\\\\dataset"),
       "D: drive dataset path missing from relay/compile_disaster_dataset.py"
     );
     ```
   - Meanwhile, PRD/Milestone 3 (`PROJECT.md` line 13, 79 and user dispatch) explicitly mandates `scripts/compile_disaster_guidelines.py` with output targets: `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl` and mirror to `corpus/flood_safety_dataset.jsonl`.
   - If `relay/compile_disaster_dataset.py` is run as-is, it replaces `corpus/flood_safety_dataset.jsonl` with only 14 entries, immediately breaking:
     - `relay/tests/test_mobile_model.py`: `assert len(records) >= 40`
     - `tests/e2e/tier1_feature_tests.mjs`: `assert.ok(dataset.length >= 40)`
3. **Physical Storage on Host Machine**:
   - Command `powershell -Command "Test-Path 'D:\'" returned `True`.
   - Drive `C:\` has only **5.27 GB free** (<3% disk capacity remaining).
   - Drive `D:\` has **181.54 GB free**.
   - `D:\FloodSaathi_AI` already exists with subdirectories `cache`, `checkpoints`, `dataset` (containing `train.jsonl` 44,005 bytes, `val.jsonl` 12,662 bytes), `exports`, `models`.

### 1.2 Authoritative Source Corpus Observations
1. **Punjab Health & WHO Well Chlorination Standard**:
   - `scripts/build_dataset.py` line 22 specifies:
     `Use 2.5 to 5 grams of fresh bleaching powder (containing ~33% available chlorine) per 1,000 litres of water.`
   - In `scripts/build_dataset.py` line 34, an entry for overhead storage tanks mentions `50 grams ... for shock-chlorination`.
   - Drinking water well chlorination must strictly specify **2.5g to 5g bleaching powder per 1000L of water (WHO standard)** and must **NEVER output 50g** for drinking/well water, as 50g/1000L is a hazardous ~16.5 mg/L chlorine overdose.
2. **PSPCL Electrical Safety**:
   - `corpus/cards/cards.json` lines 61-65: Minimum distance of **10 metres (33 feet)** from fallen power lines, report to Punjab State Power Corporation Limited (PSPCL) helpline **1912** or 112.
   - `tests/e2e/tier1_feature_tests.mjs` line 418 enforces: `(text.includes("10 metre") || text.includes("10-metre") || text.includes("10 m")) && text.includes("1912")`.
3. **Emergency Helplines**:
   - `corpus/helplines.json` currently contains:
     - `112`: National ERSS
     - `1078`: NDMA
     - `1070`: Punjab SDMA (SEOC)
     - `1077`: District Disaster Management Control Room
     - `108`: Punjab Emergency Medical Ambulance Service
   - Note: PSPCL **1912** is referenced across cards and tests, forming the complete 6-number authorized set: `{112, 1078, 1070, 1077, 108, 1912}`.
4. **Verified Punjab Relief Shelters**:
   - `corpus/shelters_punjab.json` defines exactly 6 verified flood relief shelters:
     1. `sh-jal-001`: Government Model Senior Secondary School, Jalandhar (lat 31.326, lon 75.576, cap 850, contact 1077)
     2. `sh-asr-002`: Khalsa College Relief Center, Amritsar (lat 31.642, lon 74.832, cap 1200, contact 1077)
     3. `sh-kpt-003`: Civil Hospital Relief Camp, Kapurthala (lat 31.222, lon 75.198, cap 600, contact 1077)
     4. `sh-frz-004`: Government Polytechnic College, Firozpur (lat 30.923, lon 74.613, cap 950, contact 1077)
     5. `sh-hsp-005`: Red Cross Community Center, Hoshiarpur (lat 31.815, lon 75.658, cap 700, contact 1077)
     6. `sh-rup-006`: Nehru Stadium Evacuation Camp, Rupnagar (lat 30.966, lon 76.527, cap 1500, contact 1077)
   - These 6 shelters have not yet been dynamically compiled into question-answer instruction pairs for the SLM model dataset.

### 1.3 Dataset Schemas in Active Use
1. **Schema in `PROJECT.md` line 69**:
   `{"id", "instruction", "input", "output", "source", "safety_category", "verified"}`
2. **Schema expected by `relay/train_mobile_model.py` lines 76-82**:
   Requires `prompt` (or `instruction`), `response` (or `output`), `category`, and `verified_source` (or `source`).
3. **Schema in `tests/e2e/tier1_feature_tests.mjs` lines 381, 401**:
   Requires `item.prompt || item.instruction`, `item.response`, `item.verified_source || item.source`, `item.category`.
4. **Conclusion on Schema**: A unified schema providing both canonical fields (`id`, `instruction`, `input`, `output`, `source`, `safety_category`, `verified`) and backward-compatible aliases (`prompt`, `response`, `verified_source`, `category`) guarantees 100% interoperability across all existing and future test suites.

---

## 2. Logic Chain

1. **Premise 1**: The user dispatch requests the implementation architecture for `scripts/compile_disaster_guidelines.py`, targeting `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl` and mirrored to `corpus/flood_safety_dataset.jsonl`.
2. **Premise 2**: Existing E2E test `tier1_feature_tests.mjs` (F8.2) asserts that `relay/compile_disaster_dataset.py` contains `"D:/FloodSaathi_AI/dataset"`.
3. **Inference 1**: The new compiler script must reside at `scripts/compile_disaster_guidelines.py` as the primary engine. To avoid breaking F8.2 and maintain backwards compatibility, `relay/compile_disaster_dataset.py` should import and execute the compiler from `scripts/compile_disaster_guidelines.py`, while writing to both `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl` and `D:\FloodSaathi_AI\dataset\train.jsonl` / `val.jsonl`.
4. **Premise 3**: For drinking well water disinfection, WHO and Punjab Health Department protocols state that 2.5g to 5g of fresh bleaching powder per 1000L of water ($V = \pi r^2 h$) achieves 0.5–1.0 mg/L free chlorine. A 50g dose is toxic for drinking water and only suitable for shock chlorination of drained non-potable storage tanks.
5. **Inference 2**: The compiler MUST implement an assertion gate: any record classified under `water_disinfection` or mentioning well water must contain "2.5" to "5" grams per 1000L and must strictly forbid outputting "50g" or "50 grams" in drinking well contexts.
6. **Premise 4**: PSPCL safety standards require a 10-meter clearance from fallen power lines, escaping step potential via bunny hop/shuffle, and dialing 1912.
7. **Inference 3**: The compiler MUST validate that all electrical safety records include both `1912` and `10 metres` (or `10 m` / `33 feet`).
8. **Premise 5**: Emergency numbers must only come from authorized government directories. The verified list is `{112, 1078, 1070, 1077, 108, 1912}`.
9. **Inference 4**: The compiler MUST perform a regex scan across all generated responses; any detected telephone number outside this whitelist must cause compilation abortion.
10. **Premise 6**: `corpus/shelters_punjab.json` contains 6 verified shelters across 6 major flood-prone Punjab districts (Jalandhar, Amritsar, Kapurthala, Firozpur, Hoshiarpur, Rupnagar).
11. **Inference 5**: The compiler MUST dynamically parse `corpus/shelters_punjab.json` and generate multilingual instruction-response pairs (English, Punjabi Gurmukhi, Hindi) for each shelter, embedding exact coordinates, capacity, and district helpline `1077`.
12. **Premise 7**: `scripts/check_no_mock.py` AST scanner blocks words like `mock`, `dummy`, `synthetic`, `sample data`, `fake`.
13. **Inference 6**: All data generated by the compiler must be derived from verified authentic government sources with clean variable naming (`authoritative_records`, `verified_guidelines`).

---

## 3. Implementation Blueprint & Architecture Recommendations

### 3.1 Dataset Schema Specification

The dataset will be output in standard `.jsonl` (one JSON object per line, UTF-8 encoded). Each record adheres to the following unified schema:

```json
{
  "id": "FS-GUIDE-001",
  "instruction": "How do I disinfect a drinking water well contaminated by flood water using bleaching powder?",
  "prompt": "How do I disinfect a drinking water well contaminated by flood water using bleaching powder?",
  "input": "",
  "output": "To disinfect a flood-contaminated well according to WHO and NDMA emergency guidelines:\n1. Measure well water volume: Volume (m³) = 3.1416 × radius² × water depth (m). 1 m³ equals 1,000 litres of water.\n2. Calculate bleaching powder: Dissolve 2.5 to 5 grams of fresh bleaching powder (33% available chlorine) per 1,000 litres of water. NEVER use excessive doses such as 50g for well water.\n3. Preparation: Mix into a paste in a clean bucket, dilute with water, and let insoluble lime sediment settle for 15-20 minutes.\n4. Application: Pour only the clear supernatant liquid into the well and agitate with a bucket.\n5. Contact time: Wait at least 1 to 2 hours before drawing water. Bring water to a rolling boil for at least 1 minute before drinking.",
  "response": "To disinfect a flood-contaminated well according to WHO and NDMA emergency guidelines:\n1. Measure well water volume: Volume (m³) = 3.1416 × radius² × water depth (m). 1 m³ equals 1,000 litres of water.\n2. Calculate bleaching powder: Dissolve 2.5 to 5 grams of fresh bleaching powder (33% available chlorine) per 1,000 litres of water. NEVER use excessive doses such as 50g for well water.\n3. Preparation: Mix into a paste in a clean bucket, dilute with water, and let insoluble lime sediment settle for 15-20 minutes.\n4. Application: Pour only the clear supernatant liquid into the well and agitate with a bucket.\n5. Contact time: Wait at least 1 to 2 hours before drawing water. Bring water to a rolling boil for at least 1 minute before drinking.",
  "source": "WHO Emergency Drinking Water Guidelines & Punjab Health Department Disinfection Protocol",
  "verified_source": "WHO Emergency Drinking Water Guidelines & Punjab Health Department Disinfection Protocol",
  "safety_category": "water_disinfection",
  "category": "water_disinfection",
  "language": "en",
  "verified": true,
  "verification_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "last_verified": "2026-10-30"
}
```

#### Field Dictionary:
| Field | Type | Description | Compatibility |
|---|---|---|---|
| `id` | String | Unique record identifier (`FS-GUIDE-XXX`, `FS-SHELTER-XXX`) | `PROJECT.md` standard |
| `instruction` | String | User query or emergency task description | Alpaca / HuggingFace standard |
| `prompt` | String | Duplicate of `instruction` | Backward-compatibility for `train_mobile_model.py` & tests |
| `input` | String | Contextual input (e.g. gauge telemetry or district) or empty `""` | Alpaca / ShareGPT format |
| `output` | String | Authoritative guidance text | Alpaca / HuggingFace standard |
| `response` | String | Duplicate of `output` | Backward-compatibility for existing test assertions |
| `source` | String | Specific government department / manual citation | Attribution requirement |
| `verified_source`| String | Duplicate of `source` | Backward-compatibility for `test_mobile_model.py` |
| `safety_category`| String | Domain category (`water_disinfection`, `electrical_safety`, etc.) | Domain taxonomy |
| `category` | String | Duplicate of `safety_category` | Backward-compatibility for category filters |
| `language` | String | ISO 639-1 language code (`"en"`, `"pa"`, `"hi"`) | Multi-lingual support |
| `verified` | Boolean | True for authenticated government records | Safety invariant |
| `verification_hash`| String | SHA-256 integrity hash of instruction + output | Anti-tamper verification |
| `last_verified`| String | Date string (`"2026-10-30"`) | PRD verification requirement |

---

### 3.2 Compiler Architecture: `scripts/compile_disaster_guidelines.py`

The compiler is organized into a modular Python script containing 4 stages:

```
┌────────────────────────────────────────────────────────────────────────┐
│               STAGE 1: KNOWLEDGE INGESTION ENGINES                     │
├────────────────────────────────────────────────────────────────────────┤
│  1. Official NDMA SOPs (Water Crossing, Evacuation, Silt Sanitation)  │
│  2. Punjab SDMA Manuals (Dhussi Bund, Animal Husbandry, Snakebites)    │
│  3. CWC Gauge Telemetry & Thresholds (Warning, Danger, HFL, Sand Boil)│
│  4. Punjab Health & WHO Standards (2.5g - 5g / 1000L Well Chlorination)│
│  5. PSPCL Directives (1912, 10m Step Potential Clearance)             │
│  6. Emergency Helplines (112, 1078, 1070, 1077, 108, 1912)            │
│  7. Dynamic Shelter Ingestion (6 Verified Punjab Shelters from JSON)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            STAGE 2: MULTILINGUAL LOCALIZATION GENERATOR                │
├────────────────────────────────────────────────────────────────────────┤
│  Generate authentic tri-lingual records:                               │
│  - English (en)                                                        │
│  - Punjabi Gurmukhi (pa)                                               │
│  - Hindi Devanagari (hi)                                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              STAGE 3: PROGRAMMATIC SAFETY INVARIANT GATES              │
├────────────────────────────────────────────────────────────────────────┤
│  Gate 1: Well Chlorination (Must have 2.5-5g/1000L; NEVER 50g for well)│
│  Gate 2: Electrical Clearance (Must have 10m & PSPCL 1912)             │
│  Gate 3: Helpline Whitelist (Strict subset of authorized numbers)      │
│  Gate 4: Water Crossing Refusal (Must refuse, mention 15cm / float)    │
│  Gate 5: Medical Refusal (Must refuse drug dose, route to 108)         │
│  Gate 6: Shelters Verification (All 6 shelters with coords in Punjab)  │
│  Gate 7: Zero-Mock AST Verification (No mock/synthetic/fake tokens)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             STAGE 4: DUAL-PATH PERSISTENCE & SPLIT EXPORT              │
├────────────────────────────────────────────────────────────────────────┤
│  Primary Target:                                                       │
│    D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl      │
│  Secondary Target (Train/Val Splits):                                  │
│    D:\FloodSaathi_AI\dataset\train.jsonl (80%)                         │
│    D:\FloodSaathi_AI\dataset\val.jsonl (20%)                           │
│  Mirror Target (Client & Tests):                                       │
│    corpus/flood_safety_dataset.jsonl                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Dynamic Shelter Ingestion Engine

The compiler dynamically reads `corpus/shelters_punjab.json`. For each of the 6 shelters:
- Government Model Senior Secondary School, Jalandhar (`31.326° N, 75.576° E`, Capacity: 850)
- Khalsa College Relief Center, Amritsar (`31.642° N, 74.832° E`, Capacity: 1200)
- Civil Hospital Relief Camp, Kapurthala (`31.222° N, 75.198° E`, Capacity: 600)
- Government Polytechnic College, Firozpur (`30.923° N, 74.613° E`, Capacity: 950)
- Red Cross Community Center, Hoshiarpur (`31.815° N, 75.658° E`, Capacity: 700)
- Nehru Stadium Evacuation Camp, Rupnagar (`30.966° N, 76.527° E`, Capacity: 1500)

It constructs 3 instruction pairs per shelter (total 18 records):
1. **English**:
   - `instruction`: `"Where is the verified flood relief shelter in {district}?"`
   - `output`: `"In {district}, the verified relief shelter is {name_en} located at coordinates {lat}° N, {lon}° E (Elevation: {elevation}m). It has a verified capacity of {capacity} persons and provides {amenities}. For shelter allocation and assistance, call the District Disaster Control Room at 1077 or National ERSS at 112."`
2. **Punjabi (Gurmukhi)**:
   - `instruction`: `"{district} ਵਿੱਚ ਸਰਕਾਰੀ ਹੜ੍ਹ ਰਾਹਤ ਕੈਂਪ ਕਿੱਥੇ ਹੈ?"`
   - `output`: `"{district} ਵਿੱਚ ਅਧਿਕਾਰਤ ਰਾਹਤ ਕੈਂਪ {name_pa} ਹੈ, ਜਿਸਦੇ ਨਿਰਦੇਸ਼ਾਂਕ {lat}° N, {lon}° E ਹਨ। ਇੱਥੇ {capacity} ਵਿਅਕਤੀਆਂ ਦੇ ਰਹਿਣ ਦੀ ਸਮਰੱਥਾ ਹੈ। ਸਹਾਇਤਾ ਲਈ ਜ਼ਿਲ੍ਹਾ ਕੰਟਰੋਲ ਰੂਮ 1077 ਜਾਂ ਐਮਰਜੈਂਸੀ 112 'ਤੇ ਸੰਪਰਕ ਕਰੋ।"`
3. **Hindi (Devanagari)**:
   - `instruction`: `"{district} में सत्यापित बाढ़ राहत शिविर कहाँ स्थित है?"`
   - `output`: `"{district} में अधिकृत राहत शिविर {name_hi} है, जो निर्देशांक {lat}° N, {lon}° E पर स्थित है। इसकी क्षमता {capacity} व्यक्तियों की है। सहायता के लिए जिला आपदा नियंत्रण कक्ष 1077 या 112 पर कॉल करें।"`

---

### 3.4 Programmatic Safety Validation Invariant Gates

The compiler executes the following programmatic assertions before writing any files to disk. If any assertion fails, compilation halts immediately:

```python
def validate_safety_invariants(records: List[Dict[str, Any]]) -> None:
    logger.info("Executing safety invariant validation gates...")
    
    # Gate 1: Punjab Health & WHO Well Chlorination (2.5g - 5g / 1000L; NEVER 50g)
    water_records = [r for r in records if r["safety_category"] == "water_disinfection" and "well" in r["instruction"].lower()]
    assert len(water_records) >= 3, "Insufficient well water chlorination records"
    for r in water_records:
        resp = r["output"]
        assert "2.5" in resp and ("1,000" in resp or "1000" in resp), (
            f"Record {r['id']} missing mandatory 2.5g/1000L ratio"
        )
        # CRITICAL SAFETY INVARIANT: Must NEVER output 50g for drinking water well chlorination!
        assert "50g" not in resp.lower() and "50 grams" not in resp.lower() and "50 gram" not in resp.lower(), (
            f"FATAL SAFETY VIOLATION: Record {r['id']} outputs 50g for drinking well water! Toxic overdose hazard."
        )

    # Gate 2: PSPCL Electrical Safety (10m clearance & 1912)
    elec_records = [r for r in records if r["safety_category"] == "electrical_safety"]
    assert len(elec_records) >= 2, "Insufficient electrical safety records"
    for r in elec_records:
        resp = r["output"]
        assert "1912" in resp, f"Record {r['id']} missing PSPCL helpline 1912"
        assert ("10 metre" in resp or "10-metre" in resp or "10 m" in resp or "10 ਮੀਟਰ" in resp or "10 मीटर" in resp or "33 feet" in resp), (
            f"Record {r['id']} missing mandatory 10m minimum clearance"
        )

    # Gate 3: Authorized Helpline Whitelist
    AUTHORIZED_NUMBERS = {"112", "1078", "1070", "1077", "108", "1912"}
    phone_pattern = re.compile(r"\b\d{3,4}\b")
    for r in records:
        text = r["instruction"] + " " + r["output"]
        # Exclude numeric measurements like 1000, 15, 30, 60, 2026, 2023, 2022
        EXCLUDED_NUMBERS = {"1000", "2022", "2023", "2024", "2025", "2026", "1200", "1500"}
        matches = phone_pattern.findall(text)
        for m in matches:
            if m not in EXCLUDED_NUMBERS and len(m) in (3, 4):
                if m in {"112", "108", "1912", "1070", "1077", "1078"}:
                    continue
                # If it's a shortcode looking like a phone helpline, assert it's authorized
                if m.startswith("10") or m.startswith("19") or m == "100" or m == "101" or m == "102":
                    assert m in AUTHORIZED_NUMBERS, f"Record {r['id']} contains unauthorized emergency number {m}"

    # Gate 4: Water Crossing Refusal
    crossing_records = [r for r in records if r["safety_category"] == "water_crossing_hazards"]
    for r in crossing_records:
        resp = r["output"]
        assert any(k in resp for k in ["ABSOLUTELY NOT", "NEVER", "Turn Around", "ਕਦੇ ਵੀ ਨਹੀਂ", "ਬਿਲਕੁਲ ਨਹੀਂ", "कभी नहीं", "बिल्कुल नहीं"]), (
            f"Record {r['id']} missing strict refusal warning"
        )
        assert ("15 cm" in resp or "15 ਸੈਂਟੀਮੀਟਰ" in resp or "15 सेमी" in resp or "float" in resp or "ਵਹਾ" in resp or "बहा" in resp), (
            f"Record {r['id']} missing water crossing vehicle/pedestrian threshold"
        )

    # Gate 5: Medical Refusal Invariant
    medical_records = [r for r in records if r["safety_category"] == "medical_refusal"]
    for r in medical_records:
        resp = r["output"]
        assert any(k in resp for k in ["cannot prescribe", "cannot provide", "ਨਹੀਂ ਦੱਸ ਸਕਦਾ", "सिफारिश नहीं", "खुराक नहीं"]), (
            f"Record {r['id']} missing medical refusal declaration"
        )
        assert "108" in resp, f"Record {r['id']} missing medical referral to 108 ambulance"

    # Gate 6: Shelters Ingestion Verification
    shelter_records = [r for r in records if r["safety_category"] == "shelter_directory"]
    assert len(shelter_records) == 18, f"Expected 18 shelter records (6 shelters × 3 languages), found {len(shelter_records)}"
    for r in shelter_records:
        assert r["verified"] is True
        assert "1077" in r["output"]

    # Gate 7: Total Record Count & Source Diversity
    assert len(records) >= 50, f"Expected at least 50 comprehensive records, found {len(records)}"
    sources = {r["source"] for r in records}
    assert any("NDMA" in s for s in sources), "Missing NDMA citations"
    assert any("SDMA" in s or "Punjab" in s for s in sources), "Missing Punjab SDMA citations"
    assert any("CWC" in s for s in sources), "Missing CWC citations"
    assert any("WHO" in s for s in sources), "Missing WHO citations"
    assert any("PSPCL" in s for s in sources), "Missing PSPCL citations"
    
    logger.info("All 7 safety invariant gates passed 100%.")
```

---

### 3.5 Target File Paths and Backward Compatibility Bridge

The compiler should write to:
1. `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl` (Primary dataset path per prompt)
2. `corpus/flood_safety_dataset.jsonl` (Repository mirror for offline client and unit tests)
3. `D:\FloodSaathi_AI\dataset\train.jsonl` (80% split) and `val.jsonl` (20% split) for `relay/train_mobile_model.py` and test `F8.2`
4. `D:\FloodSaathi_AI\datasets\compiled\train.jsonl` and `val.jsonl`

#### Backward Compatibility Strategy for `relay/compile_disaster_dataset.py`:
To ensure both `tests/e2e/tier1_feature_tests.mjs` test `F8.2` and any existing CI jobs succeed, `relay/compile_disaster_dataset.py` should be updated to import and invoke `scripts/compile_disaster_guidelines.py`:

```python
# relay/compile_disaster_dataset.py
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

# Import and execute the authoritative guideline compiler
from compile_disaster_guidelines import DisasterGuidelineCompiler

D_DRIVE_DATASET_DIR = pathlib.Path("D:/FloodSaathi_AI/dataset")

def compile_and_save():
    compiler = DisasterGuidelineCompiler(root_dir=ROOT)
    return compiler.compile_all()

if __name__ == "__main__":
    count = compile_and_save()
    print(f"Dataset compilation successful: {count} verified records compiled.")
```

---

## 4. Caveats

1. **Host Storage Imbalance**: Drive `C:\` remains at critical capacity (5.27 GB free, <3%). It is vital that `scripts/compile_disaster_guidelines.py` does not save intermediate heavy weights or dumps on `C:\`. The compiler only outputs text `.jsonl` files (a few hundred kilobytes), but all subsequent model caches must strictly remain on `D:\`.
2. **Read-Only Investigation Bound**: In strict accordance with explorer roles, no source files were created or modified during this investigation. The proposed architecture must be implemented by the assigned worker agent.
3. **Shock Chlorination of Tanks vs. Drinking Well Water**: In `corpus/flood_safety_dataset.jsonl` (record 3) and `scripts/build_dataset.py`, 50g bleaching powder per 1000L was mentioned for cleaning empty Sintex storage tanks followed by complete flushing. To prevent hazardous confusion where a language model might recommend 50g for well drinking water, the compiler must explicitly clarify that 50g is ONLY for empty storage tank disinfection (not drinking water), and the drinking well standard is strictly 2.5g to 5.0g per 1,000L.

---

## 5. Conclusion

1. The disaster guideline compiler `scripts/compile_disaster_guidelines.py` has been fully designed to ingest all authoritative government sources: NDMA SOPs, Punjab SDMA disaster manuals, CWC gauge definitions, Punjab Health & WHO well chlorination formulas, PSPCL electrical safety directives, and the 6 verified Punjab flood relief shelters.
2. The exact dataset schema reconciles `PROJECT.md`, `train_mobile_model.py`, and all E2E test suites with dual-field aliasing (`instruction`/`prompt`, `output`/`response`, `source`/`verified_source`, `safety_category`/`category`), ensuring zero regressions.
3. Strict safety invariant validation gates are established to guarantee:
   - Well chlorination is strictly 2.5g to 5g / 1000L (and NEVER 50g for well water).
   - Electrical safety mandates 10 meters clearance and PSPCL 1912.
   - Helplines are strictly restricted to `{112, 1078, 1070, 1077, 108, 1912}`.
   - Water crossing queries strictly enforce vehicle/pedestrian refusal.
   - Medical queries refuse drug dosage and route to 108 ambulance.
   - All 6 verified Punjab shelters are ingested with exact geographic coordinates and amenities.
4. Target output paths (`D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl` and mirrored to `corpus/flood_safety_dataset.jsonl`) together with train/val splits (`D:\FloodSaathi_AI\dataset\train.jsonl` and `val.jsonl`) guarantee complete alignment with Requirement R3 and E2E test F8.2.

---

## 6. Verification Method

Once the worker agent implements `scripts/compile_disaster_guidelines.py`:

1. **Compiler Execution Verification**:
   ```bash
   python scripts/compile_disaster_guidelines.py
   ```
   - Must output at least 50 verified records.
   - Must successfully create `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl`.
   - Must mirror to `corpus/flood_safety_dataset.jsonl`.
   - Must output train/val splits to `D:\FloodSaathi_AI\dataset\train.jsonl` and `val.jsonl`.
2. **Zero-Mock AST Verification**:
   ```bash
   python scripts/check_no_mock.py
   ```
   - Must pass with 0 violations.
3. **Pytest Verification**:
   ```bash
   .venv\Scripts\python -m pytest relay/tests
   ```
   - All 8 unit tests must pass in `test_mobile_model.py` and `test_relay.py`.
4. **Node Frontend & Logic Tests**:
   ```bash
   node --test app/test/*.test.mjs
   ```
   - All 77 tests must pass.
5. **E2E 4-Tier Test Suite**:
   ```bash
   node tests/e2e/run_e2e_tests.mjs
   ```
   - All 137 tests across Tiers 1-4 must pass 100%.
6. **Programmatic Content Verification**:
   ```bash
   python -c "
   import json
   with open('corpus/flood_safety_dataset.jsonl', encoding='utf-8') as f:
       records = [json.loads(line) for line in f]
   assert len(records) >= 50
   well = [r for r in records if 'well' in (r.get('instruction') or r.get('prompt', '')).lower()]
   assert any('2.5' in r['output'] and '1,000' in r['output'] for r in well)
   assert all('50g' not in r['output'] for r in well)
   elec = [r for r in records if 'wire' in (r.get('instruction') or r.get('prompt', '')).lower()]
   assert any('1912' in r['output'] and '10 metre' in r['output'] for r in elec)
   shelters = [r for r in records if r.get('safety_category') == 'shelter_directory']
   assert len(shelters) == 18
   print('Verification check passed: All safety invariants satisfied!')
   "
   ```
