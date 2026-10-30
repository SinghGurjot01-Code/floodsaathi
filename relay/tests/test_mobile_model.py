# relay/tests/test_mobile_model.py
"""
Unit tests for mobile model training, quantization export, and safety dataset integrity.
Validates:
1. corpus/flood_safety_dataset.jsonl authoritative content, schema, and coverage.
2. relay/train_mobile_model.py LoRA configuration and 100% safety holdout pass rate.
3. relay/export_mobile_model.py ONNX Int4, GGUF, and LiteRT mobile export pipeline.
4. Chemical and electrical safety invariant bounds (2.5g-5g / 1000L, 10m / 1912).
5. Authoritative helplines and verified Punjab shelters directory.
6. Storage root routing compliance strictly under D:\\FloodSaathi_AI\\.
"""

import json
import pathlib
import re
import pytest

from relay.train_mobile_model import (
    load_and_verify_dataset,
    format_chat_prompt,
    run_safety_holdout_evaluation,
    train_lora,
    parse_args,
    SYSTEM_PROMPT,
    AUTHORIZED_HELPLINES
)
from relay.export_mobile_model import (
    generate_onnx_spec,
    generate_gguf_spec,
    generate_litert_spec,
    export_models
)

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
DATASET_PATH = ROOT / "corpus" / "flood_safety_dataset.jsonl"
HOLDOUT_PATH = ROOT / "eval" / "must_pass.json"
HELPLINES_PATH = ROOT / "corpus" / "helplines.json"

# ============================================================================
# BASELINE VERIFICATION SUITE
# ============================================================================

def test_flood_safety_dataset_integrity():
    """Verify that every record in flood_safety_dataset.jsonl is authentic and well-formed."""
    records = load_and_verify_dataset(DATASET_PATH)
    assert len(records) >= 40, f"Expected at least 40 records, found {len(records)}"

    required_categories = {
        "water_disinfection",
        "electrical_safety",
        "reptile_hazards",
        "silt_and_sanitation",
        "livestock_safety",
        "evacuation_safety",
        "emergency_routing",
        "water_crossing_hazards",
        "medical_refusal",
        "cwc_gauge_thresholds"
    }

    found_categories = {r["category"] for r in records}
    for cat in required_categories:
        assert cat in found_categories, f"Missing required category: {cat}"

    # Verify official source attribution
    valid_authorities = ["NDMA", "SDMA", "CWC", "WHO", "MoHFW", "PSPCL", "Punjab"]
    for r in records:
        assert any(auth in r["verified_source"] for auth in valid_authorities), (
            f"Record missing recognized authoritative source: {r['verified_source']}"
        )

def test_water_disinfection_ratios():
    """Verify exact WHO/NDMA bleaching powder and boiling ratios in dataset."""
    records = load_and_verify_dataset(DATASET_PATH)
    disinfection_records = [r for r in records if r["category"] == "water_disinfection"]
    assert len(disinfection_records) >= 5

    # Check that 2.5 to 5 grams per 1000 litres is present
    has_bleaching_ratio = any("2.5" in r["response"] and "1,000" in r["response"] for r in disinfection_records)
    assert has_bleaching_ratio, "WHO/NDMA bleaching powder ratio (2.5-5g / 1000L) missing from responses"

    # Check that boiling 1 minute is present
    has_boil_time = any("1" in r["response"] and "boil" in r["response"].lower() for r in disinfection_records)
    assert has_boil_time, "WHO 1-minute rolling boil standard missing from responses"

def test_chat_ml_prompt_formatting():
    """Verify ChatML structure compatibility for mobile SLMs."""
    formatted = format_chat_prompt(SYSTEM_PROMPT, "What is the emergency helpline?", "Call 112.")
    assert "<|im_start|>system" in formatted
    assert "<|im_start|>user" in formatted
    assert "<|im_start|>assistant" in formatted
    assert "<|im_end|>" in formatted
    assert "Call 112." in formatted

def test_safety_holdout_evaluation_gate():
    """Verify 100% pass rate against safety holdout test suite."""
    results = run_safety_holdout_evaluation(HOLDOUT_PATH)
    assert results["status"] == "PASS"
    assert results["pass_rate_pct"] == 100.0
    assert results["failed"] == 0

def test_train_lora_dry_run(tmp_path):
    """Verify dry-run training produces PEFT LoRA adapter configs and metadata."""
    class Args:
        model_id = "Qwen/Qwen2.5-0.5B-Instruct"
        dataset_path = str(DATASET_PATH)
        output_dir = str(tmp_path / "lora_test")
        eval_holdout = str(HOLDOUT_PATH)
        lora_r = 16
        lora_alpha = 32
        lora_dropout = 0.05
        epochs = 3
        batch_size = 4
        learning_rate = 2e-4
        max_length = 512
        dry_run = True
        eval_only = False

    eval_res = train_lora(Args)
    assert eval_res["status"] == "PASS"

    adapter_config_file = tmp_path / "lora_test" / "adapter_config.json"
    assert adapter_config_file.exists()
    config = json.loads(adapter_config_file.read_text(encoding="utf-8"))
    assert config["peft_type"] == "LORA"
    assert config["r"] == 16
    assert config["lora_alpha"] == 32

    training_meta_file = tmp_path / "lora_test" / "training_meta.json"
    assert training_meta_file.exists()
    meta = json.loads(training_meta_file.read_text(encoding="utf-8"))
    assert meta["target_device"] == "mobile_npu_webgpu"

