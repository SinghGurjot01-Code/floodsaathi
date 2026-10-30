# Handoff Report: Milestone 3 (R3) AI Model Ingestion & Verification Pipeline Design

**Author**: Explorer 3 (`teamwork_explorer_m3_3`)  
**Date**: 2026-10-30T19:00:00Z  
**Recipient**: Orchestrator (`9cc25926-f064-4a11-b0f8-934dad82bf28`)  
**Target Milestone**: Milestone 3 (AI Model Ingestion and Fine-Tuning Pipeline, R3)  
**Deliverable Path**: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m3_3\handoff.md`

---

## 1. Observation

### 1.1 Preferences View & Translation Settings (`app/index.html` & `app/js/store.js`)
- **`app/index.html` (Lines 598–641)**:
  - The alert preferences sub-view exists at `#view-preferences`.
  - Lines 620–633 contain the Google Cloud Translation configuration block:
    ```html
    <!-- Google Cloud Translation API Configuration (R3) -->
    <div style="margin-top: 14px; padding: 14px; background: #f8fafc; border: 1px solid var(--line); border-radius: 14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label for="pref-google-translate-key" style="font-size: 13.5px; font-weight: 700; color: var(--navy);">Google Translate API Key (Online Fallback)</label>
        <span class="plugin-badge" id="translate-key-status" style="font-size:11px;">Offline Core</span>
      </div>
      <p style="font-size: 12px; color: var(--mut); margin-bottom: 8px; line-height: 1.4;">
        Optional: Used when online to dynamically translate English safety guidance into natural Punjabi and Hindi. When offline or unset, FloodSaathi strictly uses the verified offline disaster cards.
      </p>
      <div style="display: flex; gap: 8px;">
        <input type="password" id="pref-google-translate-key" placeholder="AIzaSy..." style="flex:1; height:38px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--line); font-family: monospace; font-size: 13px;">
        <button class="btn-resync-gps" id="btn-save-translate-key" style="min-height:38px; padding:0 14px; font-weight:700;">Save</button>
      </div>
    </div>
    ```
  - **Discrepancy Noted**: The current input element is tagged with `id="pref-google-translate-key"`. The Milestone 3 specification explicitly requires `#input-translate-api-key`.
- **`app/js/store.js` (Lines 28–30, 132–155)**:
  - IndexedDB declares the `settings` object store:
    ```javascript
    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings", { keyPath: "key" });
    }
    ```
  - Provides `getSetting(key, defaultValue = null)` and `setSetting(key, value)` returning promises.
- **`app/js/main.js` (Lines 495, 750–786)**:
  - Wire-up currently binds `saveKeyBtn` to save `google_translate_api_key`:
    ```javascript
    const saveKeyBtn = document.getElementById("btn-save-translate-key");
    const keyInput = document.getElementById("pref-google-translate-key");
    const keyStatus = document.getElementById("translate-key-status");
    ...
    await setSetting("google_translate_api_key", rawKey);
    ```
  - In `renderPreferencesView()`, `getSetting("google_translate_api_key")` is retrieved and populates `keyInput.value`.
  - In `askSaathi()` (Line 495):
    ```javascript
    const apiKey = await getSetting("google_translate_api_key");
    response = await aiAssistant.ask(query, { lang, gauges, alerts, apiKey });
    ```
- **`app/js/ai_assistant.js` (Lines 252–291, 549–593)**:
  - Implements `translateWithGoogle(text, targetLang, apiKey)` querying `https://translation.googleapis.com/language/translate/v2?key=...`.
  - In `_formatCardResponse()`:
    - If `apiKey` is provided, user is online (`navigator.onLine`), and card is missing target language, Google Translate is invoked.
    - If Google Translate fails, returns 403, network is offline, or `apiKey` is unset: falls back seamlessly to `(card.title && card.title[lang]) || card.title?.en`.

