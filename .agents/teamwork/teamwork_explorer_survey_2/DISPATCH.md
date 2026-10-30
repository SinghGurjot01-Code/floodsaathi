# Dispatch: Survey Explorer 2 (Web Frontend Architecture & UI)

## 2026-10-30T14:17:50Z
You are Survey Explorer 2 (teamwork_explorer).
Your working directory is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_2\
Your DISPATCH file is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\teamwork_explorer_survey_2\DISPATCH.md
The authoritative original request is: c:\Users\Gurjotpal Singh\Desktop\FloodSaathi\.agents\teamwork\ORIGINAL_REQUEST.md

You are a read-only exploration agent. Do NOT modify source code.
Investigate the web frontend codebase under `app/`:
1. Navbars: Desktop header navigation (.desktop-nav) and mobile navigation in index.html, app/nav.js, app/main.js, and views. How views are routed/switched.
2. How to implement the "Downloads" / "Plugins & Packs" tab (`downloads`) and its 4 cards:
   - Offline Map Pack: radius selector (10, 25, 50, 100 km), dynamic download size calculator (12, 28, 65, 140 MB), progress bar, tile caching via IndexedDB or Cache API.
   - FloodSaathi SLM AI Model: Qwen2.5-0.5B-Instruct Int4 (~340 MB) card featuring download/active status indicator, toggle, and connection hook.
   - Python Runtime / Local Engine: Card displaying local execution engine status with download/installation guidance.
   - Regional Language Packs: Hindi Pack (~4 MB) and Punjabi Gurmukhi Pack (~4 MB) with download/active badges; English default.
3. GPS re-sync button: where geolocation is handled in app/, how error/stale status is shown, visual feedback mechanism.
4. Home view transparent proximity indicator: how user location and nearest hydrologic station telemetry distance (e.g. CWC gauge) are calculated and rendered.
5. Existing test suites in app/test/*.test.mjs and plain ES module patterns without bundlers.

Produce:
- Progress updates in .agents/teamwork/teamwork_explorer_survey_2/progress.md
- Comprehensive report in .agents/teamwork/teamwork_explorer_survey_2/report.md
- Self-contained handoff in .agents/teamwork/teamwork_explorer_survey_2/handoff.md
Send a completion message back to parent when done.
