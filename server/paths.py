"""Filesystem paths for the encrypted vault."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRIVATE_DIR = ROOT / "data" / "private"
DB_PATH = PRIVATE_DIR / "finance.db"
SALT_PATH = PRIVATE_DIR / "vault.salt"
SAMPLES_DIR = ROOT / "data" / "samples"


def ensure_private_dir() -> None:
    PRIVATE_DIR.mkdir(parents=True, exist_ok=True)
