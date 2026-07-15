"""Vault unlock / wrong password tests."""

from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from server import paths, vault


@pytest.fixture()
def isolated_vault(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    private = tmp_path / "private"
    private.mkdir()
    monkeypatch.setattr(paths, "PRIVATE_DIR", private)
    monkeypatch.setattr(paths, "DB_PATH", private / "finance.db")
    monkeypatch.setattr(paths, "SALT_PATH", private / "vault.salt")
    monkeypatch.setattr(vault, "DB_PATH", private / "finance.db")
    monkeypatch.setattr(vault, "SALT_PATH", private / "vault.salt")
    yield private
    shutil.rmtree(tmp_path, ignore_errors=True)


def test_create_and_unlock(isolated_vault):
    key = vault.create_vault("strongpass1")
    assert vault.vault_exists()
    key2 = vault.unlock_vault("strongpass1")
    assert key == key2
    conn = vault.connect(key2)
    assert vault.verify_key(conn)
    conn.close()


def test_wrong_password(isolated_vault):
    vault.create_vault("strongpass1")
    with pytest.raises(PermissionError):
        vault.unlock_vault("wrongpassXXXX")


def test_short_password(isolated_vault):
    with pytest.raises(ValueError):
        vault.create_vault("short")
