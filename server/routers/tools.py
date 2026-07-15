"""Bridge to tools.registry calculate()."""

from __future__ import annotations

import sys
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

# Ensure repo root on path for `tools` package
_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from tools.registry import REGISTRY, get_tool  # noqa: E402

from server import db  # noqa: E402
from server.deps import db_from_key, get_vault_key  # noqa: E402
from server.schemas import ToolInfo, ToolRunIn, ToolRunOut  # noqa: E402

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("", response_model=list[ToolInfo])
def list_tools(_key: bytes = Depends(get_vault_key)) -> list[ToolInfo]:
    return [
        ToolInfo(
            id=tid,
            title=meta["title"],
            category=meta["category"],
            status=meta["status"],
        )
        for tid, meta in REGISTRY.items()
    ]


@router.post("/{tool_id}/run", response_model=ToolRunOut)
def run_tool(
    tool_id: str, body: ToolRunIn, key: bytes = Depends(get_vault_key)
) -> ToolRunOut:
    try:
        fn = get_tool(tool_id)
    except KeyError as e:
        raise HTTPException(404, str(e)) from e
    try:
        output = fn(**body.params)
    except TypeError as e:
        raise HTTPException(400, f"Sai tham số: {e}") from e
    except Exception as e:
        raise HTTPException(400, str(e)) from e
    if not isinstance(output, dict):
        output = {"result": output}
    for conn in db_from_key(key):
        saved = db.save_tool_run(conn, tool_id, body.params, output)
        return ToolRunOut(**saved)
    raise HTTPException(500, "DB error")
