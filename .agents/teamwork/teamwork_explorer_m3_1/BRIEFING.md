# BRIEFING — 2026-10-30T18:32:00Z

## Mission
Investigate and design the disaster guideline compiler script `scripts/compile_disaster_guidelines.py`, dataset schema, authoritative source grounding, safety invariants, and compilation architecture for Milestone 3 (R3).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m3_1
- Original parent: 9cc25926-f064-4a11-b0f8-934dad82bf28
- Milestone: Milestone 3 (AI Model Ingestion and Fine-Tuning Pipeline, R3)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT write source code directly
- Recommend the exact implementation architecture and dataset schema
- Ingest official NDMA SOPs, Punjab SDMA disaster manuals, CWC gauge warning/danger levels
- Punjab Health well chlorination standard: MUST be 2.5g to 5g bleaching powder per 1000L of water (WHO standard). Must NEVER output 50g.
- PSPCL electrical safety standard: helpline 1912, minimum safety clearance 10 meters from fallen wires/poles.
- Authorized emergency helplines: 112, 1078, 1070, 1077, 108, 1912.
- Ingest 6 verified Punjab flood relief shelters with geographic coordinates.
- Target compilation paths: D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl and mirror to corpus/flood_safety_dataset.jsonl.
- Strictly adhere to zero-mock data constraints (no mock/dummy/sample/synthetic).

## Current Parent
- Conversation ID: 9cc25926-f064-4a11-b0f8-934dad82bf28
- Updated: not yet

## Investigation State
- **Explored paths**: ORIGINAL_REQUEST.md, PROJECT.md, teamwork_explorer_survey_3/report.md, scripts/build_dataset.py, relay/compile_disaster_dataset.py, corpus/shelters_punjab.json, corpus/helplines.json, corpus/cards/cards.json, corpus/flood_safety_dataset.jsonl, relay/train_mobile_model.py, relay/tests/test_mobile_model.py, tests/e2e/tier1_feature_tests.mjs, tier2_boundary_tests.mjs, tier3_cross_feature_tests.mjs, tier4_real_world_tests.mjs.
- **Key findings**:
  1. Identified discrepancy between `scripts/compile_disaster_guidelines.py` (requested by PRD/Milestone 3) and `relay/compile_disaster_dataset.py` (checked by Tier 1 E2E test F8.2). Recommendation: create `scripts/compile_disaster_guidelines.py` as core engine and update `relay/compile_disaster_dataset.py` as delegating bridge.
  2. Discovered 50g bleaching powder risk: 50g/1000L is for empty tank shock chlorination; drinking water well chlorination must strictly be 2.5g to 5.0g per 1000L (WHO standard). Built a hard validation invariant blocking 50g in well disinfection.
  3. Identified all 6 verified shelters in `corpus/shelters_punjab.json` across Jalandhar, Amritsar, Kapurthala, Firozpur, Hoshiarpur, and Rupnagar. Designed dynamic ingestion into multilingual Q&A pairs.
  4. Verified helpline whitelist `{112, 1078, 1070, 1077, 108, 1912}` and PSPCL 10-meter clearance rule.
  5. Established unified JSONL schema with field aliasing (`id`, `instruction`, `prompt`, `input`, `output`, `response`, `source`, `verified_source`, `safety_category`, `category`, `language`, `verified`, `verification_hash`, `last_verified`).
  6. Verified dual-path writing to `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl` + `D:\FloodSaathi_AI\dataset\train.jsonl`/`val.jsonl` + mirror to `corpus/flood_safety_dataset.jsonl`.
- **Unexplored areas**: None. All core focus items, files, test gates, and constraints are fully investigated.

## Key Decisions Made
- [initial decision]: Base recommendation on bridging `scripts/compile_disaster_guidelines.py` and existing `relay/compile_disaster_dataset.py` to maintain backwards compatibility while satisfying new compiler requirements.
- [schema decision]: Adopt superset/aliased JSONL schema that supports both modern instruction-tuning (`instruction`/`output`) and legacy loaders (`prompt`/`response`/`verified_source`), guaranteeing 100% test compatibility across pytest and E2E suites.
- [safety gate decision]: Enforce 7 deterministic programmatic assertion gates in the compiler script (Chlorination, Electrical, Helpline whitelist, Water crossing refusal, Medical refusal, Shelters verification, Zero-mock AST compliance).

## Artifact Index
- handoff.md — Comprehensive architecture, schema, and implementation blueprint report.
