"""Debts CRUD."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from server import db
from server.deps import db_from_key, get_vault_key
from server.schemas import DebtIn, DebtOut

router = APIRouter(prefix="/api/debts", tags=["debts"])


@router.get("", response_model=list[DebtOut])
def list_all(key: bytes = Depends(get_vault_key)) -> list[DebtOut]:
    for conn in db_from_key(key):
        return [DebtOut(**r) for r in db.list_debts(conn)]
    return []


@router.post("", response_model=DebtOut)
def create(body: DebtIn, key: bytes = Depends(get_vault_key)) -> DebtOut:
    for conn in db_from_key(key):
        return DebtOut(**db.create_debt(conn, body.model_dump()))
    raise HTTPException(500, "DB error")


@router.put("/{debt_id}", response_model=DebtOut)
def update(debt_id: int, body: DebtIn, key: bytes = Depends(get_vault_key)) -> DebtOut:
    for conn in db_from_key(key):
        row = db.update_debt(conn, debt_id, body.model_dump())
        if not row:
            raise HTTPException(404, "Debt not found")
        return DebtOut(**row)
    raise HTTPException(500, "DB error")


@router.delete("/{debt_id}")
def delete(debt_id: int, key: bytes = Depends(get_vault_key)) -> dict:
    for conn in db_from_key(key):
        if not db.delete_debt(conn, debt_id):
            raise HTTPException(404, "Debt not found")
        return {"ok": True}
    raise HTTPException(500, "DB error")