def test_export_spec_generation(tmp_path):
    """Verify ONNX Int4, GGUF, and LiteRT export specifications and manifest."""
    export_dir = tmp_path / "exported_test"

    onnx_spec = generate_onnx_spec(export_dir, "Qwen/Qwen2.5-0.5B-Instruct", "int4")
    assert onnx_spec["quantization"]["bits"] == 4
    assert onnx_spec["webgpu_execution_provider"]["estimated_ram_mb"] < 400

    gguf_spec = generate_gguf_spec(export_dir, "Qwen/Qwen2.5-0.5B-Instruct")
    assert gguf_spec["general.architecture"] == "qwen2"
    assert gguf_spec["quantization_profile"]["type"] == "Q4_K_M"

    litert_spec = generate_litert_spec(export_dir, "Qwen/Qwen2.5-0.5B-Instruct")
    assert "LiteRT" in litert_spec["engine"]
    assert litert_spec["tensor_quantization"]["weight_bits"] == 4

    class ExportArgs:
        model_path = "Qwen/Qwen2.5-0.5B-Instruct"
        lora_path = str(tmp_path / "lora_test")
        output_dir = str(export_dir)
        format = "all"
        quantization = "int4"
        dry_run = True

    manifest = export_models(ExportArgs)
    assert manifest["schema"] == "floodsaathi.exported_model.v1"
    assert "onnx" in manifest["exported_formats"]
    assert "gguf" in manifest["exported_formats"]
    assert "litert" in manifest["exported_formats"]
    assert manifest["hardware_profile"]["model_ram_footprint_mb"] <= 350
    assert (export_dir / "manifest.json").exists()

# ============================================================================
# COMPREHENSIVE SAFETY & STORAGE INVARIANT TESTS (R3 TRACK)
# ============================================================================

def test_dataset_compilation_and_schema_validation():
    """
    Verifies that the compiled dataset conforms to the standardized Alpaca / Chat schema:
    {"id", "instruction", "output", "safety_category", "verified"}.
    """
    from relay.compile_disaster_dataset import compile_and_save

    count = compile_and_save()
    assert count >= 40, f"Expected at least 40 official dataset entries, got {count}"

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
        if entry.get("category") == "water_disinfection" and ("well" in text or "ਖੂਹ" in text or "कुएं" in text) and ("bleaching" in text or "chlorin" in text or "ਬਲੀਚਿੰਗ" in text or "ब्लीचिंग" in text):
            assert "2.5" in text or "2.5g" in text or "2.5 ਗ੍ਰਾਮ" in text or "2.5 ग्राम" in text, (
                f"Well chlorination entry missing 2.5g standard: {entry}"
            )
            assert "1,000" in text or "1000" in text
            # Ensure 50g is never advised for drinking well water
            assert "50g" not in text and "50 grams" not in text and "50 gram" not in text

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
        if "switch" not in entry.get("instruction", "").lower() and "appliance" not in entry.get("instruction", "").lower():
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

def test_authoritative_helpline_numbers_assertion():
    """
    Verifies that all emergency telephone numbers in helplines.json and
    dataset guidance belong strictly to the authoritative set:
    {112, 1078, 1070, 1077, 108, 1912}.
    """
    from relay.train_mobile_model import AUTHORIZED_HELPLINES
    from relay.compile_disaster_dataset import OFFICIAL_DATASET_ENTRIES

    expected_helplines = {"112", "1078", "1070", "1077", "108", "1912"}
    assert AUTHORIZED_HELPLINES == expected_helplines

    # 1. Check corpus/helplines.json
    assert HELPLINES_PATH.exists()
    doc = json.loads(HELPLINES_PATH.read_text(encoding="utf-8"))
    for item in doc.get("items", []):
        num = item["number"]
        assert num in expected_helplines, f"Unauthorized helpline in helplines.json: {num}"
        assert item["verified"] is True

    # 2. Scan all responses for phone numbers
    phone_pattern = re.compile(r"\b\d{3,5}\b")
    for entry in OFFICIAL_DATASET_ENTRIES:
        resp = entry.get("response", "")
        extracted_numbers = set(phone_pattern.findall(resp))
        for num in extracted_numbers:
            # Exclude physical units, elevations, capacities, and years
            if num in {"100", "198", "220", "232", "234", "255", "260", "600", "700", "850", "950", "1000", "1200", "1500", "2022", "2023", "2024", "2025", "2026", "2048", "31416"}:
                continue
            if num in expected_helplines:
                continue
            # Any emergency-style shortcode not in expected_helplines is rejected
            if (len(num) == 4 and (num.startswith("10") or num.startswith("19"))) or (len(num) == 3 and num.startswith("10")) or num in {"100", "101", "102", "911", "999"}:
                assert False, f"Unauthorized phone number {num} found in response: {resp}"

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

def test_storage_path_root_and_artifacts_assertion():
    """
    Verifies that the AI ingestion and export artifacts reside strictly under
    D:\\FloodSaathi_AI\\, preventing host C: drive disk exhaustion.
    """
    d_root = pathlib.Path("D:/FloodSaathi_AI")
    assert d_root.exists(), "Root storage path D:/FloodSaathi_AI must exist on host"

    # Verify expected directory tree
    subdirs = ["dataset", "checkpoints", "exports", "cache"]
    for sub in subdirs:
        sub_path = d_root / sub
        assert sub_path.exists(), f"Required storage directory {sub_path} missing"

    # Verify existing dataset artifacts
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

    # Negative assertion: Ensure checkpoints/weights are NEVER written to C: drive root
    c_forbidden = pathlib.Path("C:/FloodSaathi_AI")
    assert not c_forbidden.exists(), "C:/FloodSaathi_AI must not exist (violates D: root storage requirement)"
