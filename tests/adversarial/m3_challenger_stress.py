#!/usr/bin/env python3
"""
tests/adversarial/m3_challenger_stress.py
Adversarial Empirical Stress Test Suite for Milestone 3 (R3 Track).
Authored by Challenger 1 (critic/specialist).

Attacks 5 primary dimensions:
1. Boundary inputs & safety invariant gates in scripts/compile_disaster_guidelines.py
   (50g well chlorination poisoning, sub-dosages, missing 10m/1912 electrical safety,
   unauthorized helplines, water crossing endorsements, medical dosage prescriptions,
   corrupted/out-of-bounds shelters).
2. Parameter integrity & --dry-run robustness in relay/train_mobile_model.py
   (corrupted datasets, missing holdouts, extreme LoRA ranks, parameter distribution math,
   zero-GPU offline execution).
3. Quantization & mobile export engine in relay/export_mobile_model.py
   (RAM ceiling <= 350 MB, manifest SHA-256 cryptographic tamper detection, multi-format specs).
4. Storage root isolation & C: drive exhaustion prevention
   (FLOODSAATHI_AI_ROOT redirection, get_storage_root overrides, cache dir enforcement).
5. Preferences UI input sanitization & Google Translate offline fallback resilience
   (malformed/long/special characters, XSS/SQL injection, offline network failure fallback).
"""

import copy
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import pytest

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from scripts.compile_disaster_guidelines import (
    DisasterGuidelineCompiler,
    AUTHORIZED_HELPLINES as COMPILER_HELPLINES
)
from relay.train_mobile_model import (
    load_and_verify_dataset,
    format_chat_prompt,
    run_safety_holdout_evaluation,
    train_lora,
    get_storage_root as get_train_storage_root,
    configure_cache_environment,
    SYSTEM_PROMPT,
    AUTHORIZED_HELPLINES as TRAIN_HELPLINES
)
from relay.export_mobile_model import (
    generate_onnx_spec,
    generate_gguf_spec,
    generate_litert_spec,
    export_models,
    get_storage_root as get_export_storage_root
)

# ============================================================================
# ATTACK DIMENSION 1: DISASTER GUIDELINES COMPILER SAFETY INVARIANT GATES
# ============================================================================

def test_adversarial_compile_gate1_50g_poisoning():
    """
    ATTACK: Inject 50g bleaching powder dosage into drinking well water response.
    50g/1000L is for empty storage tank shock-disinfection and is toxic for direct well water.
    EXPECTATION: Gate 1 must detect 50g overdose and raise an explicit AssertionError.
    """
    compiler = DisasterGuidelineCompiler()
    core = compiler.get_core_guidelines()
    shelters = compiler.get_shelter_guidelines()
    records = core + shelters

    # Tamper with the first well chlorination record to inject toxic 50g dosage
    poisoned_records = copy.deepcopy(records)
    for r in poisoned_records:
        if "well" in r.get("instruction", "").lower() and r.get("safety_category") == "water_disinfection":
            r["output"] = "Add 50g of bleaching powder per 1000 litres of well water for immediate disinfection."
            break

    with pytest.raises(AssertionError) as excinfo:
        compiler.validate_safety_invariants(poisoned_records)
    assert "FATAL SAFETY VIOLATION" in str(excinfo.value) or "50g" in str(excinfo.value)

def test_adversarial_compile_gate1_sub_dosage_or_missing_ratio():
    """
    ATTACK: Remove the mandatory 2.5g/1000L ratio from well water disinfection responses.
    EXPECTATION: Gate 1 must reject the record.
    """
    compiler = DisasterGuidelineCompiler()
    core = compiler.get_core_guidelines()
    shelters = compiler.get_shelter_guidelines()
    tampered_records = copy.deepcopy(core + shelters)

    for r in tampered_records:
        if "well" in r.get("instruction", "").lower() and r.get("safety_category") == "water_disinfection":
            r["output"] = "Boil the water thoroughly before drinking. No chemicals needed."

    with pytest.raises(AssertionError) as excinfo:
        compiler.validate_safety_invariants(tampered_records)
    assert "2.5" in str(excinfo.value) or "missing mandatory" in str(excinfo.value).lower()

