# BRIEFING — 2026-10-30T18:55:00Z

## Mission
Investigate and design implementation specs for Milestone 3 (R3): Google Translate API key input in Preferences with offline deterministic card fallback, and Pytest test suite `relay/tests/test_mobile_model.py` for safety verification and storage assertions.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Read-only investigation, architectural analysis, synthesis, design specification
- Working directory: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m3_3\
- Original parent: 9cc25926-f064-4a11-b0f8-934dad82bf28
- Milestone: Milestone 3 (AI Model Ingestion and Fine-Tuning Pipeline, R3)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code directly
- Strict compliance with FloodSaathi AGENTS.md: NO MOCK DATA, offline-first, safety invariants outrank features
- All proposed changes must be delivered as structured recommendations and design specifications in handoff.md

## Current Parent
- Conversation ID: 9cc25926-f064-4a11-b0f8-934dad82bf28
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `app/index.html` (#view-preferences lines 595-641)
  - `app/js/store.js` (IndexedDB schema and settings methods)
  - `app/js/main.js` (translation key wiring and askSaathi integration)
  - `app/js/ai_assistant.js` (translation fallback and invariant guards)
  - `corpus/cards/cards.json` (multilingual verified cards: en, hi, pa)
  - `corpus/helplines.json` (authoritative helplines: 112, 1078, 1070, 1077, 108)
  - `corpus/shelters_punjab.json` (6 verified shelters with lat/lon/names)
  - `relay/compile_disaster_dataset.py`, `relay/train_mobile_model.py`, `relay/export_mobile_model.py`
  - `relay/tests/test_mobile_model.py` (existing 6 unit tests passing)
  - `D:\FloodSaathi_AI\` (physical verification: cache, checkpoints, dataset, exports)
- **Key findings**:
  - Input field in `#view-preferences` currently has `id="pref-google-translate-key"`. The design spec must standardize `#input-translate-api-key` while maintaining dual-selector compatibility.
  - IndexedDB `settings` store already supports arbitrary key-value pairs; `google_translate_api_key` is persisted and retrieved properly.
  - All 7 verified cards in `corpus/cards/cards.json` already contain complete multilingual `en`, `hi`, and `pa` text for title, summary, and body, providing 100% offline fallback.
  - `D:\FloodSaathi_AI` is already provisioned on the host with `dataset/train.jsonl`, `checkpoints/saathi_lora/adapter_config.json`, and `exports/manifest.json`.
  - Bleaching powder dosing: 2.5g to 5g per 1000L is verified for drinking water; 50g per 1000L is for empty storage tank disinfection and must be rejected for drinking water.
- **Unexplored areas**: None. All required investigation paths are complete.

## Key Decisions Made
- Standardize `#input-translate-api-key` in `app/index.html` with graceful fallback for `pref-google-translate-key`.
- Formulate 6 comprehensive Pytest test cases for `relay/tests/test_mobile_model.py` addressing schema validation, bleaching powder bounds, PSPCL 10m/1912, helplines, shelters, and D: storage path assertions.

## Artifact Index
- `DISPATCH.md` — Inbound task dispatch
- `BRIEFING.md` — Persistent situational awareness
- `progress.md` — Liveness heartbeat
- `handoff.md` — Final structured report
