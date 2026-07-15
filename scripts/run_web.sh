#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/scripts/sync_web_public.sh"
cd "$ROOT/web"
if [[ ! -d node_modules ]]; then
  npm install
fi
exec npm run dev