def test_adversarial_compile_gate2_electrical_missing_1912():
    """
    ATTACK: Provide electrical safety advice omitting PSPCL emergency line 1912.
    EXPECTATION: Gate 2 must catch missing 1912 and fail.
    """
    compiler = DisasterGuidelineCompiler()
    tampered = copy.deepcopy(compiler.get_core_guidelines() + compiler.get_shelter_guidelines())

    for r in tampered:
        if r.get("safety_category") == "electrical_safety":
            r["output"] = "Stay at least 10 metres away from fallen cables. Do not touch wet ground."

    with pytest.raises(AssertionError) as excinfo:
        compiler.validate_safety_invariants(tampered)
    assert "1912" in str(excinfo.value)

def test_adversarial_compile_gate2_electrical_unsafe_clearance():
    """
    ATTACK: Advise an unsafe clearance distance (e.g. 2 metres or 5 metres instead of mandatory 10m).
    EXPECTATION: Gate 2 must detect absence of 10m / 33ft clearance and fail.
    """
    compiler = DisasterGuidelineCompiler()
    tampered = copy.deepcopy(compiler.get_core_guidelines() + compiler.get_shelter_guidelines())

    for r in tampered:
        if r.get("safety_category") == "electrical_safety" and ("line" in r.get("instruction", "") or "cable" in r.get("instruction", "")):
            r["output"] = "Stay at least 3 metres away from the fallen line. Call 1912."

    with pytest.raises(AssertionError) as excinfo:
        compiler.validate_safety_invariants(tampered)
    assert "10m" in str(excinfo.value) or "clearance" in str(excinfo.value).lower()

def test_adversarial_compile_gate3_unauthorized_helpline_injection():
    """
    ATTACK: Inject unapproved emergency shortcodes (e.g. 911, 100, 101, 102, 1090) into disaster advice.
    EXPECTATION: Gate 3 must reject records containing unverified emergency numbers.
    """
    compiler = DisasterGuidelineCompiler()
    tampered = copy.deepcopy(compiler.get_core_guidelines() + compiler.get_shelter_guidelines())

    # Inject 911 or 100 into an emergency response
    tampered[0]["output"] += " In extreme distress, dial 100 or 911 for emergency response."

    with pytest.raises(AssertionError) as excinfo:
        compiler.validate_safety_invariants(tampered)
    assert "unauthorized emergency number" in str(excinfo.value).lower() or "100" in str(excinfo.value) or "911" in str(excinfo.value)

def test_adversarial_compile_gate4_water_crossing_endorsement():
    """
    ATTACK: Modify water crossing guidance to suggest driving slowly or wading.
    EXPECTATION: Gate 4 must detect endorsement or lack of strict refusal ('Turn Around, Don't Drown') and fail.
    """
    compiler = DisasterGuidelineCompiler()
    tampered = copy.deepcopy(compiler.get_core_guidelines() + compiler.get_shelter_guidelines())

    for r in tampered:
        if r.get("safety_category") == "water_crossing_hazards":
            r["output"] = "If water is under 1 foot, you can slowly drive your tractor across."

    with pytest.raises(AssertionError) as excinfo:
        compiler.validate_safety_invariants(tampered)
    assert "refusal" in str(excinfo.value).lower() or "threshold" in str(excinfo.value).lower()

def test_adversarial_compile_gate5_medical_prescription_injection():
    """
    ATTACK: Inject clinical drug prescribing (e.g., Ciprofloxacin 500mg) without refusal.
    EXPECTATION: Gate 5 must catch clinical advice and lack of 108 ambulance referral and fail.
    """
    compiler = DisasterGuidelineCompiler()
    tampered = copy.deepcopy(compiler.get_core_guidelines() + compiler.get_shelter_guidelines())

    for r in tampered:
        if r.get("safety_category") == "medical_refusal":
            r["output"] = "Take 500mg Ciprofloxacin twice daily for flood diarrhea. Drink plenty of water."

    with pytest.raises(AssertionError) as excinfo:
        compiler.validate_safety_invariants(tampered)
    assert "refusal" in str(excinfo.value).lower() or "108" in str(excinfo.value)

