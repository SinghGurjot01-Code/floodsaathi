# DISPATCH — Worker M3 (AI Model Ingestion & Fine-Tuning Pipeline, R3)
Timestamp: 2026-10-30T19:35:00Z

## Mission
Implement Milestone 3 (AI Model Ingestion and Fine-Tuning Pipeline rooted in D:\FloodSaathi_AI\, R3) based on the comprehensive architectural designs of Explorers 1, 2, and 3.

## Exclusive Write Ownership
You exclusively own and may edit the following files:
1. `scripts/compile_disaster_guidelines.py` (Create)
2. `relay/compile_disaster_dataset.py` (Update to bridge and invoke compiler)
3. `relay/train_mobile_model.py` (Update with storage routing, PEFT LoRA, and dry-run)
4. `relay/export_mobile_model.py` (Update with export engine and manifest generation)
5. `app/index.html` (Update `#view-preferences` with `#input-translate-api-key`)
6. `app/js/main.js` (Update Preferences listener to bind `#input-translate-api-key`)
7. `relay/tests/test_mobile_model.py` (Update with 6 comprehensive pytest tests)

## Key Constraints & Safety Invariants
- DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
- Zero mock data AST validation: python scripts/check_no_mock.py must pass with 0 violations.
- All AI dataset, checkpoint, cache, and export artifacts MUST reside in `D:\FloodSaathi_AI\`.
- Punjab Health well-chlorination standard: STRICTLY 2.5g to 5g bleaching powder per 1000L of water (WHO standard). Must NEVER output 50g for drinking well water.
- PSPCL electrical safety standard: helpline 1912, minimum clearance 10 meters from fallen wires/poles.
- Authorized emergency helplines whitelist: 112, 1078, 1070, 1077, 108, 1912.
- Ingest all 6 verified Punjab flood relief shelters from `corpus/shelters_punjab.json`.
- Qwen2.5-0.5B-Instruct LoRA parameters: rank r=16, alpha=32, target modules: q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj.
- Export engine: ONNX Int4 (model_int4.onnx) and GGUF Q4_K_M (qwen2.5-0.5b-instruct-q4_k_m.gguf) and manifest.json under D:\FloodSaathi_AI\exported\.
- Preferences view: Add `#input-translate-api-key` in `app/index.html` with IndexedDB persistence in `store.js` (`google_translate_api_key`) and offline fallback.
- Run builds and tests:
  1. `python scripts/compile_disaster_guidelines.py`
  2. `.venv\Scripts\python -m pytest relay/tests`
  3. `python scripts/check_no_mock.py`
  4. `node --test app/test/*.test.mjs`
  5. `node tests/e2e/run_e2e_tests.mjs`