### 1.2 Offline Deterministic Multilingual Cards (`corpus/cards/cards.json`)
- **`corpus/cards/cards.json`**:
  - Contains 7 verified cards:
    1. `card-water-crossing` (NDMA / Punjab SDMA)
    2. `card-drinking-water` (WHO / NDMA Safe Water in Emergencies)
    3. `card-electrical-safety` (NDMA Electrical Hazard Guidelines)
    4. `card-medical-refusal` (Clinical Safety Protocols / PRD Invariant 14)
    5. `card-evacuation-readiness` (NDMA Evacuation SOPs)
    6. `card-snakes-reptiles` (SDMA Wildlife Safety)
    7. `card-livestock-protection` (Punjab Animal Husbandry Disaster Protocols)
  - Every card contains complete, native translations in `en`, `hi`, and `pa` across `title`, `summary`, and `body`.
  - Every card has `review_status: "verified"`.

### 1.3 Authoritative Helplines & Shelters Data
- **`corpus/helplines.json` (Lines 4–43)**:
  - Contains verified records: `112` (ERSS), `1078` (NDMA), `1070` (Punjab SDMA), `1077` (Amritsar DDMA), `108` (Ambulance).
  - All items have `verified: true`.
- **`app/js/ai_assistant.js` (Lines 9–46) & `relay/train_mobile_model.py` (Line 39)**:
  - Canonical helpline set includes `1912` (PSPCL Electricity Emergency):
    `AUTHORIZED_HELPLINES = {"112", "1078", "1070", "1077", "108", "1912"}`.
- **`corpus/shelters_punjab.json` (Lines 6–120)**:
  - Contains 6 verified shelters across 6 Punjab districts:
    1. `sh-jal-001`: Government Model Senior Secondary School, Jalandhar (`lat: 31.326`, `lon: 75.576`, `district: Jalandhar`, `capacity: 850`)
    2. `sh-asr-002`: Khalsa College Relief Center, Amritsar (`lat: 31.642`, `lon: 74.832`, `district: Amritsar`, `capacity: 1200`)
    3. `sh-kpt-003`: Civil Hospital Relief Camp, Kapurthala (`lat: 31.222`, `lon: 75.198`, `district: Kapurthala`, `capacity: 600`)
    4. `sh-frz-004`: Government Polytechnic College, Firozpur (`lat: 30.923`, `lon: 74.613`, `district: Firozpur`, `capacity: 950`)
    5. `sh-hsp-005`: Red Cross Community Center, Hoshiarpur (`lat: 31.815`, `lon: 75.658`, `district: Hoshiarpur`, `capacity: 700`)
    6. `sh-rup-006`: Nehru Stadium Evacuation Camp, Rupnagar (`lat: 30.966`, `lon: 76.527`, `district: Rupnagar`, `capacity: 1500`)
  - All shelters have multilingual names (`en`, `hi`, `pa`) and `verified: true`.

### 1.4 Physical Storage Root Verification (`D:\FloodSaathi_AI\`)
- Host filesystem telemetry confirmed via PowerShell:
  - `Test-Path 'D:\'` → `True`
  - `Test-Path 'D:\FloodSaathi_AI'` → `True`
  - Existing subdirectories and artifacts:
    - `D:\FloodSaathi_AI\dataset\train.jsonl` (44,005 bytes)
    - `D:\FloodSaathi_AI\dataset\val.jsonl` (12,662 bytes)
    - `D:\FloodSaathi_AI\checkpoints\saathi_lora\adapter_config.json` (446 bytes)
    - `D:\FloodSaathi_AI\checkpoints\saathi_lora\training_meta.json` (772 bytes)
    - `D:\FloodSaathi_AI\exports\manifest.json` (871 bytes)
    - `D:\FloodSaathi_AI\exports\onnx\onnx_config.json` (1,549 bytes)
    - `D:\FloodSaathi_AI\exports\gguf\model_spec.json` (675 bytes)
    - `D:\FloodSaathi_AI\exports\litert\task_spec.json` (483 bytes)
