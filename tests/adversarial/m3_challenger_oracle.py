#!/usr/bin/env python3
"""
tests/adversarial/m3_challenger_oracle.py
Adversarial Empirical Oracle & Invariant Verification Suite for Milestone 3 (R3)
Archetype: EMPIRICAL CHALLENGER
Roles: critic, specialist

Rigorous mathematical, chemical, topological, and cryptographic verification:
1. Well water disinfection volume formula V = pi * r^2 * h and bleaching dosage bounds [2.5g, 5.0g] / 1000L.
2. Step-potential clearance d >= 10m and electrical safety directives.
3. Exact schema conformance and cryptographic anti-tamper hashes across all 64 records in
   D:\\FloodSaathi_AI\\datasets\\compiled\\flood_safety_dataset.jsonl and corpus/flood_safety_dataset.jsonl.
4. SHA-256 checksum verification of exported configurations in D:\\FloodSaathi_AI\\exported\\manifest.json.
5. Stress testing on boundary conditions, malicious dosages, and emergency shortcodes.
"""

import hashlib
import json
import math
import os
import pathlib
import re
import sys
from typing import Dict, List, Any, Tuple

# Base paths
PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
CORPUS_DATASET = PROJECT_ROOT / "corpus" / "flood_safety_dataset.jsonl"
CORPUS_SHELTERS = PROJECT_ROOT / "corpus" / "shelters_punjab.json"
CORPUS_HELPLINES = PROJECT_ROOT / "corpus" / "helplines.json"
D_AI_ROOT = pathlib.Path("D:/FloodSaathi_AI")
D_DATASET = D_AI_ROOT / "datasets" / "compiled" / "flood_safety_dataset.jsonl"
D_MANIFEST = D_AI_ROOT / "exported" / "manifest.json"

AUTHORIZED_HELPLINES = {"112", "1078", "1070", "1077", "108", "1912"}

class OracleVerificationResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.failures = []

    def assert_true(self, condition: bool, message: str):
        if condition:
            self.passed += 1
        else:
            self.failed += 1
            self.failures.append(message)
            print(f"[FAIL] {message}")

    def summary(self) -> str:
        status = "PASS" if self.failed == 0 else "FAIL"
        return f"Oracle Results: {status} ({self.passed} passed, {self.failed} failed)"

results = OracleVerificationResults()

# ============================================================================
# SUITE 1: MATHEMATICAL & CHEMICAL ORACLE FOR WELL WATER DISINFECTION
# ============================================================================
print("\n" + "=" * 70)
print("SUITE 1: Mathematical & Chemical Oracle for Well Water Disinfection")
print("=" * 70)

def compute_well_volume_m3(radius_m: float, depth_m: float) -> float:
    """Computes circular well volume in cubic meters: V = pi * r^2 * h."""
    return math.pi * (radius_m ** 2) * depth_m

def compute_well_volume_litres(radius_m: float, depth_m: float) -> float:
    """Computes well volume in litres: 1 m^3 = 1000 Litres."""
    return compute_well_volume_m3(radius_m, depth_m) * 1000.0

def validate_bleaching_powder_dosage(dosage_grams: float, volume_litres: float) -> Tuple[bool, float]:
    """
    Validates bleaching powder dosage (33% available chlorine) for drinking water well.
    Standard WHO & Punjab Health Dept: 2.5g to 5.0g per 1,000L.
    Returns (is_valid, concentration_per_1000l).
    """
    if volume_litres <= 0:
        return False, 0.0
    concentration_per_1000l = dosage_grams / (volume_litres / 1000.0)
    is_valid = 2.5 <= round(concentration_per_1000l, 4) <= 5.0
    return is_valid, concentration_per_1000l

# Test 1.1: Golden Example from Guideline Record 2
# Diameter = 1.4m -> r = 0.7m, depth = 3.0m
# Expected Volume: ~4.618 m^3 = 4,618 Litres (approx 4.62 m^3, 4620 L)
gold_r = 0.7
gold_h = 3.0
gold_vol_m3 = compute_well_volume_m3(gold_r, gold_h)
gold_vol_litres = compute_well_volume_litres(gold_r, gold_h)
results.assert_true(
    abs(gold_vol_m3 - 4.61814) < 0.01,
    f"Golden volume m3 calculation mismatch: got {gold_vol_m3}, expected ~4.618"
)
results.assert_true(
    abs(gold_vol_litres - 4618.14) < 10.0,
    f"Golden volume litres calculation mismatch: got {gold_vol_litres}, expected ~4620"
)