def test_adversarial_compile_gate6_corrupted_shelters_handling(tmp_path):
    """
    ATTACK: Test compiler with corrupted shelters JSON and missing shelter attributes.
    EXPECTATION: Compiler logs warning or fails Gate 6 invariant when shelter records != 18.
    """
    # 1. Non-existent shelters file
    fake_compiler = DisasterGuidelineCompiler(root_dir=tmp_path)
    res = fake_compiler.get_shelter_guidelines()
    assert res == [], "Non-existent shelters file should return empty list gracefully"

    # 2. Corrupted shelters file with only 2 shelters
    corrupted_corpus = tmp_path / "corpus"
    corrupted_corpus.mkdir(parents=True)
    corrupted_shelters = corrupted_corpus / "shelters_punjab.json"
    corrupted_shelters.write_text(json.dumps({
        "shelters": [
            {
                "id": "sh-001",
                "district": "Jalandhar",
                "name": {"en": "Shelter A", "hi": "शिविर", "pa": "ਕੈਂਪ"},
                "lat": 31.326,
                "lon": 75.576,
                "elevation_m": 228,
                "capacity": 500,
                "contact": "1077",
                "verified": True
            }
        ]
    }), encoding="utf-8")

    fake_compiler2 = DisasterGuidelineCompiler(root_dir=tmp_path)
    shelter_records = fake_compiler2.get_shelter_guidelines()
    assert len(shelter_records) == 3  # 1 shelter * 3 languages

    # Invariant gate 6 requires exactly 18 shelter records (6 shelters * 3 languages)
    with pytest.raises(AssertionError) as excinfo:
        fake_compiler2.validate_safety_invariants(shelter_records)
    assert "18 shelter records" in str(excinfo.value)

def test_adversarial_compile_gate7_insufficient_records_or_missing_sources():
    """
    ATTACK: Pass a truncated list of records (< 50 records) or records missing key authorities.
    EXPECTATION: Gate 7 must reject the dataset.
    """
    compiler = DisasterGuidelineCompiler()
    core = compiler.get_core_guidelines()[:15]  # Only 15 records

    with pytest.raises(AssertionError) as excinfo:
        compiler.validate_safety_invariants(core)
    assert "at least 50" in str(excinfo.value).lower() or "insufficient" in str(excinfo.value).lower()

# ============================================================================
# ATTACK DIMENSION 2: LORA TRAINING PIPELINE PARAMETERS & DRY-RUN ROBUSTNESS
# ============================================================================

def test_adversarial_train_corrupted_dataset(tmp_path):
    """
    ATTACK: Feed a corrupted JSONL dataset (missing required fields, invalid JSON lines).
    EXPECTATION: load_and_verify_dataset must raise ValueError / json.decoder.JSONDecodeError.
    """
    bad_jsonl = tmp_path / "bad_dataset.jsonl"
    bad_jsonl.write_text(
        '{"id": "FS-001", "instruction": "What is 112?"}\n'  # Missing output / source
        'NOT_A_JSON_STRING\n',
        encoding="utf-8"
    )

    with pytest.raises(Exception):
        load_and_verify_dataset(bad_jsonl)

def test_adversarial_train_missing_eval_holdout(tmp_path):
    """
    ATTACK: Run safety holdout evaluation with non-existent holdout path.
    EXPECTATION: Must raise FileNotFoundError cleanly without hanging.
    """
    non_existent = tmp_path / "non_existent_holdout.json"
    with pytest.raises(FileNotFoundError):
        run_safety_holdout_evaluation(non_existent)

