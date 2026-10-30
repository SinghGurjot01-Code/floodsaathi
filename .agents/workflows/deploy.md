---
description: Deploy the app, relay, backend and packs to Cloudflare, GitHub and (if needed) Render
---
# /deploy

1. Check `gh auth status`, `npx wrangler whoami`, `render whoami` (if used). If not logged in, run `/login-platforms` first.
2. App: deploy `app/` to Cloudflare Pages project `floodsaathi-app` (static upload via wrangler; no build step). Confirm the HTTPS URL loads, the service worker registers, and the app installs.
3. Relay: make sure `.github/workflows/relay.yml` has the `*/15 * * * *` schedule enabled and secrets are set; trigger `gh workflow run relay.yml`; watch it with `gh run watch`; confirm `latest/punjab.json` is published and `/health` shows a fresh age. If Actions cannot run a heavy job, create a Render cron job named `floodsaathi-<job>` (free or lowest tier only; ask before paying) and wire its env vars through the CLI.
4. Backend (Phase C+): `npx wrangler d1 migrations apply floodsaathi-db --remote`, deploy the Worker, run a signed-request smoke test with a real device key.
5. Packs and APK: upload to GitHub Releases with SHA-256 and signature; mirror to Hugging Face.
6. Record URLs and versions in `docs/RUNBOOK.md`. Never print secrets. Tick the relevant tasks.
