# Decisions log

Format: `date · decision · why · how to reverse`. The agent appends here whenever the PRD is silent.

- 2026-10-30 · PRD v1.0 decisions D-01 to D-11 are recorded in docs/PRD.md section 3.
- 2026-10-30 · D-12: Status Safety State Architecture. Added LOADING, UNKNOWN, and DATA_UNAVAILABLE states to eliminate silent "Safe" fallbacks on missing, stale, or loading inputs. SAFE requires all dynamic data fresh (<24h), static village/region pack valid, and rules evaluated without error · Critical safety invariant: absence of telemetry is never proof of safety · Revert to 4-state enum in status.js and PRD 8.1 if multi-state UI is deprecated.