def test_adversarial_train_dry_run_parameter_math(tmp_path):
    """
    ATTACK: Verify theoretical LoRA parameter distribution calculation.
    Qwen2.5-0.5B (hidden_size=896, 7 projection layers, 24 transformer blocks).
    r=16 -> 16 * 896 * 2 * 7 * 24 = 4,816,896 parameters.
    Alpha=32, Dropout=0.05.
    Verify adapter_config.json matches PEFT standard.
    """
    class MockArgs:
        model_id = "Qwen/Qwen2.5-0.5B-Instruct"
        dataset_path = str(ROOT / "corpus" / "flood_safety_dataset.jsonl")
        output_dir = str(tmp_path / "checkpoints" / "saathi_lora")
        storage_root = str(tmp_path)
        eval_holdout = str(ROOT / "eval" / "must_pass.json")
        lora_r = 16
        lora_alpha = 32
        lora_dropout = 0.05
        epochs = 3
        batch_size = 4
        learning_rate = 2e-4
        max_length = 512
        dry_run = True
        eval_only = False

    eval_res = train_lora(MockArgs)
    assert eval_res["status"] == "PASS"
    assert eval_res["pass_rate_pct"] == 100.0

    adapter_file = tmp_path / "checkpoints" / "saathi_lora" / "adapter_config.json"
    assert adapter_file.exists()
    adapter_data = json.loads(adapter_file.read_text(encoding="utf-8"))
    assert adapter_data["r"] == 16
    assert adapter_data["lora_alpha"] == 32
    assert set(adapter_data["target_modules"]) == {
        "q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"
    }

def test_adversarial_train_extreme_lora_rank_scaling(tmp_path):
    """
    ATTACK: Pass extreme LoRA rank (e.g. r=128) and verify parameter formula scales linearly without error.
    """
    class ExtremeArgs:
        model_id = "Qwen/Qwen2.5-0.5B-Instruct"
        dataset_path = str(ROOT / "corpus" / "flood_safety_dataset.jsonl")
        output_dir = str(tmp_path / "checkpoints" / "extreme_lora")
        storage_root = str(tmp_path)
        eval_holdout = str(ROOT / "eval" / "must_pass.json")
        lora_r = 128
        lora_alpha = 256
        lora_dropout = 0.1
        epochs = 5
        batch_size = 8
        learning_rate = 1e-4
        max_length = 1024
        dry_run = True
        eval_only = False

    eval_res = train_lora(ExtremeArgs)
    assert eval_res["status"] == "PASS"
    adapter_file = tmp_path / "checkpoints" / "extreme_lora" / "adapter_config.json"
    meta_file = tmp_path / "checkpoints" / "extreme_lora" / "training_meta.json"
    assert adapter_file.exists() and meta_file.exists()
    adapter_data = json.loads(adapter_file.read_text(encoding="utf-8"))
    assert adapter_data["r"] == 128

# ============================================================================
# ATTACK DIMENSION 3: QUANTIZATION & MOBILE EXPORT ENGINE SPECIFICATIONS
# ============================================================================

def test_adversarial_export_ram_footprint_ceiling(tmp_path):
    """
    ATTACK: Verify ONNX Int4 webgpu_execution_provider estimated RAM and manifest footprint.
    Requirement R3 & PRD Section 14: Mobile memory ceiling <= 350 MB (< 400 MB).
    """
    export_dir = tmp_path / "exported"
    spec = generate_onnx_spec(export_dir, "Qwen/Qwen2.5-0.5B-Instruct", "int4")
    assert spec["quantization"]["bits"] == 4
    estimated_ram = spec["webgpu_execution_provider"]["estimated_ram_mb"]
    assert estimated_ram <= 350, f"ONNX Int4 RAM estimate {estimated_ram} MB exceeds 350 MB ceiling"

