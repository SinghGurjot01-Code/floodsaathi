---
description: Build, sign and publish packs, APK and a tagged release
---
# /ship

1. Run `/verify`. Stop if any gate marked mandatory fails (must-pass safety items 100%, estimator never lowers status, no-mock check).
2. Build Region packs and the Lite/Guidance packs with `packs/build_pack.py`, sign manifests with ed25519 (`packs/sign_pack.py`; private key stays local or in a secret store, public key embedded in the app).
3. Build the Android APK (Capacitor sync, Gradle assemble), sign with the local keystore, test install on a real device.
4. Regenerate `eval/REPORT.md` from real data. Update the in-app attribution page and `docs/RUNBOOK.md`.
5. Tag a release, upload assets with hashes, mirror to Hugging Face, push. Report the release URL.
