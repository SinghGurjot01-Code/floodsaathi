#!/usr/bin/env python3
"""Fail the build if runtime code contains mock/simulated data patterns.
Test directories are allowed to hold labelled test vectors."""
import pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
RUNTIME = ["app", "relay", "backend", "console", "android", "packs", "models", "eval"]
SKIP_DIRS = {"test", "tests", "vendor", "node_modules", ".venv", "__pycache__", "build", ".git"}
SKIP_NAMES = {"REPORT.md"}
PATTERNS = [
    r"\bmock(ed|s)?\b", r"\blorem ipsum\b", r"\bdummy\b", r"\bsample[_ -]?data\b",
    r"\bfake[_ -]?(data|gauge|village|user|report)", r"\bdemo[_ -]?mode\b", r"\breplay[_ -]?mode\b",
    r"\bsynthetic\b", r"random\.(random|randint|uniform|choice)\(.*(level|gauge|rain|depth)",
    r"Math\.random\(\).*(level|gauge|rain|depth)", r"from\s+.*fixtures\s+import", r"import\s+.*fixtures",
]
rx = re.compile("|".join(PATTERNS), re.I)
EXT = {".js", ".mjs", ".html", ".py", ".json", ".kt", ".java", ".ts", ".md", ".css", ".yml", ".yaml"}
bad = []
for top in RUNTIME:
    base = ROOT / top
    if not base.exists():
        continue
    for p in base.rglob("*"):
        if not p.is_file() or p.suffix not in EXT or p.name in SKIP_NAMES:
            continue
        if any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts):
            continue
        try:
            for n, line in enumerate(p.read_text(errors="ignore").splitlines(), 1):
                if rx.search(line):
                    bad.append(f"{p.relative_to(ROOT)}:{n}: {line.strip()[:120]}")
        except OSError:
            pass
if bad:
    print("Mock/simulated-data patterns found in runtime code:")
    print("\n".join(bad[:100]))
    sys.exit(1)
print("check_no_mock: OK")
