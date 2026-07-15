"""SQLCipher vault: KDF + open/create encrypted DB."""

from __future__ import annotations

import secrets
from pathlib import Path
from typing import Any

from argon2.low_level import Type, hash_secret_raw
from sqlcipher3 import dbapi2 as sqlcipher

from server.paths import DB_PATH, SALT_PATH, ensure_private_dir

SCHEMA_VERSION = 1
SALT_BYTES = 16
KEY_BYTES = 32
ARGON2_TIME = 3
ARGON2_MEMORY_KIB = 64 * 1024
ARGON2_PARALLELISM = 2


def vault_exists() -> bool:
    return DB_PATH.is_file() and SALT_PATH.is_file()


def _load_or_create_salt(*, create: bool) -> bytes:
    ensure_private_dir()
    if SALT_PATH.is_file():
        return SALT_PATH.read_bytes()
    if not create:
        raise FileNotFoundError("Vault salt missing; run setup first.")
    salt = secrets.token_bytes(SALT_BYTES)
    SALT_PATH.write_bytes(salt)
    try:
        SALT_PATH.chmod(0o600)
    except OSError:
        pass
    return salt


def derive_key(password: str, *, create_salt: bool = False) -> bytes:
    if not password or len(password) < 8:
        raise ValueError("Password phải có ít nhất 8 ký tự.")
    salt = _load_or_create_salt(create=create_salt)
    return hash_secret_raw(
        secret=password.encode("utf-8"),
        salt=salt,
        time_cost=ARGON2_TIME,
        memory_cost=ARGON2_MEMORY_KIB,
        parallelism=ARGON2_PARALLELISM,
        hash_len=KEY_BYTES,
        type=Type.ID,
    )


def connect(key: bytes) -> Any:
    ensure_private_dir()
    conn = sqlcipher.connect(str(DB_PATH), check_same_thread=False)
    # SQLCipher hex key form must be double-quoted: "x'...'"
    conn.execute(f"""PRAGMA key = "x'{key.hex()}'" """)
    conn.execute("PRAGMA cipher_memory_security = ON")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlcipher.Row
    return conn


def verify_key(conn: Any) -> bool:
    try:
        row = conn.execute(
            "SELECT value FROM meta WHERE key = 'schema_version'"
        ).fetchone()
        return row is not None and str(row["value"]) == str(SCHEMA_VERSION)
    except Exception:
        return False


def init_schema(conn: Any) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'other',
            quantity REAL NOT NULL DEFAULT 1,
            unit TEXT NOT NULL DEFAULT '',
            cost_vnd REAL NOT NULL DEFAULT 0,
            current_value_vnd REAL NOT NULL DEFAULT 0,
            note TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            amount_vnd REAL NOT NULL,
            category TEXT NOT NULL DEFAULT '',
            direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
            note TEXT NOT NULL DEFAULT '',
            asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS salary_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            period_ym TEXT NOT NULL,
            gross REAL NOT NULL DEFAULT 0,
            net REAL NOT NULL DEFAULT 0,
            dependents INTEGER NOT NULL DEFAULT 0,
            note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS debts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            principal_vnd REAL NOT NULL DEFAULT 0,
            balance_vnd REAL NOT NULL DEFAULT 0,
            rate_year REAL NOT NULL DEFAULT 0,
            note TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tool_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tool_id TEXT NOT NULL,
            input_json TEXT NOT NULL,
            output_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """
    )
    conn.execute(
        "INSERT OR REPLACE INTO meta(key, value) VALUES ('schema_version', ?)",
        (str(SCHEMA_VERSION),),
    )
    conn.execute(
        "INSERT OR REPLACE INTO meta(key, value) VALUES ('created_at', datetime('now'))"
    )
    conn.commit()


def create_vault(password: str) -> bytes:
    if vault_exists():
        raise FileExistsError("Vault đã tồn tại. Dùng unlock.")
    key = derive_key(password, create_salt=True)
    conn = connect(key)
    try:
        init_schema(conn)
        if not verify_key(conn):
            raise RuntimeError("Không khởi tạo được schema vault.")
    finally:
        conn.close()
    try:
        Path(DB_PATH).chmod(0o600)
    except OSError:
        pass
    return key


def unlock_vault(password: str) -> bytes:
    if not vault_exists():
        raise FileNotFoundError("Chưa có vault. Chạy setup trước.")
    key = derive_key(password, create_salt=False)
    conn = connect(key)
    try:
        if not verify_key(conn):
            raise PermissionError("Sai password hoặc vault hỏng.")
    finally:
        conn.close()
    return key