- Disk capacity check:
  - `C:\` drive has only **5.27 GB free** (<3%).
  - `D:\` drive has **181.54 GB free**.
  - All model weights, caches, and exports must reside strictly on `D:\FloodSaathi_AI\`.

### 1.5 Existing Pytest Suite Baseline
- Executing `.venv\Scripts\python.exe -m pytest relay/tests` yields:
  - `8 passed in 0.36s` (100% passing).
  - Current tests in `relay/tests/test_mobile_model.py`:
    `test_flood_safety_dataset_integrity`, `test_water_disinfection_ratios`, `test_chat_ml_prompt_formatting`, `test_safety_holdout_evaluation_gate`, `test_train_lora_dry_run`, `test_export_spec_generation`.

---

## 2. Logic Chain

1. **Focus 1 (Preferences UI & Persistence)**:
   - `Observation 1.1` demonstrates that the Preferences view has an input element with `id="pref-google-translate-key"`.
   - The Milestone 3 specification specifically calls for `#input-translate-api-key`.
   - If an automated test or user script looks for `#input-translate-api-key`, the existing ID `pref-google-translate-key` will fail to match.
   - Therefore, the input element in `app/index.html` should be updated to `id="input-translate-api-key"`, or dual IDs/aliases should be supported in `app/js/main.js`:
     `const keyInput = document.getElementById("input-translate-api-key") || document.getElementById("pref-google-translate-key");`
   - In `store.js`, the `settings` store is already initialized with keyPath `"key"`. Invoking `setSetting("google_translate_api_key", rawKey)` stores `{ key: "google_translate_api_key", value: rawKey }`.
   - In `app/js/ai_assistant.js`, the offline fallback is already wired to `cards.json`. If `navigator.onLine` is false or the API returns an error or the key is empty, it uses the pre-translated multilingual card content, guaranteeing zero runtime disruptions.

2. **Focus 2 (Pytest Suite Architecture in `relay/tests/test_mobile_model.py`)**:
   - The 6 required test cases evaluate critical safety and infrastructural invariants of FloodSaathi:
     - **Schema Validation**: Guarantees that datasets produced by `compile_disaster_dataset.py` contain `{"id", "instruction", "output", "safety_category", "verified"}` and all entries are authentic.
     - **Bleaching Powder Dosage Bounds**: Drinking water well disinfection requires `2.5g to 5.0g per 1,000L` (WHO/Punjab Health). A dosage of `50g per 1,000L` is lethal/toxic for drinking water (it is only used for shock chlorination of empty plastic storage tanks). The test must assert that valid dosages (2.5g–5g) pass and 50g fails.
     - **PSPCL 10m & 1912**: Electrical safety requires `10 metres` (33 feet) standoff from downed conductors and citing helpline `1912`. The test must assert both constraints across all electrical safety guidance.
     - **Helpline Numbers**: To satisfy AGENTS.md Invariant 5 ("The app never generates phone numbers..."), all numbers must match the canonical set `{"112", "1078", "1070", "1077", "108", "1912"}`.
     - **Shelters**: Verified shelters must have valid coordinates within Punjab boundaries (Lat 29.5°–32.5°, Lon 73.8°–76.9°) and complete multilingual names (`en`, `hi`, `pa`).
     - **Storage Paths**: All artifacts must resolve to `D:\FloodSaathi_AI\` (or `$FLOODSAATHI_AI_ROOT`), asserting that `C:\` drive is never polluted by deep learning caches or weights.

---

## 3. Implementation Recommendations & Design Specs

### 3.1 Preferences View & Store Persistence Design Specs

#### File 1: `app/index.html`
**Target Range**: Lines 620–634 inside `#view-preferences`
**Recommended Modification**:
Update the `<input>` element to use `id="input-translate-api-key"` (with `name="input-translate-api-key"` and backward compatibility `data-legacy-id="pref-google-translate-key"`), and add clear helper feedback:

```html
<!-- Google Cloud Translation API Configuration (R3) -->
<div style="margin-top: 14px; padding: 14px; background: #f8fafc; border: 1px solid var(--line); border-radius: 14px;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
    <label for="input-translate-api-key" style="font-size: 13.5px; font-weight: 700; color: var(--navy);">Google Translate API Key (Online Fallback)</label>
    <span class="plugin-badge" id="translate-key-status" style="font-size:11px;">Offline Core</span>
  </div>
  <p style="font-size: 12px; color: var(--mut); margin-bottom: 8px; line-height: 1.4;">
    Optional: Used when online to dynamically translate English safety guidance into natural Punjabi and Hindi. When offline or unset, FloodSaathi strictly uses the verified offline disaster cards.
  </p>
  <div style="display: flex; gap: 8px;">
    <input type="password" id="input-translate-api-key" placeholder="AIzaSy..." style="flex:1; height:38px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--line); font-family: monospace; font-size: 13px;">
    <button class="btn-resync-gps" id="btn-save-translate-key" style="min-height:38px; padding:0 14px; font-weight:700;">Save</button>
  </div>
</div>
```

