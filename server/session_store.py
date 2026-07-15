"""In-memory session store: session_id -> derived vault key."""

from __future__ import annotations

import secrets
import threading
import time
from dataclasses import dataclass


@dataclass
class Session:
    key: bytes
    expires_at: float


class SessionStore:
    def __init__(self, ttl_seconds: int = 8 * 3600) -> None:
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        self._sessions: dict[str, Session] = {}

    def create(self, key: bytes) -> str:
        sid = secrets.token_urlsafe(32)
        with self._lock:
            self._purge_locked()
            self._sessions[sid] = Session(key=key, expires_at=time.time() + self._ttl)
        return sid

    def get(self, sid: str | None) -> bytes | None:
        if not sid:
            return None
        with self._lock:
            self._purge_locked()
            sess = self._sessions.get(sid)
            if not sess:
                return None
            # Sliding expiry on access
            sess.expires_at = time.time() + self._ttl
            return sess.key

    def delete(self, sid: str | None) -> None:
        if not sid:
            return
        with self._lock:
            self._sessions.pop(sid, None)

    def _purge_locked(self) -> None:
        now = time.time()
        expired = [k for k, v in self._sessions.items() if v.expires_at <= now]
        for k in expired:
            del self._sessions[k]


sessions = SessionStore()
