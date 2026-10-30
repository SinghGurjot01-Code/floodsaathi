#!/usr/bin/env python3
"""
relay/compile_disaster_dataset.py
Bridge module for FloodSaathi authoritative disaster guideline dataset compilation.
Connects the relay pipeline to scripts/compile_disaster_guidelines.py while maintaining
full backwards compatibility for test runners and external invocations.

Targets:
- D:/FloodSaathi_AI/dataset (train.jsonl, val.jsonl)
- D:/FloodSaathi_AI/datasets/compiled (flood_safety_dataset.jsonl)
- corpus/flood_safety_dataset.jsonl
"""

import logging
import pathlib
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("compile_disaster_dataset")

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCAL_DATASET = ROOT / "corpus" / "flood_safety_dataset.jsonl"
D_DRIVE_DATASET_DIR = pathlib.Path("D:/FloodSaathi_AI/dataset")

# Ensure scripts directory is on sys.path
SCRIPTS_DIR = ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from compile_disaster_guidelines import DisasterGuidelineCompiler

_compiler_instance = DisasterGuidelineCompiler(root_dir=ROOT)

def _build_official_entries():
    raw_entries = _compiler_instance.get_core_guidelines() + _compiler_instance.get_shelter_guidelines()
    entries = []
    for item in raw_entries:
        rec = dict(item)
        rec["prompt"] = item.get("instruction", "")
        rec["response"] = item.get("output", "")
        rec["verified_source"] = item.get("source", "")
        rec["category"] = item.get("safety_category", "general_safety")
        entries.append(rec)
    return entries

OFFICIAL_DATASET_ENTRIES = _build_official_entries()

def compile_and_save() -> int:
    """Invokes the authoritative DisasterGuidelineCompiler to generate and mirror datasets."""
    logger.info("Executing DisasterGuidelineCompiler bridge...")
    compiler = DisasterGuidelineCompiler(root_dir=ROOT)
    return compiler.compile_all()

if __name__ == "__main__":
    count = compile_and_save()
    print(f"Dataset compilation successful: {count} verified records compiled.")