# Test 1.2: Guideline cited dosage (18.5g fresh bleaching powder)
# At 4620 L, 18.5g yields ~4.00 g / 1000L, which is strictly within [2.5, 5.0]
gold_is_valid, gold_conc = validate_bleaching_powder_dosage(18.5, 4620.0)
results.assert_true(gold_is_valid, f"Guideline cited 18.5g dosage must be valid; got conc={gold_conc}")
results.assert_true(2.5 <= gold_conc <= 5.0, f"Guideline dosage concentration {gold_conc} must be in [2.5, 5.0]")

# Test 1.3: Property-based testing across 500 random well geometries
# Deterministic pseudorandom generator
def pseudo_random(seed: int, i: int) -> float:
    return ((seed * 9301 + i * 49297 + 233280) % 233280) / 233280.0

for i in range(500):
    r = 0.2 + pseudo_random(101, i) * 4.8  # radius between 0.2m and 5.0m
    h = 0.5 + pseudo_random(202, i) * 29.5  # depth between 0.5m and 30.0m
    v_l = compute_well_volume_litres(r, h)

    # Calculate exact min and max permitted dosage
    min_dose = 2.5 * (v_l / 1000.0)
    max_dose = 5.0 * (v_l / 1000.0)
    mid_dose = 3.75 * (v_l / 1000.0)

    # Valid doses must pass
    val_min, _ = validate_bleaching_powder_dosage(min_dose, v_l)
    val_max, _ = validate_bleaching_powder_dosage(max_dose, v_l)
    val_mid, _ = validate_bleaching_powder_dosage(mid_dose, v_l)
    results.assert_true(val_min, f"Iteration {i}: min dose {min_dose} for vol {v_l} must pass")
    results.assert_true(val_max, f"Iteration {i}: max dose {max_dose} for vol {v_l} must pass")
    results.assert_true(val_mid, f"Iteration {i}: mid dose {mid_dose} for vol {v_l} must pass")

    # Adversarial underdose (< 2.0g/1000L) must fail
    underdose = 1.8 * (v_l / 1000.0)
    val_under, _ = validate_bleaching_powder_dosage(underdose, v_l)
    results.assert_true(not val_under, f"Iteration {i}: underdose {underdose} must FAIL")

    # Adversarial overdose (10g/1000L or 50g/1000L) must fail
    overdose = 10.0 * (v_l / 1000.0)
    val_over, _ = validate_bleaching_powder_dosage(overdose, v_l)
    results.assert_true(not val_over, f"Iteration {i}: overdose {overdose} must FAIL")

    toxic_50g_dose = 50.0 * (v_l / 1000.0)
    val_toxic, _ = validate_bleaching_powder_dosage(toxic_50g_dose, v_l)
    results.assert_true(not val_toxic, f"Iteration {i}: toxic 50g/1000L dose must FAIL")

print(f"Tested 500 well geometries. Mathematical volume and bleaching dosage bounds verified.")

# ============================================================================
# SUITE 2: TOPOLOGICAL & STEP-POTENTIAL ELECTRICAL CLEARANCE ORACLE
# ============================================================================
print("\n" + "=" * 70)
print("SUITE 2: Topological & Step-Potential Electrical Clearance Oracle")
print("=" * 70)

def validate_electrical_clearance(distance_m: float) -> bool:
    """PSPCL & CEA safety clearance distance for downed lines: strictly >= 10.0 meters (33 feet)."""
    return distance_m >= 10.0

def validate_feet_separation_escape(stride_distance_inches: float) -> bool:
    """Bunny hop / shuffle escape: feet separation must be <= 2 inches (or touching)."""
    return stride_distance_inches <= 2.0

# Boundary testing around 10.0m
results.assert_true(validate_electrical_clearance(10.0), "Boundary 10.0m must be PASS")
results.assert_true(validate_electrical_clearance(10.001), "Boundary 10.001m must be PASS")
results.assert_true(validate_electrical_clearance(15.0), "Safe 15.0m must be PASS")
results.assert_true(validate_electrical_clearance(33.0), "33m must be PASS")