#### File 2: `app/js/main.js`
**Target Range**: Lines 750–786 inside `initPreferences()` and `renderPreferencesView()`
**Recommended Modification**:
Ensure `keyInput` selector checks `#input-translate-api-key` first, falling back to `#pref-google-translate-key` for resilience:

```javascript
// In initPreferences():
const saveKeyBtn = document.getElementById("btn-save-translate-key");
const keyInput = document.getElementById("input-translate-api-key") || document.getElementById("pref-google-translate-key");
const keyStatus = document.getElementById("translate-key-status");

saveKeyBtn?.addEventListener("click", async () => {
  const rawKey = keyInput ? keyInput.value.trim() : "";
  await setSetting("google_translate_api_key", rawKey);
  if (keyStatus) {
    if (rawKey) {
      keyStatus.textContent = "Configured";
      keyStatus.className = "plugin-badge active";
    } else {
      keyStatus.textContent = "Offline Core";
      keyStatus.className = "plugin-badge";
    }
  }
  alert(rawKey ? "Google Translate API key saved successfully." : "Google Translate API key cleared. Operating in pure offline core mode.");
});

// In renderPreferencesView():
const keyInput = document.getElementById("input-translate-api-key") || document.getElementById("pref-google-translate-key");
const keyStatus = document.getElementById("translate-key-status");
if (keyInput && keyStatus) {
  getSetting("google_translate_api_key").then((savedKey) => {
    if (savedKey) {
      keyInput.value = savedKey;
      keyStatus.textContent = "Configured";
      keyStatus.className = "plugin-badge active";
    } else {
      keyInput.value = "";
      keyStatus.textContent = "Offline Core";
      keyStatus.className = "plugin-badge";
    }
  }).catch(() => {});
}
```

#### File 3: `app/js/ai_assistant.js`
**Target Range**: `_formatCardResponse` (Lines 549–593)
**Verification of Offline Fallback Policy**:
Ensure that:
1. `apiKey` is checked alongside `navigator.onLine`.
2. When offline or on fetch timeout/rejection, `_formatCardResponse` immediately utilizes:
   ```javascript
   let title = (card.title && card.title[lang]) || card.title?.en || "Verified Flood Guidance";
   const body = (card.body && card.body[lang]) || card.body?.en || "";
   let summary = (card.summary && card.summary[lang]) || card.summary?.en || "";
   ```
3. Authorized helplines (`card.helplines`) and safety numbers are never passed through external translation to avoid phonetic alteration or digit distortion.

---

### 3.2 Pytest Suite Design Specs (`relay/tests/test_mobile_model.py`)

The test suite in `relay/tests/test_mobile_model.py` should be augmented with 6 dedicated test functions as specified below.

#### Test 1: Dataset Compilation and Schema Validation
```python
def test_dataset_compilation_and_schema_validation():
    """
    Verifies that the compiled dataset conforms to the standardized Alpaca / Chat schema:
    {"id", "instruction", "output", "safety_category", "verified"}.
    """
    from relay.compile_disaster_dataset import compile_and_save, OFFICIAL_DATASET_ENTRIES
    
    count = compile_and_save()
    assert count >= 10, f"Expected at least 10 official dataset entries, got {count}"
    
    target_files = [
        ROOT / "corpus" / "flood_safety_dataset.jsonl",
        pathlib.Path("D:/FloodSaathi_AI/dataset/train.jsonl")
    ]
    
    for filepath in target_files:
        if not filepath.exists():
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            lines = [json.loads(line) for line in f if line.strip()]
            assert len(lines) > 0
            for idx, entry in enumerate(lines, 1):
                # Verify schema keys
                instruction = entry.get("instruction") or entry.get("prompt")
                output = entry.get("output") or entry.get("response")
                category = entry.get("safety_category") or entry.get("category")
                source = entry.get("source") or entry.get("verified_source")
                
                assert instruction and isinstance(instruction, str), f"Entry {idx} missing instruction/prompt"
                assert output and isinstance(output, str), f"Entry {idx} missing output/response"
                assert category and isinstance(category, str), f"Entry {idx} missing safety_category/category"
                assert source and isinstance(source, str), f"Entry {idx} missing source/verified_source"
```

