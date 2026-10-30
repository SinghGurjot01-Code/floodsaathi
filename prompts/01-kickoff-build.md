Phase 0 is done. Now build FloodSaathi.

Read `AGENTS.md`, `docs/PRD.md` and `docs/tasks/STATUS.md`. Work the backlog in order, starting with Phase A, using the `/build-next` workflow repeatedly. After each task run `/verify`; after each phase run `/deploy` and `/status`.

Standing rules: every feature must work with real data (no mock, no simulation, no demo mode); full files, not diffs; vanilla JS with no build tools in `app/`; decide ambiguities yourself and log them in `docs/DECISIONS.md`; stop only for the "stop and ask" list in the access rules. Where a real source is unavailable, the UI says "unavailable" with the age of the last real value; never fill with fake values. Report real results honestly, including failures and advisory-labelled features.

Keep going until Phase A is deployed and verified, then continue into Phase B, C and D in order. Post a `/status` summary at the end of every phase.
