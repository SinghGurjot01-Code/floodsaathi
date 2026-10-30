# Dispatch: Remediation Explorer 1 (Milestone 1, Iteration 2)

## Objective
Analyze the Forensic Audit INTEGRITY VIOLATION, Reviewer 2 REQUEST_CHANGES, Challenger 1 REQUEST_CHANGES, and Challenger 2 REQUEST_CHANGES reports for Milestone 1 (Downloads & Plugins UI, R1). Formulate a comprehensive, genuine, robust fix strategy. You are a read-only exploration agent. Do NOT modify source code.

## Authoritative Inputs
- Requirements: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md`
- Project Specs: `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md`
- FULL AUDITOR EVIDENCE REPORT (DO NOT OMIT/CIRCUMVENT):
  `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_auditor_m1\handoff.md`
- Reviewer 2 Report:
  `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_reviewer_m1_2\handoff.md`
- Challenger 1 Report:
  `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_challenger_m1_1\handoff.md`
- Challenger 2 Report:
  `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_challenger_m1_2\handoff.md`

## Critical Failures to Address
1. **Auditor Finding 1 & Challenger 1 Finding 3**: `estimateDownloadSize` in `app/js/map_downloader.js` used a hardcoded lookup dictionary with non-monotonic drops (10km=12MB, but 11km=9.7MB; 25km=28MB, but 26km=17.3MB; 50km=65MB, but 51km=44MB; 99km=143.5MB, but 100km=140MB). Inputs 0km, negatives, NaN returned invalid numbers. Must design a continuous monotonic model (e.g. Piecewise Linear Interpolation between calibrated points 0km->0MB, 10km->12MB, 25km->28MB, 50km->65MB, 100km->140MB) with strict input validation.
2. **Auditor Finding 2 & Reviewer 2 Finding 4**: `downloadLangPack` in `app/js/main.js` caught and swallowed all network fetch failures, unconditionally setting `downloaded: true` and displaying "Downloaded". Must design atomic verification where failure sets error status and retains "Not Downloaded".
3. **Auditor Finding 3 & Challenger 1 Finding 2**: `downloadMapPack` only wrote a 159-byte JSON metadata object instead of genuinely caching map data. Must design genuine vector tile/PMTiles fetching & caching into `floodsaathi-offline-maps-v1`.
4. **Auditor Finding 4, Reviewer 2 Finding 2 & Challenger 2 Finding 1**: `app/sw.js` activate event deletes all caches whose name is not `CACHE_NAME`, destroying `floodsaathi-offline-maps-v1`, `floodsaathi-lang-packs-v1`, and `floodsaathi-ai-models-v1`. Must implement an allowlist in `app/sw.js` preserving user offline data caches.
5. **Reviewer 2 Finding 3 & Challenger 2 Finding 3**: Touch targets in downloads view were < 48px (.btn-plugin-download was 44px, language buttons were ~26px). Must fix CSS to ensure all interactive elements satisfy >= 48px touch targets.
6. **Test Suite Failures**: `node --test app/test/*.test.mjs` must pass 100%.

Deliver report in `c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m1_iter2_1\report.md` and handoff in `handoff.md`.
## 2026-10-30T14:53:28Z
You are Remediation Explorer 1 (teamwork_explorer).
Your working directory is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m1_iter2_1\
Your DISPATCH file is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_m1_iter2_1\DISPATCH.md
The authoritative original request is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md
The project scope is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\PROJECT.md

FULL AUDITOR EVIDENCE REPORT (DO NOT OMIT/CIRCUMVENT):
c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_auditor_m1\handoff.md

You are a read-only exploration agent. Do NOT modify source code.
Investigate the full evidence reports from the auditor, reviewers, and challengers. Address every integrity violation and finding with a holistic, genuine remediation blueprint.
Deliver report in report.md and handoff in handoff.md, then notify parent.
