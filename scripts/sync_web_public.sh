#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/web/public/py" "$ROOT/web/public/samples"
rm -rf "$ROOT/web/public/py/tools"
cp -a "$ROOT/tools" "$ROOT/web/public/py/tools"
rm -rf "$ROOT/web/public/py/tools/__pycache__"
cp -f "$ROOT/data/samples/assets.csv" "$ROOT/web/public/samples/assets.csv"
# Keep web tool samples in sync with CLI SAMPLES
if [[ -x "$ROOT/.venv/bin/python" ]]; then
  PYTHONPATH="$ROOT" "$ROOT/.venv/bin/python" "$ROOT/scripts/export_tool_samples.py"
elif command -v python3 >/dev/null 2>&1; then
  PYTHONPATH="$ROOT" python3 "$ROOT/scripts/export_tool_samples.py" || true
fi
