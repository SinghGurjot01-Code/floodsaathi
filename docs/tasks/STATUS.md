# Backlog status (agent keeps this file current)

Update the box, add the commit hash and a one-line result when a task is done. Work top to bottom; never skip a dependency.


## Phase 0 — Foundations

- [x] **P0-1** Environment setup (run /setup-env) (deps: -) — done: Toolchain installed & verified (Node v24.13.1, Python 3.12.0 in .venv, Wrangler 4.156.0, Render v2.33.0, pmtiles 1.31.2, hf 2.4.0, JDK 21, Android SDK adb 37.0.1); docs/ENVIRONMENT.md written.
- [ ] **P0-2** Platform logins and accounts (run /login-platforms) (deps: P0-1) — done when: gh, wrangler, render, huggingface-cli all report an authenticated user (whoami output recorded without secrets); Copernicus Data Space and NASA Earthdata accounts exist; anything only the human can do is in docs/RUNBOOK.md.
- [ ] **P0-3** Create the GitHub repo and CI (deps: P0-2) — done when: Public repo `floodsaathi` exists with the kit committed; CI runs node tests, pytest, JSON-schema validation and scripts/check_no_mock.py and is green.
- [ ] **P0-4** Real data-source audit (run /data-audit) (deps: P0-1) — done when: docs/DATA_SOURCES.md has, for every source in section 12, a live fetch result (URL, UTC timestamp, record count); real list of Punjab CWC stations with warning/danger marks; Punjab SACHET feed URL; GUARDIAN coverage and end date for those stations; Flood Hub gauge check; every failure has its exact error and a chosen workaround.

## Phase A — MVP live (F1–F8, Punjab PWA)

- [ ] **A1** PWA shell, i18n (en/hi/pa), local fonts, service worker (deps: P0-3) — done when: Installs as a PWA; reload works with the network off; language switch works; no hard-coded strings.
- [ ] **A2** Relay v1 with live sources, archive, front detection (deps: P0-4) — done when: `latest/punjab.json` built from live data validates against schemas/relay.v1.schema.json; archive file written each run; pytest passes; no fixtures in runtime code.
- [ ] **A3** Hosting and cron: Pages + R2/Worker (or gh-pages) + Actions every 15 min (deps: A1,A2) — done when: Public app URL live; `DATA_BASE_URL/latest/punjab.json` loads cross-origin; /health shows age; at least 4 consecutive scheduled runs succeeded.
- [ ] **A4** Estimator and status modules with tests (deps: A1) — done when: All section 9.7 vectors and section 8.1 rule tests pass under `node --test`.
- [ ] **A5** Snapshot store + F1 My Status + F4 Alerts + F8 Offline-first (deps: A3,A4) — done when: On a real phone browser: real gauge data shown with age badge; with network really off, card flips to estimated and the range counts down; status never lowers.
- [ ] **A6** Reach speeds from real history (GUARDIAN + archive) (deps: P0-4,A2) — done when: Per-gauge-pair table with n_events; pairs with fewer than 5 events marked `assumed` and shown as rough.
- [ ] **A7** M2 HAND pipeline and Region pack for Amritsar (deps: P0-4) — done when: villages.json, shelters, hospitals, risk areas, elevation raster built from real DEM/OSM; Sentinel-1 validation numbers computed and written to eval/REPORT.md.
- [ ] **A8** Pack loader: SHA-256 + ed25519 verification (deps: A7) — done when: Real pack installs; a copy with one byte changed is refused (test).
- [ ] **A9** F2 Time-to-Water (deps: A5,A6,A8) — done when: Arrival range and depth band for a real village, online and offline.
- [ ] **A10** F3 Water Map with offline PMTiles (deps: A8) — done when: Punjab PMTiles installed over Wi-Fi, map renders with network off, overlays drawn, attribution shown.
- [ ] **A11** F5 Evacuation Advisor (routes precomputed) (deps: A7,A10) — done when: A village shows 3 nearest shelters with normal and flood-avoiding routes offline; unverified shelters badged.
- [ ] **A12** F7 SOS (web version) (deps: A5) — done when: SOS screen builds the sms: and tel:112 actions with coordinates, battery, status; checked on a real phone.
- [ ] **A13** F6 Ask Saathi: cards (en/hi/pa) + BM25 retriever + router + refusals (deps: A1) — done when: 60-80 cards with sources; eval/cards_eval.py reports top-1 accuracy on 100 labelled queries and 40 must-pass items (must be 100%).
- [ ] **A14** Offline-estimator backtest on real history (eval only) (deps: A4,A6) — done when: eval/REPORT.md has in-range %, wrongly-lowered count (must be 0) and median error, computed from real recorded events; proxy for ground truth stated.
- [ ] **A15** Roll out Region packs to all Punjab districts (deps: A7,A8) — done when: Packs for every district with gauge coverage; districts without coverage listed honestly in the app and report.

