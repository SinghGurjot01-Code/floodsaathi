---
description: Install and verify the full toolchain for FloodSaathi, then record real versions
---
# /setup-env

Goal: a machine that can run every phase of the plan. Be autonomous; install what is missing.

1. Detect the OS. Run `scripts/bootstrap.ps1` on Windows (PowerShell) or `bash scripts/bootstrap.sh` on macOS, Linux or WSL. It mirrors `.agents/` to `.agent/` and installs or checks: git, GitHub CLI, Node.js 20+, Python 3.11 with venv, Wrangler, Playwright Chromium, Miniconda, JDK 17.
2. Handle what the script cannot, following the official docs for the current install steps:
   - Render CLI (render.com/docs/cli) and `render --version`.
   - pmtiles CLI (go-pmtiles releases on GitHub) and `pmtiles --help`.
   - Hugging Face CLI: `pip install -U huggingface_hub`.
   - Android command-line tools, platform-tools, build-tools and an Android platform via `sdkmanager`; set `ANDROID_HOME`. Needed from task B1; install now if time allows, otherwise record as pending.
   - Python packages: `pip install -r relay/requirements.txt` (create it if missing: requests, pydantic, jsonschema, feedparser, beautifulsoup4, lxml, boto3, pytest, numpy, pandas, scikit-learn, lightgbm, xarray, rasterio, pysheds, osmnx, networkx). Heavy ML packages (torch, peft, etc.) go in `models/requirements-ml.txt` and are installed only when needed.
3. Create `.env.local` from `.env.example` (never commit it) and confirm `.gitignore` covers it.
4. Run `node --version`, `python --version`, `gh --version`, `wrangler --version`, `render --version`, `pmtiles --help`, `conda --version`, `java -version`. Fix failures and retry.
5. Write `docs/ENVIRONMENT.md` with the REAL version of every tool and anything still pending. Tick P0-1 in `docs/tasks/STATUS.md` and commit.
6. Report in five lines: what is ready, what is pending, what needs the human.
