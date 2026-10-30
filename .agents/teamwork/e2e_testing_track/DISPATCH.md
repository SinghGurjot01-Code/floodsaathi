# Dispatch: E2E Testing Track

## Objective
Design and implement a comprehensive opaque-box E2E test suite derived strictly from user requirements in `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md`.
Do NOT modify any implementation code in `app/`, `relay/`, or `scripts/`. You exclusively own `tests/e2e/`, `TEST_INFRA.md`, and `TEST_READY.md`.

## Methodology & Architecture
Follow the 4-Tier Opaque-Box Test Methodology from Project Pattern:
1. **Tier 1: Feature Coverage (>=5 test cases per feature)**
   Cover all features (F1 to F12):
   - F1: Downloads tab in desktop header and mobile nav.
   - F2: Offline Map Pack (10, 25, 50, 100 km; sizes 12, 28, 65, 140 MB; progress; Cache API).
   - F3: FloodSaathi SLM AI Model card (download/active badges, toggle, hook).
   - F4: Python Runtime / Local Engine card (status display, connection guidance).
   - F5: Regional Language Packs (Hindi ~4MB, Punjabi ~4MB, English default).
   - F6: GPS Re-sync button (.spinning animation, visual feedback, stale/error fallback).
   - F7: Proximity Telemetry Indicator (user location + nearest gauge + distance upstream/downstream).
   - F8: AI storage root in `D:\FloodSaathi_AI\`.
   - F9: Disaster guidelines compiler (NDMA, SDMA, CWC, 2.5g bleaching powder per 1000L, PSPCL 1912 10m, helplines 112/1078/1070/1077/108/1912, shelters).
   - F10: Qwen 2.5 LoRA fine-tuning and ONNX Int4 / GGUF export format validation.
   - F11: Google Translate API key config in settings and offline fallback.
   - F12: Automated test baseline verification (node tests, pytest relay/tests, check_no_mock.py).
2. **Tier 2: Boundary & Corner Cases (>=5 test cases per feature)**
   - Radii outside standard presets, extreme coordinates, 0 MB / max quota cache bounds, offline network state, timeout handling, invalid API keys, corrupted cache entries.
3. **Tier 3: Cross-Feature Interactions (Pairwise combinations)**
   - Switching language while downloading map pack; GPS re-sync while viewing downloads; SLM toggle while offline; Google Translate fallback under active Punjabi pack.
4. **Tier 4: Real-World Workload Scenarios (>=5 scenarios)**
   - Rural Punjab user in Jalandhar during active monsoon flood warning: offline map caching -> GPS re-sync -> nearest CWC gauge check -> offline AI safety query -> helpline dial.

## Artifacts to Produce
1. `TEST_INFRA.md` at project root documenting test architecture, feature inventory, methodology, and coverage thresholds.
2. `tests/e2e/run_e2e_tests.mjs` (master test runner executing all tiers).
3. `tests/e2e/tier1_feature_tests.mjs`, `tier2_boundary_tests.mjs`, `tier3_cross_feature_tests.mjs`, `tier4_real_world_tests.mjs`.
4. Run the test runner using `node tests/e2e/run_e2e_tests.mjs` and document initial baseline.
5. Publish `TEST_READY.md` at project root when the test suite is ready with full coverage summary.
6. Handoff report in `.agents/teamwork/e2e_testing_track/handoff.md`.


## 2026-10-30T14:28:56Z
[Message] timestamp=2026-10-30T14:28:56Z sender=9cc25926-f064-4a11-b0f8-934dad82bf28 priority=MESSAGE_PRIORITY_HIGH
content=You are the E2E Testing Track lead (teamwork_test_writer).
Your working directory is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\e2e_testing_track\
Your DISPATCH file is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\e2e_testing_track\DISPATCH.md
The authoritative original request is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md
The project scope is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md

Build a comprehensive opaque-box E2E test suite covering Tiers 1-4 for all FloodSaathi features (F1 to F12) without modifying product source code.
You own:
- TEST_INFRA.md (at project root)
- tests/e2e/run_e2e_tests.mjs
- tests/e2e/tier1_feature_tests.mjs
- tests/e2e/tier2_boundary_tests.mjs
- tests/e2e/tier3_cross_feature_tests.mjs
- tests/e2e/tier4_real_world_tests.mjs
- TEST_READY.md (at project root upon completion)

Execute the test suite with `node tests/e2e/run_e2e_tests.mjs`, record the baseline, write your handoff in `.agents/teamwork/e2e_testing_track/handoff.md`, and notify parent when complete.
