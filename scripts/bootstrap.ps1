# FloodSaathi bootstrap for Windows (PowerShell). Safe to re-run.
Set-Location (Join-Path $PSScriptRoot "..")
function Have($c) { return [bool](Get-Command $c -ErrorAction SilentlyContinue) }
Write-Host "== Mirror .agents -> .agent (older Antigravity versions)"
New-Item -ItemType Directory -Force .agent | Out-Null
Copy-Item -Recurse -Force .agents\* .agent\
Write-Host "== Core tools (winget)"
$pk = @{ "git"="Git.Git"; "gh"="GitHub.cli"; "node"="OpenJS.NodeJS.LTS"; "python"="Python.Python.3.11"; "java"="Microsoft.OpenJDK.17"; "conda"="Anaconda.Miniconda3" }
foreach ($k in $pk.Keys) { if (-not (Have $k)) { winget install --id $pk[$k] -e --accept-package-agreements --accept-source-agreements } }
Write-Host "== Node tooling"
if (Have npm) { npm install -g wrangler; npx --yes playwright install chromium }
Write-Host "== Python venv + base packages"
if (-not (Test-Path .venv)) { python -m venv .venv }
& .\.venv\Scripts\python.exe -m pip install -U pip huggingface_hub requests jsonschema pytest
Write-Host "== Versions"
foreach ($c in "git --version","gh --version","node --version","python --version","wrangler --version","java -version","conda --version","render --version","pmtiles --help") {
  Write-Host ("{0,-20}" -f ($c.Split(' ')[0])) -NoNewline
  try { (Invoke-Expression "$c 2>&1" | Select-Object -First 1) } catch { Write-Host "MISSING" }
}
Write-Host "== Still for the agent: Render CLI, pmtiles CLI, Android SDK (sdkmanager), project Python deps. Open a new terminal if PATH changed."
