---
description: Log in to GitHub, Cloudflare, Render, Hugging Face and data portals using official flows
---
# /login-platforms

You have permission to log in and create project resources (see `.agents/rules/access-and-boundaries.md`). Ask the human once for the email to use, then drive each flow in the terminal and browser.

For each platform: run the login, finish the browser step yourself, pause only for password / 2FA / emailed code / CAPTCHA / payment, then verify with a whoami-style command.
1. GitHub: `gh auth login --web`; `gh auth status`. Create the public repo `floodsaathi`, push this kit.
2. Cloudflare: `npx wrangler login`; `npx wrangler whoami`. Create (names `floodsaathi-*`): Pages project, R2 bucket if no card is required, D1 database `floodsaathi-db`, KV namespace `floodsaathi-kv`. If R2 asks for a payment method, stop that sub-step, use the `gh-pages` publish fallback, and note it in `docs/RUNBOOK.md`.
3. Render: `render login`; list workspaces and services (read-only). Create nothing yet unless a task needs it; never touch existing services.
4. Hugging Face: create an access token in the browser, then `huggingface-cli login`; `huggingface-cli whoami`. Create the repo `floodsaathi-packs`.
5. Copernicus Data Space and NASA Earthdata: sign in or register in the browser; store credentials only in `.env.local` and CI secrets.
6. Google Earth Engine (optional): `earthengine authenticate` only if Copernicus Data Space cannot supply the Sentinel-1 data needed for A7/D4.
7. Set GitHub Actions secrets with `gh secret set` for everything the relay needs (R2 keys, bucket, account id) as soon as they exist.
8. Write the result to `docs/RUNBOOK.md`: for each platform, logged in yes/no, resource names created, anything the human still has to do. Never write a secret. Tick P0-2 and commit.
