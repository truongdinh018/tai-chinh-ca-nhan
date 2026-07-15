"""Auth: setup / unlock / lock / status."""

from __future__ import annotations

from fastapi import APIRouter, Cookie, HTTPException, Response

from server.deps import COOKIE_NAME
from server.schemas import AuthStatus, PasswordBody
from server.session_store import sessions
from server.vault import create_vault, unlock_vault, vault_exists

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(response: Response, sid: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=sid,
        httponly=True,
        samesite="lax",
        max_age=8 * 3600,
        path="/",
    )


@router.get("/status", response_model=AuthStatus)
def status(vault_sid: str | None = Cookie(default=None, alias=COOKIE_NAME)) -> AuthStatus:
    return AuthStatus(
        setup_required=not vault_exists(),
        unlocked=sessions.get(vault_sid) is not None,
    )


@router.post("/setup", response_model=AuthStatus)
def setup(body: PasswordBody, response: Response) -> AuthStatus:
    if vault_exists():
        raise HTTPException(status_code=400, detail="Vault đã tồn tại.")
    try:
        key = create_vault(body.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    sid = sessions.create(key)
    _set_session_cookie(response, sid)
    return AuthStatus(setup_required=False, unlocked=True)


@router.post("/unlock", response_model=AuthStatus)
def unlock(body: PasswordBody, response: Response) -> AuthStatus:
    if not vault_exists():
        raise HTTPException(status_code=400, detail="Chưa setup vault.")
    try:
        key = unlock_vault(body.password)
    except PermissionError as e:
        raise HTTPException(status_code=401, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    sid = sessions.create(key)
    _set_session_cookie(response, sid)
    return AuthStatus(setup_required=False, unlocked=True)


@router.post("/lock", response_model=AuthStatus)
def lock(
    response: Response,
    vault_sid: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> AuthStatus:
    sessions.delete(vault_sid)
    response.delete_cookie(COOKIE_NAME, path="/")
    return AuthStatus(setup_required=not vault_exists(), unlocked=False)
