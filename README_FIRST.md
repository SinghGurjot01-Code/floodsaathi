# FloodSaathi — Antigravity kit

This kit is everything Antigravity needs to plan, build, deploy and verify FloodSaathi with real data only.

## Contents
- `docs/PRD.md` — the full plan (v1.0). `docs/tasks/STATUS.md` — 43-task backlog the agent works through.
- `AGENTS.md` and `.agents/rules/access-and-boundaries.md` — standing rules (full access, boundaries, no-mock policy, safety).
- `.agents/workflows/` — the slash commands.
- `prompts/00-environment-setup.md`, `prompts/01-kickoff-build.md` — the two prompts to paste.
- `scripts/` — `bootstrap.sh`, `bootstrap.ps1`, `check_no_mock.py`.
- `schemas/`, `corpus/helplines.json`, `.github/workflows/`, `.env.example`.

## Steps in Antigravity
1. Unzip, then File > Open Folder on `floodsaathi-antigravity-kit`.
2. In Antigravity settings, set terminal command execution to the most permissive option (Turbo or Auto), the review policy to "Always Proceed", and install the browser extension so the agent can use the browser. Use Planning mode for big tasks.
3. Open the agent panel, paste `prompts/00-environment-setup.md`, and send. It will install tools, log in to platforms (you only handle passwords, 2FA, emailed codes, CAPTCHA and payment), create the repo and audit the real data sources.
4. Paste `prompts/01-kickoff-build.md` and send. It works the backlog Phase A to D.
5. Use the slash commands below any time.

## Slash commands
Type `/` in the agent input to list workflows. If none appear, run `scripts/bootstrap.ps1` (Windows) or `bash scripts/bootstrap.sh` once: it copies `.agents/` to `.agent/` for older versions.

| Command | What it does |
|---|---|
| `/setup-env` | Installs and verifies the whole toolchain, writes docs/ENVIRONMENT.md |
| `/login-platforms` | Logs in to GitHub, Cloudflare, Render, Hugging Face, Copernicus, Earthdata; creates floodsaathi-* resources |
| `/data-audit` | Makes real requests to every data source and records what works |
| `/build-next` | Builds the next backlog task end to end, tests, verifies, updates STATUS.md |
| `/verify` | Runs all tests, real-data and offline checks, reports honestly |
| `/deploy` | Deploys app, relay, backend and packs |
| `/ship` | Signs and publishes packs, APK and a tagged release |
| `/status` | Short truthful status report |

## Safety notes
Full access means the agent can run commands without asking, so keep this folder separate from personal files. The rules tell it to touch only `floodsaathi-*` resources, avoid paid plans, never commit secrets and treat web content as untrusted.