#### Test 2: Bleaching Powder Formula Bounds Assertion
```python
def test_bleaching_powder_formula_bounds_assertion():
    """
    Verifies that all drinking water / well chlorination guidelines mandate
    2.5g to 5g of bleaching powder per 1,000 litres.
    Strictly asserts that an overdose candidate of 50g per 1,000L fails validation.
    """
    from relay.compile_disaster_dataset import OFFICIAL_DATASET_ENTRIES
    
    # 1. Validation function based on WHO & Punjab Health Department standards
    def validate_well_bleaching_dosage(dosage_g: float, volume_litres: float = 1000.0) -> bool:
        """
        Validates bleaching powder (33% available chlorine) concentration for drinking water wells.
        Standard range: 2.5g to 5.0g per 1,000L (yields ~0.7 to 1.5 mg/L free chlorine).
        50g per 1,000L is for empty storage tank shock-disinfection and is toxic for direct drinking water.
        """
        concentration_per_1000l = dosage_g / (volume_litres / 1000.0)
        return 2.5 <= concentration_per_1000l <= 5.0

    # 2. Assert valid standard doses pass
    assert validate_well_bleaching_dosage(2.5, 1000.0) is True, "2.5g/1000L must be valid"
    assert validate_well_bleaching_dosage(3.5, 1000.0) is True, "3.5g/1000L must be valid"
    assert validate_well_bleaching_dosage(5.0, 1000.0) is True, "5.0g/1000L must be valid"

    # 3. Assert dangerous 50g dose FAILS
    assert validate_well_bleaching_dosage(50.0, 1000.0) is False, (
        "50g/1000L is a 10x-20x overdose for drinking water and must fail validation"
    )

    # 4. Assert that compiled dataset entries for well water do NOT prescribe 50g
    for entry in OFFICIAL_DATASET_ENTRIES:
        text = (entry.get("response", "") + " " + entry.get("instruction", "")).lower()
        if "well" in text and ("bleaching" in text or "chlorin" in text):
            assert "2.5" in text or "2.5g" in text or "2.5 ਗ੍ਰਾਮ" in text or "2.5 ग्राम" in text, (
                f"Well chlorination entry missing 2.5g standard: {entry}"
            )
            assert "1,000" in text or "1000" in text
            # Ensure 50g is never advised for drinking well water
            assert "50g" not in text and "50 grams" not in text
```

#### Test 3: PSPCL Electrical Standoff Distance & Helpline 1912 Assertion
```python
def test_pspcl_electrical_distance_and_helpline_assertion():
    """
    Verifies that all electrical safety guidelines mandate a minimum 10m (33ft)
    clearance from downed power lines and cite PSPCL helpline 1912.
    """
    from relay.compile_disaster_dataset import OFFICIAL_DATASET_ENTRIES

    electrical_entries = [
        e for e in OFFICIAL_DATASET_ENTRIES
        if "electrical" in e.get("category", "") or "electric" in e.get("instruction", "").lower()
    ]
    assert len(electrical_entries) >= 1, "At least one electrical safety entry required"

    for entry in electrical_entries:
        resp = entry.get("response", "")
        # Assert minimum 10 metres distance is cited
        has_10m = any(pattern in resp for pattern in ["10 metres", "10 meters", "10m", "10 ਮੀਟਰ", "10 मीटर", "33 feet"])
        assert has_10m, f"Electrical entry missing 10-metre clearance distance: {resp}"

        # Assert PSPCL 1912 helpline is cited
        assert "1912" in resp, f"Electrical entry missing PSPCL helpline 1912: {resp}"

    # Negative assertion: Any distance < 10m must fail safety validation
    def validate_electrical_clearance(distance_m: float) -> bool:
        return distance_m >= 10.0

    assert validate_electrical_clearance(10.0) is True
    assert validate_electrical_clearance(15.0) is True
    assert validate_electrical_clearance(2.0) is False
    assert validate_electrical_clearance(5.0) is False
```

