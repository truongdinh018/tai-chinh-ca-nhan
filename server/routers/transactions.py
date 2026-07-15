"""Transactions CRUD."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from server import db
from server.deps import db_from_key, get_vault_key
from server.schemas import TransactionIn, TransactionOut

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionOut])
def list_all(key: bytes = Depends(get_vault_key)) -> list[TransactionOut]:
    for conn in db_from_key(key):
        return [TransactionOut(**r) for r in db.list_transactions(conn)]
    return []


@router.post("", response_model=TransactionOut)
def create(body: TransactionIn, key: bytes = Depends(get_vault_key)) -> TransactionOut:
    for conn in db_from_key(key):
        return TransactionOut(**db.create_transaction(conn, body.model_dump()))
    raise HTTPException(500, "DB error")


@router.put("/{tx_id}", response_model=TransactionOut)
def update(
    tx_id: int, body: TransactionIn, key: bytes = Depends(get_vault_key)
) -> TransactionOut:
    for conn in db_from_key(key):
        row = db.update_transaction(conn, tx_id, body.model_dump())
        if not row:
            raise HTTPException(404, "Transaction not found")
        return TransactionOut(**row)
    raise HTTPException(500, "DB error")


@router.delete("/{tx_id}")
def delete(tx_id: int, key: bytes = Depends(get_vault_key)) -> dict:
    for conn in db_from_key(key):
        if not db.delete_transaction(conn, tx_id):
            raise HTTPException(404, "Transaction not found")
        return {"ok": True}
    raise HTTPException(500, "DB error")