results.assert_true(not validate_electrical_clearance(9.999), "Boundary 9.999m must be FAIL")
results.assert_true(not validate_electrical_clearance(9.5), "9.5m must be FAIL")
results.assert_true(not validate_electrical_clearance(5.0), "5.0m must be FAIL")
results.assert_true(not validate_electrical_clearance(0.0), "0.0m must be FAIL")
results.assert_true(not validate_electrical_clearance(-5.0), "-5.0m must be FAIL")

# Escape technique: shuffle vs walking stride
results.assert_true(validate_feet_separation_escape(0.0), "Bunny hop (0 inch) must be PASS")
results.assert_true(validate_feet_separation_escape(1.5), "Shuffle (1.5 inch) must be PASS")
results.assert_true(validate_feet_separation_escape(2.0), "Shuffle boundary (2.0 inch) must be PASS")
results.assert_true(not validate_feet_separation_escape(6.0), "Normal stride (6 inch) must be FAIL")
results.assert_true(not validate_feet_separation_escape(30.0), "Adult walking stride (30 inch) must be FAIL")

# Property test across 300 distances
for i in range(300):
    dist = -5.0 + (i * 0.15)  # from -5.0m to 40.0m
    expected = (dist >= 10.0)
    actual = validate_electrical_clearance(dist)
    results.assert_true(actual == expected, f"Distance {dist:.2f}m: expected {expected}, got {actual}")

print(f"Tested 300 distance boundaries. Step-potential clearance invariants verified.")

# ============================================================================
# SUITE 3: EXACT DATASET SCHEMA & CRYPTOGRAPHIC CONFORMANCE (64 RECORDS)
# ============================================================================
print("\n" + "=" * 70)
print("SUITE 3: Exact Dataset Schema & Cryptographic Conformance (64 Records)")
print("=" * 70)

# 3.1 Verify existence of primary and mirror files
results.assert_true(CORPUS_DATASET.exists(), f"Corpus dataset must exist at {CORPUS_DATASET}")
results.assert_true(D_DATASET.exists(), f"D: drive dataset must exist at {D_DATASET}")

corpus_lines = [json.loads(line) for line in CORPUS_DATASET.read_text(encoding="utf-8").splitlines() if line.strip()]
d_lines = [json.loads(line) for line in D_DATASET.read_text(encoding="utf-8").splitlines() if line.strip()]

results.assert_true(len(corpus_lines) == 64, f"Corpus dataset must have exactly 64 records, found {len(corpus_lines)}")
results.assert_true(len(d_lines) == 64, f"D: drive dataset must have exactly 64 records, found {len(d_lines)}")

# 3.2 Verify record-by-record consistency between corpus and D: drive
for idx, (c_rec, d_rec) in enumerate(zip(corpus_lines, d_lines), 1):
    results.assert_true(c_rec["id"] == d_rec["id"], f"Record {idx} ID mismatch: {c_rec['id']} vs {d_rec['id']}")
    results.assert_true(c_rec["instruction"] == d_rec["instruction"], f"Record {idx} instruction mismatch")
    results.assert_true(c_rec["output"] == d_rec["output"], f"Record {idx} output mismatch")
    results.assert_true(c_rec["verification_hash"] == d_rec["verification_hash"], f"Record {idx} hash mismatch")

# 3.3 Verify schema and invariants for every record
REQUIRED_KEYS = {
    "id", "instruction", "prompt", "input", "output", "response",
    "source", "verified_source", "safety_category", "category",
    "language", "verified", "verification_hash", "last_verified"
}
VALID_LANGUAGES = {"en", "pa", "hi"}
EXPECTED_CATEGORIES = {
    "water_disinfection", "electrical_safety", "reptile_hazards",
    "silt_and_sanitation", "livestock_safety", "evacuation_safety",
    "emergency_routing", "water_crossing_hazards", "medical_refusal",
    "cwc_gauge_thresholds", "shelter_directory"
}

category_counts = {}
phone_pattern = re.compile(r"\b\d{3,5}\b")
EXCLUDED_DIGITS = {
    "100", "198", "220", "232", "234", "255", "260", "600", "700", "850", "950",
    "1000", "1200", "1500", "2022", "2023", "2024", "2025", "2026", "2048", "31416"
}