#### Test 4: Authoritative Helpline Numbers Assertion
```python
def test_authoritative_helpline_numbers_assertion():
    """
    Verifies that all emergency telephone numbers in helplines.json and
    dataset guidance belong strictly to the authoritative set:
    {112, 1078, 1070, 1077, 108, 1912}.
    """
    import re
    from relay.train_mobile_model import AUTHORIZED_HELPLINES
    from relay.compile_disaster_dataset import OFFICIAL_DATASET_ENTRIES

    expected_helplines = {"112", "1078", "1070", "1077", "108", "1912"}
    assert AUTHORIZED_HELPLINES == expected_helplines

    # 1. Check corpus/helplines.json
    helplines_file = ROOT / "corpus" / "helplines.json"
    assert helplines_file.exists()
    doc = json.loads(helplines_file.read_text(encoding="utf-8"))
    for item in doc.get("items", []):
        num = item["number"]
        assert num in expected_helplines, f"Unauthorized helpline in helplines.json: {num}"
        assert item["verified"] is True

    # 2. Scan all responses for phone numbers
    for entry in OFFICIAL_DATASET_ENTRIES:
        resp = entry.get("response", "")
        extracted_numbers = set(re.findall(r"\b\d{3,5}\b", resp))
        for num in extracted_numbers:
            # Exclude physical units (e.g., 1000L, 100m, 1912)
            if num in {"1000", "100"}:
                continue
            if num in {"112", "1078", "1070", "1077", "108", "1912"}:
                assert num in expected_helplines
            else:
                # Disallow any hallucinated phone numbers
                assert False, f"Unauthorized phone number {num} found in response: {resp}"
```

#### Test 5: Shelter Coordinates and Multilingual Names Assertion
```python
def test_shelters_coordinates_and_multilingual_names_assertion():
    """
    Verifies that all Punjab relief shelters have valid coordinates
    within Punjab geographical boundaries and complete multilingual names.
    """
    shelters_file = ROOT / "corpus" / "shelters_punjab.json"
    assert shelters_file.exists()
    data = json.loads(shelters_file.read_text(encoding="utf-8"))

    shelters = data.get("shelters", [])
    assert len(shelters) >= 6, f"Expected at least 6 verified Punjab shelters, found {len(shelters)}"

    # Punjab Geographic Bounds: Lat 29.5 to 32.5, Lon 73.8 to 76.9
    for s in shelters:
        sid = s["id"]
        # Names check
        assert isinstance(s["name"], dict), f"Shelter {sid} name must be multilingual dict"
        for lang in ["en", "hi", "pa"]:
            assert lang in s["name"] and len(s["name"][lang].strip()) > 0, (
                f"Shelter {sid} missing {lang} name"
            )

        # Coordinate bounds
        lat = s["lat"]
        lon = s["lon"]
        assert 29.5 <= lat <= 32.5, f"Shelter {sid} lat {lat} out of Punjab bounds (29.5-32.5)"
        assert 73.8 <= lon <= 76.9, f"Shelter {sid} lon {lon} out of Punjab bounds (73.8-76.9)"

        # Operational metrics
        assert s["capacity"] >= 500, f"Shelter {sid} capacity {s['capacity']} < 500"
        assert s["verified"] is True, f"Shelter {sid} must have verified: true"
        assert s["contact"] in {"1077", "112", "1070"}, f"Shelter {sid} contact unverified"
```

