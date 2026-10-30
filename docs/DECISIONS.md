# Decisions log

Format: `date · decision · why · how to reverse`. The agent appends here whenever the PRD is silent.

- 2026-10-30 · PRD v1.0 decisions D-01 to D-11 are recorded in docs/PRD.md section 3.
- 2026-10-30 · D-12: Status Safety State Architecture. Added LOADING, UNKNOWN, and DATA_UNAVAILABLE states to eliminate silent "Safe" fallbacks on missing, stale, or loading inputs. SAFE requires all dynamic data fresh (<24h), static village/region pack valid, and rules evaluated without error · Critical safety invariant: absence of telemetry is never proof of safety · Revert to 4-state enum in status.js and PRD 8.1 if multi-state UI is deprecated.
- 2026-10-30 · D-13: Unified HAND Vertical Datum Formulation. Resolved reference mismatch between channel bed datum and bankfull stages by formulating depth = max(0, (stage_above_bank + bank_height_above_channel) - hand_m). Ground elevations are referenced to Copernicus DEM GLO-30 (EGM2008 geoid). Because Punjab floodplain is flat with DEM vertical error comparable to flood depths, all HAND depth bands are marked ADVISORY in pack manifests and app UI · Eliminates mathematical error where channel bed offset was ignored · Revert to direct water_surface_m - ground_m if absolute geodetic datum cross-sections become available.
