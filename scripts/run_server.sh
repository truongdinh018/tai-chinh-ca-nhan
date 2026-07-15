#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ ! -d .venv ]]; then
  uv venv .venv --python 3.12
  # shellcheck disable=SC1091
  source .venv/bin/activate
  uv pip install -r requirements.txt
else
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi
export PYTHONPATH="$ROOT"
exec uvicorn server.app:app --host 127.0.0.1 --port 8787 --reload