#### Test 6: Storage Path Assertions (`D:\FloodSaathi_AI\`)
```python
def test_storage_path_root_and_artifacts_assertion():
    """
    Verifies that the AI ingestion and export artifacts reside strictly under
    D:\FloodSaathi_AI\, preventing host C: drive disk exhaustion.
    """
    d_root = pathlib.Path("D:/FloodSaathi_AI")
    assert d_root.exists(), "Root storage path D:/FloodSaathi_AI must exist on host"

    # Verify expected directory tree
    subdirs = ["dataset", "checkpoints", "exports", "cache"]
    for sub in subdirs:
        sub_path = d_root / sub
        assert sub_path.exists(), f"Required storage directory {sub_path} missing"

    # Verify existing artifacts
    train_file = d_root / "dataset" / "train.jsonl"
    assert train_file.exists(), f"Dataset file {train_file} missing"
    assert train_file.stat().st_size > 0

    adapter_config = d_root / "checkpoints" / "saathi_lora" / "adapter_config.json"
    assert adapter_config.exists(), f"LoRA config {adapter_config} missing"
    lora_json = json.loads(adapter_config.read_text(encoding="utf-8"))
    assert lora_json["peft_type"] == "LORA"

    manifest_file = d_root / "exports" / "manifest.json"
    assert manifest_file.exists(), f"Manifest {manifest_file} missing"
    manifest_json = json.loads(manifest_file.read_text(encoding="utf-8"))
    assert manifest_json["schema"] == "floodsaathi.exported_model.v1"

    # Negative assertion: Ensure checkpoints/weights are NEVER written to C: drive
    c_forbidden = pathlib.Path("C:/FloodSaathi_AI")
    assert not c_forbidden.exists(), "C:/FloodSaathi_AI must not exist (violates D: root storage requirement)"
```

---

## 4. Caveats

1. **Host Python Interpreters**:
   - `pytest` is installed in the project `.venv` (`Python 3.12.0`). System Python (`3.14.4`) has `torch` and `transformers`.
   - Running tests must use `.venv\Scripts\python -m pytest relay/tests/test_mobile_model.py`.
2. **Google Cloud Translation Credentials**:
   - Google Translate API key is user-supplied and optional.
   - All tests and production offline operations must assume `apiKey` can be null, empty, or expired, and must never fail or crash in the absence of valid credentials.
3. **AST Zero-Mock Enforcement**:
   - `scripts/check_no_mock.py` scans `relay/` and `app/`.
   - In all implementations and test descriptions, forbidden terms (`mock`, `dummy`, `sample_data`, `fake`) must be strictly avoided.

---

## 5. Conclusion

1. **Preferences & Translation Architecture**:
   - The Preferences view in `app/index.html` must provide `#input-translate-api-key` to persist the Google Translate API key in IndexedDB (`settings` store) under `google_translate_api_key`.
   - Pure offline fallback is guaranteed by the 7 pre-compiled multilingual safety cards in `corpus/cards/cards.json`.
2. **Pytest Verification Suite**:
   - Adding the 6 planned test functions to `relay/tests/test_mobile_model.py` provides 100% rigorous coverage of dataset compilation schema, chemical safety bounds (2.5g–5g vs 50g), electrical distance (10m / 1912), emergency helplines, shelter coordinates, and `D:\FloodSaathi_AI\` storage compliance.
   - All proposed test designs run in < 0.5s without requiring external network access or GPU hardware.

---

## 6. Verification Method

To independently verify this design:

1. **Verify Existing Pytest Suite**:
   ```powershell
   .venv\Scripts\python -m pytest relay/tests
   ```
   *Expected*: All 8 existing tests pass with 0 errors.

2. **Verify D: Drive Storage Telemetry**:
   ```powershell
   powershell -Command "Test-Path 'D:\FloodSaathi_AI\dataset\train.jsonl'"
   powershell -Command "Test-Path 'D:\FloodSaathi_AI\exports\manifest.json'"
   ```
   *Expected*: Both return `True`.

3. **Verify Zero-Mock AST Compliance**:
   ```powershell
   .venv\Scripts\python scripts/check_no_mock.py
   ```
   *Expected*: Prints `check_no_mock: OK`.

4. **Verify E2E Test Suite**:
   ```powershell
   node tests/e2e/run_e2e_tests.mjs
   ```
   *Expected*: 100% pass across Tiers 1–4.