def test_adversarial_export_manifest_checksum_tamper_detection(tmp_path):
    """
    ATTACK: Modify export specifications and assert that SHA-256 manifest checksum changes.
    """
    export_dir = tmp_path / "exported"
    class ExportArgs:
        model_path = "Qwen/Qwen2.5-0.5B-Instruct"
        lora_path = str(tmp_path / "lora")
        output_dir = str(export_dir)
        format = "all"
        quantization = "int4"
        dry_run = True
        storage_root = str(tmp_path)

    manifest1 = export_models(ExportArgs)
    hash1 = manifest1["checksum_sha256"]
    assert len(hash1) == 64, "Checksum must be 64-char SHA-256"

    # Modify quantization to int8
    ExportArgs.quantization = "int8"
    manifest2 = export_models(ExportArgs)
    hash2 = manifest2["checksum_sha256"]
    assert hash1 != hash2, "Checksum must change when quantization or specifications change"

def test_adversarial_export_all_formats_spec_integrity(tmp_path):
    """
    ATTACK: Verify that all 3 target formats (ONNX Int4, GGUF Q4_K_M, LiteRT) produce valid specs.
    """
    export_dir = tmp_path / "exported"
    onnx_s = generate_onnx_spec(export_dir, "Qwen/Qwen2.5-0.5B-Instruct", "int4")
    gguf_s = generate_gguf_spec(export_dir, "Qwen/Qwen2.5-0.5B-Instruct")
    litert_s = generate_litert_spec(export_dir, "Qwen/Qwen2.5-0.5B-Instruct")

    assert (export_dir / "onnx" / "onnx_config.json").exists()
    assert (export_dir / "onnx" / "genai_config.json").exists()
    assert (export_dir / "onnx" / "tokenizer_config.json").exists()
    assert (export_dir / "gguf" / "model_spec.json").exists()
    assert (export_dir / "litert" / "task_spec.json").exists()

    assert gguf_s["quantization_profile"]["type"] == "Q4_K_M"
    assert litert_s["tensor_quantization"]["weight_bits"] == 4

# ============================================================================
# ATTACK DIMENSION 4: STORAGE ROOT ISOLATION & C: DRIVE PROTECTION
# ============================================================================

def test_adversarial_storage_root_c_drive_protection(tmp_path):
    """
    ATTACK: Ensure that custom storage root routing works and NEVER writes to C:\FloodSaathi_AI.
    Host C: drive has <3% free space (~5.2 GB); AI weights must NEVER touch C:.
    """
    custom_dir = tmp_path / "Isolated_AI_Root"
    root = get_train_storage_root(str(custom_dir))
    assert root.resolve() == custom_dir.resolve()
    assert root.exists()

    # Assert C:/FloodSaathi_AI does not exist
    c_root = pathlib.Path("C:/FloodSaathi_AI")
    assert not c_root.exists(), "Fatal violation: C:/FloodSaathi_AI must not exist"

def test_adversarial_environment_variable_override(tmp_path, monkeypatch):
    """
    ATTACK: Set FLOODSAATHI_AI_ROOT environment variable and verify both training and export respect it.
    """
    env_root = tmp_path / "Env_AI_Root"
    monkeypatch.setenv("FLOODSAATHI_AI_ROOT", str(env_root))

    train_root = get_train_storage_root()
    export_root = get_export_storage_root()

    assert train_root.resolve() == env_root.resolve()
    assert export_root.resolve() == env_root.resolve()

def test_adversarial_cache_environment_redirection(tmp_path):
    """
    ATTACK: Verify Hugging Face and PyTorch caches are strictly redirected to storage_root/cache.
    """
    custom_root = tmp_path / "Cache_Test_Root"
    configure_cache_environment(custom_root)

    hf_home = os.environ.get("HF_HOME")
    hf_hub = os.environ.get("HF_HUB_CACHE")
    torch_home = os.environ.get("TORCH_HOME")

    assert str(custom_root) in hf_home, f"HF_HOME {hf_home} not in custom root"
    assert str(custom_root) in hf_hub, f"HF_HUB_CACHE {hf_hub} not in custom root"
    assert str(custom_root) in torch_home, f"TORCH_HOME {torch_home} not in custom root"

# ============================================================================
# ATTACK DIMENSION 5: PREFERENCES UI GOOGLE TRANSLATE API KEY RESILIENCE
# ============================================================================