## Phase B — Android app and AI

- [ ] **B1** Android app (Capacitor wrapper of the same web code) (deps: A15) — done when: Signed APK on GitHub Releases; WorkManager background snapshots on the adaptive cadence; one-tap SOS (SMS then 112 dialer); tested on a real device.
- [ ] **B2** M1 baseline forecaster in the relay (deps: A6) — done when: Gates in section 13 measured on the time split; model_forecasts published; advisory label if a gate fails.
- [ ] **B3** M1 via OpenHydroNet (spike, then integrate if go) (deps: B2) — done when: Spike report with go/no-go; if go, daily model_forecasts with model openhydronet-v1 running on Actions or a Render cron job; benchmark vs B2 in REPORT.md.
- [ ] **B4** Guidance LLM pack (M3) (deps: A13,B1) — done when: 5-10k human-filtered instruction pairs; LoRA fine-tune; int4 export; runs on-device in the Android app; 300-question eval, 40 must-pass at 100%, hallucination <= 5%, first token <= 5 s on a 4 GB phone.
- [ ] **B5** F16 Voice and low-literacy mode (deps: B1) — done when: Speech in and out in Hindi and English on device; Punjabi coverage verified on real devices and reported; icon-first low-literacy mode.
- [ ] **B6** Embedding retriever in the Lite pack (deps: A13) — done when: Multilingual embedder benchmarked on Hindi and Punjabi queries; retrieval accuracy beats BM25 or it is not shipped.

## Phase C — Community and personal safety

- [ ] **C1** Backend: Cloudflare Worker + D1 + KV, anonymous device keys, rate limits (deps: A3) — done when: Signed requests verified; per-device and per-area rate limits enforced; schema migrations in repo; deployed.
- [ ] **C2** F10 Community reports (deps: C1) — done when: Real submissions only; coarse location by default; a road turns red only after 3 independent confirmations; moderation queue works.
- [ ] **C3** F9 Family check-in (deps: C1,B1) — done when: Two real devices complete a check-in, including queued while offline; consented location only; 7-day expiry.
- [ ] **C4** F14 Smart alert tuning + notifications (deps: C1,B1) — done when: Local notifications and Web Push with cool-downs; thresholds adapt to elevation, river distance and user feedback; explanations shown.
- [ ] **C5** F11 Rumour check (deps: A13) — done when: Pasted message is compared with real official alerts and gauge data; verdicts: matches / contradicted / cannot verify, each with the evidence shown.
- [ ] **C6** F12 Farmer and livestock mode (deps: A9) — done when: Cards from cited PAU/ICAR/Punjab Agriculture advisories plus time-to-move guidance from the arrival range.
- [ ] **C7** F13 Damage evidence kit (deps: B1) — done when: Timestamped, geotagged capture with hash chain and PDF export, all local.
- [ ] **C8** F15 After-flood guide (deps: A13) — done when: Cards for returning home, water, electricity, health and claims, with sources, linked to F13.

## Phase D — Scale and advanced

- [ ] **D1** F17 Sarpanch / volunteer console (deps: C2,C3) — done when: Invite-token access; aggregated real check-ins and reports for one village group; broadcast via app push and share links.
- [ ] **D2** F18 Assist registry (deps: C1) — done when: Opt-in, consented, encrypted at rest, visible only to the assigned volunteer, deletable by the person; DPDP checklist in docs.
- [ ] **D3** F19 Offline SOS relay (Android only) (deps: B1) — done when: Signed SOS packets hop phone to phone over Nearby/Bluetooth until one has internet; tested with at least 3 real devices.
- [ ] **D4** F20 Flood extent overlay from Sentinel-1 (deps: A7) — done when: Scheduled job (Render cron or Actions) produces real flood masks per satellite pass with acquisition time; overlay in the map.
- [ ] **D5** F21 Depth from photo (reference-object method) (deps: B1) — done when: User marks a known-height reference and waterline; depth computed geometrically; labelled advisory; accuracy measured on real photos.
- [ ] **D6** Coastal sea level, tide and surge views (deps: A3) — done when: Open-Meteo Marine and INCOIS/SACHET data shown for coastal users with source and age.
- [ ] **D7** Regions: Himachal Pradesh and Haryana (deps: A15) — done when: Gauges, reach speeds, Region packs and SACHET feeds for both; Ghaggar covered.
- [ ] **D8** Region: Jammu and Kashmir (deps: D7) — done when: Same as D7.
- [ ] **D9** Coastal states regions (deps: D6,D8) — done when: Same as D7 plus coastal views.
- [ ] **D10** Final evaluation report, licences page, release (deps: D9) — done when: eval/REPORT.md complete with real numbers; attribution page; tagged release with signed packs.
