#!/usr/bin/env bash
# FloodSaathi bootstrap for macOS / Linux / WSL. Safe to re-run.
set -u
cd "$(dirname "$0")/.."
have() { command -v "$1" >/dev/null 2>&1; }
OS="$(uname -s)"
say() { printf '\n== %s\n' "$*"; }
pm_install() {  # $1 = brew name, $2 = apt name
  if [ "$OS" = "Darwin" ] && have brew; then brew install "$1"
  elif have apt-get; then sudo apt-get install -y "$2"
  else echo "No supported package manager; install $1 manually."; fi
}
say "Mirror .agents -> .agent (older Antigravity versions)"
mkdir -p .agent && cp -R .agents/. .agent/ && echo done
say "Core tools"
have git    || pm_install git git
have gh     || { if [ "$OS" = "Darwin" ]; then brew install gh; else sudo apt-get install -y gh || echo "Install gh: https://cli.github.com"; fi; }
have node   || pm_install node nodejs
have python3 || pm_install python@3.11 python3
python3 -m venv --help >/dev/null 2>&1 || { have apt-get && sudo apt-get install -y python3-venv python3-pip; }
have java   || pm_install openjdk@17 openjdk-17-jdk
have conda  || echo "Miniconda missing: install from https://docs.conda.io/en/latest/miniconda.html (needed for OpenHydroNet)"
say "Node tooling"
have npm && npm install -g wrangler >/dev/null 2>&1 || npx --yes wrangler --version
have npx && npx --yes playwright install chromium
say "Python venv + base packages"
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate && pip install -U pip >/dev/null && pip install -U huggingface_hub requests jsonschema pytest >/dev/null && echo ok
say "Versions"
for c in "git --version" "gh --version" "node --version" "python3 --version" "wrangler --version" "java -version" "conda --version" "render --version" "pmtiles --help"; do
  printf '%-22s' "${c%% *}"; $c 2>&1 | head -n1 || echo MISSING
done
say "Still for the agent to install from official docs: Render CLI, pmtiles CLI, Android SDK (sdkmanager), project Python deps"
