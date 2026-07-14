"""Common helpers for CLI tools."""

from __future__ import annotations

import json
from typing import Any


def money(x: float) -> float:
    return float(round(x))


def dumps(result: dict[str, Any]) -> str:
    return json.dumps(result, ensure_ascii=False, indent=2, default=str)


def require_positive(name: str, value: float) -> None:
    if value < 0:
        raise ValueError(f"{name} phải >= 0, nhận được {value}")