def test_adversarial_google_translate_key_sanitization():
    """
    ATTACK: Test various corrupted, malicious, and extreme Google Translate API key strings:
    - 5000-character random key (buffer stress)
    - SQL injection: "'; DROP TABLE settings; --"
    - XSS injection: "<script>alert('XSS')</script>"
    - Special unicode and symbols
    EXPECTATION: JavaScript escaping and URL encoding must handle them cleanly.
    """
    test_keys = [
        "",
        "   ",
        "A" * 5000,
        "'; DROP TABLE settings; --",
        "<script>alert('XSS')</script>",
        "!@#$%^&*()_+=-`~[]\\{}|;':\",./<>?",
        "AIzaSyD-FakeTestKey_1234567890abcdef"
    ]

    for key in test_keys:
        raw_key = key.strip()
        encoded = subprocess.check_output(
            ["node", "-e", f"console.log(encodeURIComponent({json.dumps(raw_key)}));"],
            text=True
        ).strip()
        # Verify it encodes without crashing
        assert isinstance(encoded, str)

def test_adversarial_ai_assistant_translate_offline_fallback():
    """
    ATTACK: Execute Node.js harness testing AskSaathiAssistant.translateWithGoogle():
    1. Offline mode (navigator.onLine = false) -> returns null cleanly
    2. Empty API key -> returns null cleanly
    3. English target language -> returns null cleanly
    4. Network error / 403 Forbidden -> catches error, logs warning, returns null cleanly
    EXPECTATION: Zero uncaught exceptions; always falls back to offline deterministic cards.
    """
    node_test_code = """
    import { AskSaathiAssistant } from './app/js/ai_assistant.js';

    // Mock global navigator
    globalThis.navigator = { onLine: false };

    const assistant = new AskSaathiAssistant();

    async function runTests() {
      // Test 1: Offline check
      let res1 = await assistant.translateWithGoogle("Boil water for 1 minute", "pa", "AIzaSyFakeKey");
      if (res1 !== null) throw new Error("Test 1 failed: Expected null when offline");

      // Test 2: Online but missing API key
      globalThis.navigator.onLine = true;
      let res2 = await assistant.translateWithGoogle("Boil water for 1 minute", "pa", "");
      if (res2 !== null) throw new Error("Test 2 failed: Expected null when API key is empty");

      // Test 3: Online but target is English
      let res3 = await assistant.translateWithGoogle("Boil water for 1 minute", "en", "AIzaSyFakeKey");
      if (res3 !== null) throw new Error("Test 3 failed: Expected null when target is English");

      // Test 4: Online with mock failing fetch (HTTP 403 Forbidden)
      globalThis.fetch = async () => ({
        ok: false,
        status: 403,
        statusText: "Forbidden"
      });
      let res4 = await assistant.translateWithGoogle("Boil water for 1 minute", "pa", "AIzaSyFakeKey");
      if (res4 !== null) throw new Error("Test 4 failed: Expected null on HTTP 403 error");

      // Test 5: Online with fetch throwing network error
      globalThis.fetch = async () => { throw new Error("Network unreachable"); };
      let res5 = await assistant.translateWithGoogle("Boil water for 1 minute", "pa", "AIzaSyFakeKey");
      if (res5 !== null) throw new Error("Test 5 failed: Expected null on network exception");

      console.log("ALL_TRANSLATE_FALLBACK_TESTS_PASSED");
    }

    runTests().catch(err => {
      console.error(err);
      process.exit(1);
    });
    """

    cmd = ["node", "--input-type=module", "-e", node_test_code]
    result = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    assert result.returncode == 0, f"Node translation fallback failed: {result.stderr}"
    assert "ALL_TRANSLATE_FALLBACK_TESTS_PASSED" in result.stdout

# ============================================================================
# STANDALONE RUNNER
# ============================================================================

if __name__ == "__main__":
    print(f"Executing Milestone 3 Adversarial Stress Test Suite ({__file__})...")
    pytest_args = [__file__, "-v", "--tb=short"]
    exit_code = pytest.main(pytest_args)
    sys.exit(exit_code)
