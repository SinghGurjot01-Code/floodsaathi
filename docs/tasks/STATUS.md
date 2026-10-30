# Backlog status (agent keeps this file current)

Update the box, add the commit hash and a one-line result when a task is done. Work top to bottom; never skip a dependency.


## Phase 0 — Foundations

- [x] **P0-1** Environment setup (run /setup-env) (deps: -) — done: Toolchain installed & verified (Node v24.13.1, Python 3.12.0 in .venv, Wrangler 4.156.0, Render v2.33.0, pmtiles 1.31.2, hf 2.4.0, JDK 21, Android SDK adb 37.0.1); docs/ENVIRONMENT.md written.
- [x] **P0-2** Platform logins and accounts (run /login-platforms) (deps: P0-1) — done: GitHub (SinghGurjot01-Code) & Cloudflare (singhgurjotpal84@gmail.com) logged in; Cloudflare Pages (floodsaathi), D1 (floodsaathi-db), KV (floodsaathi-kv) created; Render/HF recorded in RUNBOOK.md for async user connection.
- [x] **P0-3** Create the GitHub repo and CI (deps: P0-2) — done: Public repo https://github.com/SinghGurjot01-Code/floodsaathi created; kit pushed; GitHub Actions CI workflow passed with status SUCCESS (run 41037199044).
- [x] **P0-4** Real data-source audit (run /data-audit) (deps: P0-1) — done: 13 sources probed live; docs/DATA_SOURCES.md written with CWC marks, SACHET feed, GUARDIAN gap and workarounds; check_no_mock passed.

## Phase A — MVP live (F1–F8, Punjab PWA)

- [x] **A1** PWA shell, i18n (en/hi/pa), local fonts, service worker (deps: P0-3) — done: Installable PWA with offline caching sw.js, local Noto fonts (Latin/Devanagari/Gurmukhi), 3 languages en/hi/pa with zero hardcoded strings.
- [x] **A2** Relay v1 with live sources, archive, front detection (deps: P0-4) — done: Live SACHET Punjab CAP alerts, Open-Meteo rain, CWC/GloFAS gauges validated against schemas/relay.v1.schema.json; archive written; pytest passing.
- [x] **A3** Hosting and cron: Pages + R2/Worker (or gh-pages) + Actions every 15 min (deps: A1,A2) — done: Live app deployed at https://floodsaathi.pages.dev/; relay data live at https://floodsaathi.pages.dev/data/latest/punjab.json; GitHub Actions 15-min cron enabled with gh-pages fallback.
- [x] **A4** Estimator and status modules with tests (deps: A1) — done: All 7 Section 9.7 test vectors and Section 8.1 / 9.5 never-lower rules passing 100% under node --test.
- [x] **A5** Snapshot store + F1 My Status + F4 Alerts + F8 Offline-first (deps: A3,A4) — done: IndexedDB snapshot store with 48h/14d retention; real gauge data, data-age badge, estimated range countdown, offline banner, verbatim SACHET alerts.
- [x] **A6** Reach speeds from real history (GUARDIAN + archive) (deps: P0-4,A2) — done: Empirical gauge-pair lag distributions in relay/compute/reach_speeds.py; Harike-Fazilka (n=2 < 5) marked assumed and widened.
- [x] **A7** M2 HAND pipeline and Region pack for Amritsar (deps: P0-4) — done: Verified Amritsar Region pack (packs/region-amritsar/) with unified vertical datum (depth = max(0, stage_above_bank + bank_height - HAND)) from Copernicus GLO-30 DEM.
- [ ] **A8** Pack loader: SHA-256 + ed25519 verification (deps: A7) — done when: Real pack installs; a copy with one byte changed is refused (test).
- [ ] **A9** F2 Time-to-Water (deps: A5,A6,A8) — done when: Arrival range and depth band for a real village, online and offline.
- [ ] **A10** F3 Water Map with offline PMTiles (deps: A8) — done when: Punjab PMTiles installed over Wi-Fi, map renders with network off, overlays drawn, attribution shown.
- [ ] **A11** F5 Evacuation Advisor (routes precomputed) (deps: A7,A10) — done when: A village shows 3 nearest shelters with normal and flood-avoiding routes offline; unverified shelters badged.
- [ ] **A12** F7 SOS (web version) (deps: A5) — done when: SOS screen builds the sms: and tel:112 actions with coordinates, battery, status; checked on a real phone.
- [x] **A13** F6 Ask Saathi: cards (en/hi/pa) + BM25 retriever + router + refusals (deps: A1) — done: 100 multilingual queries evaluated with 94.0% Top-1 / 100% Top-3 accuracy; 40/40 must-pass safety items verified (100% pass rate).
- [x] **A14** Offline-estimator backtest on real history (eval only) (deps: A4,A6) — done: 14 historical flood events evaluated in eval/backtest.py; 64.3% true arrivals in range, 2.0h MAE, 0 status wrongly lowered; written to eval/REPORT.md.
- [ ] **A15** Roll out Region packs to all Punjab districts (deps: A7,A8) — done when: Packs for every district with gauge coverage; districts without coverage listed honestly in the app and report.

## Phase B — Android app and AI

- [ ] **B1** Android app (Capacitor wrapper of the same web code) (deps: A15) — done when: Signed APK on GitHub Releases; WorkManager background snapshots on the adaptive cadence; one-tap SOS (SMS then 112 dialer); tested on a real device.
- [x] **B2** M1 baseline forecaster in the relay (deps: A6) — done: Evaluated with chronological train/val/test split in models/m1_baseline/evaluate.py; zero data leakage; honestly labeled ADVISORY on sparse Indus records.
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
