#!/usr/bin/env python3
"""Export CLI SAMPLES to web/src/tools/samples.json (single source of truth)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.run_tool import SAMPLES  # noqa: E402

OUT = ROOT / "web" / "src" / "tools" / "samples.json"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    serial = json.loads(json.dumps(SAMPLES))
    OUT.write_text(json.dumps(serial, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(serial)} tools)")


if __name__ == "__main__":
    main()
