"""FastAPI dependencies: require unlocked vault session."""

from __future__ import annotations

from typing import Any, Generator

from fastapi import Cookie, HTTPException, Request

from server.session_store import sessions
from server.vault import connect

COOKIE_NAME = "vault_sid"


def get_vault_key(vault_sid: str | None = Cookie(default=None, alias=COOKIE_NAME)) -> bytes:
    key = sessions.get(vault_sid)
    if key is None:
        raise HTTPException(status_code=401, detail="Vault locked. Unlock required.")
    return key


def get_db(key: bytes = None) -> Generator[Any, None, None]:  # type: ignore[assignment]
    # FastAPI injects key via Depends(get_vault_key) at router level
    raise NotImplementedError


def db_from_key(key: bytes) -> Generator[Any, None, None]:
    conn = connect(key)
    try:
        yield conn
    finally:
        conn.close()


def require_unlocked(request: Request) -> bytes:
    sid = request.cookies.get(COOKIE_NAME)
    key = sessions.get(sid)
    if key is None:
        raise HTTPException(status_code=401, detail="Vault locked. Unlock required.")
    return key
