---
description: Run all tests, real-data checks and offline checks, and report honestly
---
# /verify

1. Run `node --test app/test`, `pytest relay/tests backend/tests` (skip folders that do not exist yet), `python scripts/check_no_mock.py`, JSON-schema validation of the latest relay output against `schemas/`.
2. Fetch the deployed `DATA_BASE_URL/latest/punjab.json` (once deployed): confirm it is recent, valid, from live sources, and `/health` age is under 45 minutes.
3. Browser checks with the Antigravity browser: load the app, confirm real data and age badge; set DevTools network to Offline and reload; confirm the estimated label, the persistent offline banner, working Ask Saathi, installed pack data, and that status never lowers.
4. Check the estimator test vectors, the status rules, the 40 must-pass safety items (must be 100%), and run `eval/` scripts that exist. Print the real numbers.
5. Write a short report: passed, failed, advisory-labelled features, open risks. Do not hide failures. Fix what you can, then re-run.
