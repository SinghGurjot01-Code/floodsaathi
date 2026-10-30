# FloodSaathi Environment Configuration

Verified on: 2026-10-30T15:06:00+05:30
Operating System: Windows 10 / 11 (build 26300, AMD64)

## Toolchain & Versions

| Tool | Version / Details | Status |
|---|---|---|
| OS | Windows 10.0.26300 x86_64 | Verified |
| Git | git version 2.54.0.windows.1 | Verified |
| GitHub CLI (`gh`) | gh version 2.96.0 (2026-07-02) | Verified |
| Node.js | v24.13.1 | Verified |
| npm | 11.8.0 | Verified |
| Cloudflare Wrangler | 4.156.0 | Verified |
| Playwright Chromium | 156.0.8078.4 (playwright chromium v1248) | Verified |
| Python (runtime virtualenv) | Python 3.12.0 (`.venv\Scripts\python.exe`) | Verified |
| Pip | pip 26.2.2 | Verified |
| Pytest | pytest 9.2.0 | Verified |
| Render CLI | render v2.33.0 | Verified |
| PMTiles CLI | pmtiles 1.31.2 (commit a3e4951ea6) | Verified |
| Hugging Face CLI | `hf` 2.4.0 (with `huggingface-cli` wrapper) | Verified |
| Java (JDK) | OpenJDK 21.0.12.1 LTS (Temurin-21.0.12.1+1) | Verified |
| Android SDK / `adb` | Android Debug Bridge version 1.0.41 (37.0.1-15733141) at `C:\Users\Gurjotpal Singh\AppData\Local\Android\Sdk` | Verified |
| Conda | Not installed globally; virtualenv with Python 3.12 used for all packages | N/A (Python 3.12 venv used) |

## Installed Python Packages (`relay/requirements.txt`)
- `requests`: 2.34.2
- `pydantic`: 2.14.2 (`pydantic-core`: 2.50.2)
- `jsonschema`: 4.26.0
- `feedparser`: 6.0.14
- `beautifulsoup4`: 4.15.0
- `lxml`: 6.1.3
- `boto3`: 1.43.122 (`botocore`: 1.43.122)
- `pytest`: 9.2.0
- `numpy`: 2.5.4
- `pandas`: 3.1.0
- `scikit-learn`: 1.9.1
- `lightgbm`: 4.7.0
- `xarray`: 2026.9.0
- `rasterio`: 1.5.2
- `pysheds`: 0.5
- `osmnx`: 2.1.1
- `networkx`: 3.7
- `shapely`: 2.2.0
- `geopandas`: 1.2.0
- `scipy`: 1.18.1
- `huggingface_hub`: 2.4.0

## Status Summary
- Core tools and runtime environments are installed and verified.
- `.env.local` created from `.env.example` and verified to be git-ignored.
- `scripts/check_no_mock.py` passes cleanly.