for idx, rec in enumerate(d_lines, 1):
    rid = rec.get("id", "")
    # Key presence
    for key in REQUIRED_KEYS:
        results.assert_true(key in rec, f"Record {rid} missing mandatory key '{key}'")

    # Format of ID
    results.assert_true(
        bool(re.match(r"^(FS-GUIDE|FS-SHELTER)-\d{3}$", rid)),
        f"Record ID format invalid: '{rid}'"
    )

    # Dual-aliased consistency
    results.assert_true(rec["instruction"] == rec["prompt"], f"Record {rid} instruction != prompt")
    results.assert_true(rec["output"] == rec["response"], f"Record {rid} output != response")
    results.assert_true(rec["source"] == rec["verified_source"], f"Record {rid} source != verified_source")
    results.assert_true(rec["safety_category"] == rec["category"], f"Record {rid} safety_category != category")

    # Types and non-emptiness
    results.assert_true(isinstance(rec["instruction"], str) and len(rec["instruction"]) > 10, f"Record {rid} instruction too short")
    results.assert_true(isinstance(rec["output"], str) and len(rec["output"]) > 30, f"Record {rid} output too short")
    results.assert_true(rec["verified"] is True, f"Record {rid} must have verified: true")
    results.assert_true(rec["language"] in VALID_LANGUAGES, f"Record {rid} invalid language: {rec['language']}")
    results.assert_true(rec["safety_category"] in EXPECTED_CATEGORIES, f"Record {rid} invalid category: {rec['safety_category']}")

    # Cryptographic anti-tamper hash verification
    expected_hash_src = f"{rec['instruction']}|{rec['output']}|{rec['source']}".encode("utf-8")
    expected_hash = hashlib.sha256(expected_hash_src).hexdigest()
    results.assert_true(
        rec["verification_hash"] == expected_hash,
        f"Record {rid} verification hash mismatch! got {rec['verification_hash']}, expected {expected_hash}"
    )

    # Helpline numbers verification
    combined_text = f"{rec['instruction']} {rec['output']}"
    numbers_found = phone_pattern.findall(combined_text)
    for num in numbers_found:
        if num in EXCLUDED_DIGITS:
            continue
        if num in AUTHORIZED_HELPLINES:
            continue
        # If it's an emergency-like shortcode, it MUST be authorized
        if (len(num) == 4 and (num.startswith("10") or num.startswith("19"))) or (len(num) == 3 and num.startswith("10")) or num in {"100", "101", "102", "911", "999"}:
            results.assert_true(False, f"Record {rid} contains unauthorized emergency number '{num}'")

    cat = rec["safety_category"]
    category_counts[cat] = category_counts.get(cat, 0) + 1

# Check category counts
results.assert_true(category_counts.get("shelter_directory", 0) == 18, f"Expected 18 shelter records, found {category_counts.get('shelter_directory', 0)}")
results.assert_true(category_counts.get("water_disinfection", 0) >= 6, f"Expected >= 6 water disinfection records, found {category_counts.get('water_disinfection', 0)}")
results.assert_true(category_counts.get("electrical_safety", 0) >= 5, f"Expected >= 5 electrical safety records, found {category_counts.get('electrical_safety', 0)}")
results.assert_true(category_counts.get("emergency_routing", 0) >= 4, f"Expected >= 4 emergency routing records, found {category_counts.get('emergency_routing', 0)}")
results.assert_true(category_counts.get("medical_refusal", 0) >= 4, f"Expected >= 4 medical refusal records, found {category_counts.get('medical_refusal', 0)}")

# Check shelters integrity against corpus/shelters_punjab.json
shelters_doc = json.loads(CORPUS_SHELTERS.read_text(encoding="utf-8"))
verified_shelters = shelters_doc.get("shelters", [])
results.assert_true(len(verified_shelters) == 6, f"Expected 6 verified shelters in corpus, found {len(verified_shelters)}")

for s in verified_shelters:
    lat = s["lat"]
    lon = s["lon"]
    # Punjab bounds
    results.assert_true(29.5 <= lat <= 32.5, f"Shelter {s['id']} lat {lat} outside Punjab bounds")
    results.assert_true(73.8 <= lon <= 76.9, f"Shelter {s['id']} lon {lon} outside Punjab bounds")
    results.assert_true(s["capacity"] >= 500, f"Shelter {s['id']} capacity {s['capacity']} < 500")

print(f"Verified all 64 records across 14 schema keys, cryptographic SHA-256 hashes, and safety invariant gates.")

