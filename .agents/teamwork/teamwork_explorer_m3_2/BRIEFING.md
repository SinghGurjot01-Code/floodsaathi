# BRIEFING — 2026-10-30T18:54:00Z

## Mission
Investigate and design LoRA training script `relay/train_mobile_model.py` and export script `relay/export_mobile_model.py` for Milestone 3 (R3), adhering to D:\FloodSaathi_AI\ storage root, dry-run mode, and ONNX Int4 / GGUF Q4_K_M export formats.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesizer
- Working directory: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m3_2
- Original parent: 9cc25926-f064-4a11-b0f8-934dad82bf28
- Milestone: Milestone 3 (AI Model Ingestion and Fine-Tuning Pipeline, R3)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / write source code directly.
- Recommend exact implementation architecture, CLI arguments, and design specs.
- Root all storage strictly in D:\FloodSaathi_AI\ (datasets/, checkpoints/, cache/, exported/).
- LoRA fine-tuning for Qwen2.5-0.5B-Instruct (r=16, alpha=32).
- Include dry-run mode for CI / test execution without GPU.
- Export engine: quantize and export ONNX Int4 (model_int4.onnx) and GGUF Q4_K_M (qwen2.5-0.5b-instruct-q4_k_m.gguf) and manifest.json under D:\FloodSaathi_AI\exported\.
- No mocked data in product or runtime.

## Current Parent
- Conversation ID: 9cc25926-f064-4a11-b0f8-934dad82bf28
- Updated: 2026-10-30T18:54:00Z

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`, `PROJECT.md`, `teamwork_explorer_survey_3\report.md`
  - `relay/train_mobile_model.py`, `relay/export_mobile_model.py`, `relay/compile_disaster_dataset.py`, `scripts/build_dataset.py`
  - `relay/tests/test_mobile_model.py`, `corpus/helplines.json`, `eval/must_pass.json`
  - `tests/e2e/tier1_feature_tests.mjs`, `tests/e2e/tier2_boundary_tests.mjs`, `tests/e2e/run_e2e_tests.mjs`
  - Host filesystems: `C:\` (5.27 GB free) vs `D:\FloodSaathi_AI\` (181.54 GB free)
- **Key findings**:
  - `C:\` drive has only 5.27 GB free; `D:\` has 181.54 GB free. Setting `HF_HOME`, `HF_HUB_CACHE`, and `TORCH_HOME` to `D:\FloodSaathi_AI\cache\` is essential to prevent disk exhaustion.
  - LoRA fine-tuning for Qwen2.5-0.5B-Instruct requires rank $r=16$, alpha $\alpha=32$ on all 7 linear projection layers (`q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`), adding 4.82M trainable parameters (~0.98% of 492M base).
  - Dry-run mode validates ChatML prompts, calculates parameter distributions, writes `adapter_config.json` and `training_meta.json`, runs 100% safety holdout gate against `eval/must_pass.json`, and completes without GPU in <1 second.
  - Export engine must generate ONNX Int4 (`model_int4.onnx` with companion configs) targeting < 350 MB RAM for WebGPU, GGUF Q4_K_M (`qwen2.5-0.5b-instruct-q4_k_m.gguf`), and `manifest.json` under `D:\FloodSaathi_AI\exported\`.
- **Unexplored areas**: None within the scope of Explorer 2.

## Key Decisions Made
- Fully designed storage resolver `get_storage_root()` and cache environment configuration.
- Formulated complete CLI arguments and design specs for both `train_mobile_model.py` and `export_mobile_model.py`.
- Formulated concrete before->after code proposals for the implementer agent in `handoff.md`.

## Artifact Index
- `DISPATCH.md` — record of incoming dispatch messages
- `BRIEFING.md` — working memory and identity
- `progress.md` — liveness heartbeat
- `handoff.md` — 5-component handoff report delivered to working directory
