---
description: Prove every data source works with real live data and record the findings
---
# /data-audit

Task P0-4. No mock data: every finding comes from a real request made now.
1. For each source in PRD section 12: CWC flood forecasting portal, India-WRIS (via HydroSwift where useful), NDMA SACHET (find the Punjab RSS feed and an all-India sample), Open-Meteo (forecast, flood/GloFAS, elevation, marine), GUARDIAN, Sentinel-1 access, INCOIS. Make a real request; record URL, UTC time, HTTP status, record count, and one real sample value.
2. Build the real list of Punjab CWC stations with warning and danger marks, river and upstream/downstream order. Check whether Harike appears. Record GUARDIAN coverage and end date for those stations.
3. If a source is blocked or its layout changed, try the documented alternatives (HydroSwift, a different host, a polite delay, official data request). Record the exact error and the chosen workaround. If none works, say so; the UI will show "unavailable". Never fake data.
4. Check the Google Flood Hub map for gauges on the Sutlej, Beas and Ravi (optional cross-check). Check terms of use for CWC and WRIS and write what you found; flag any blocker for the human.
5. Write `docs/DATA_SOURCES.md`, tick P0-4, run `python scripts/check_no_mock.py`, commit.