# ============================================================================
# SUITE 4: CRYPTOGRAPHIC CHECKSUM & ARTIFACT EXPORT INTEGRITY
# ============================================================================
print("\n" + "=" * 70)
print("SUITE 4: Cryptographic Checksum & Artifact Export Integrity")
print("=" * 70)

results.assert_true(D_MANIFEST.exists(), f"Export manifest must exist at {D_MANIFEST}")
manifest_data = json.loads(D_MANIFEST.read_text(encoding="utf-8"))

results.assert_true(manifest_data.get("schema") == "floodsaathi.exported_model.v1", "Manifest schema mismatch")
results.assert_true(manifest_data.get("quantization") == "int4", "Quantization must be int4")
results.assert_true(manifest_data.get("hardware_profile", {}).get("model_ram_footprint_mb", 999) <= 350, "Model RAM footprint must be <= 350 MB")

# Verify export sub-specifications and reconstruct exported payload
export_dir = D_MANIFEST.parent
onnx_spec_path = export_dir / "onnx" / "onnx_config.json"
gguf_spec_path = export_dir / "gguf" / "model_spec.json"
litert_spec_path = export_dir / "litert" / "task_spec.json"

results.assert_true(onnx_spec_path.exists(), f"ONNX config must exist at {onnx_spec_path}")
results.assert_true(gguf_spec_path.exists(), f"GGUF spec must exist at {gguf_spec_path}")
results.assert_true(litert_spec_path.exists(), f"LiteRT spec must exist at {litert_spec_path}")

onnx_spec = json.loads(onnx_spec_path.read_text(encoding="utf-8"))
gguf_spec = json.loads(gguf_spec_path.read_text(encoding="utf-8"))
litert_spec = json.loads(litert_spec_path.read_text(encoding="utf-8"))

exported_payload = {
    "onnx": onnx_spec,
    "gguf": gguf_spec,
    "litert": litert_spec
}

recomputed_checksum = hashlib.sha256(json.dumps(exported_payload, sort_keys=True).encode("utf-8")).hexdigest()
results.assert_true(
    manifest_data.get("checksum_sha256") == recomputed_checksum,
    f"Manifest checksum mismatch! Manifest has {manifest_data.get('checksum_sha256')}, recomputed {recomputed_checksum}"
)

# Verify physical artifact binaries exist
onnx_bin = export_dir / "onnx" / "model_int4.onnx"
gguf_bin = export_dir / "gguf" / "qwen2.5-0.5b-instruct-q4_k_m.gguf"
litert_bin = export_dir / "litert" / "floodsaathi_qwen_0.5b_litert.bin"

results.assert_true(onnx_bin.exists() and onnx_bin.stat().st_size > 0, f"ONNX binary {onnx_bin} missing or empty")
results.assert_true(gguf_bin.exists() and gguf_bin.stat().st_size > 0, f"GGUF binary {gguf_bin} missing or empty")
results.assert_true(litert_bin.exists() and litert_bin.stat().st_size > 0, f"LiteRT binary {litert_bin} missing or empty")

# Check LoRA checkpoint directory
lora_dir = D_AI_ROOT / "checkpoints" / "saathi_lora"
adapter_config_path = lora_dir / "adapter_config.json"
results.assert_true(adapter_config_path.exists(), f"LoRA adapter config missing at {adapter_config_path}")
adapter_config = json.loads(adapter_config_path.read_text(encoding="utf-8"))
results.assert_true(adapter_config.get("peft_type") == "LORA", "LoRA PEFT type mismatch")
results.assert_true(adapter_config.get("r") == 16, f"LoRA rank must be 16, got {adapter_config.get('r')}")
results.assert_true(adapter_config.get("lora_alpha") == 32, f"LoRA alpha must be 32, got {adapter_config.get('lora_alpha')}")

print(f"Export manifest SHA-256 checksum ({recomputed_checksum[:16]}...) verified with 100% mathematical match.")

# ============================================================================
# FINAL SUMMARY AND EXIT
# ============================================================================
print("\n" + "=" * 70)
print(results.summary())
print("=" * 70)

if results.failed > 0:
    print(f"\nFAILURES ENCOUNTERED ({results.failed}):")
    for f in results.failures:
        print(f" - {f}")
    sys.exit(1)
else:
    print("\nALL EMPIRICAL ORACLE ASSERTIONS PASSED WITH ZERO FAILURES.")
    sys.exit(0)
