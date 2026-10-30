---
description: Implement the next unfinished backlog task end to end, verify it, and record it
---
# /build-next

1. Read `AGENTS.md`, `docs/PRD.md`, `docs/tasks/STATUS.md`. Pick the first unchecked task whose dependencies are all checked. Say which one.
2. Plan briefly (files, tests, risks). Where the PRD is silent decide yourself and log it in `docs/DECISIONS.md`.
3. Implement completely: full files, real data only, no build tools in `app/`, safety invariants respected, three languages for any user-visible text.
4. Write tests first for pure logic. Run `node --test app/test`, `pytest relay/tests backend/tests`, `python scripts/check_no_mock.py`.
5. Verify in the browser: serve locally, set DevTools network to Offline where relevant, check the task's "Done when" text, and capture what you saw.
6. If the task needs a platform login or deployment, run the matching workflow or step now (do not defer); pause only per the access rules.
7. Update `docs/tasks/STATUS.md` (box, commit hash, one-line REAL result, any failures), commit, and push.
8. Continue to the next task unless the human told you to stop or a "stop and ask" item blocks you.
