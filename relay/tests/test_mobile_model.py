# relay/tests/test_mobile_model.py
"""
Unit tests for mobile model training, quantization export, and safety dataset integrity.
Validates:
1. corpus/flood_safety_dataset.jsonl authoritative content and coverage.
2. relay/train_mobile_model.py LoRA configuration and 100% safety holdout pass rate.
3. relay/export_mobile_model.py ONNX Int4, GGUF, and LiteRT mobile export pipeline.
"""

import json
import pathlib
import pytest
from relay.train_mobile_model import (
    load_and_verify_dataset,
    format_chat_prompt,
    run_safety_holdout_evaluation,
    train_lora,
    parse_args,
    SYSTEM_PROMPT
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
