"""Assets CRUD."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from server import db
from server.deps import db_from_key, get_vault_key
from server.schemas import AssetIn, AssetOut

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=list[AssetOut])
def list_all(key: bytes = Depends(get_vault_key)) -> list[AssetOut]:
    for conn in db_from_key(key):
        return [AssetOut(**r) for r in db.list_assets(conn)]
    return []


@router.post("", response_model=AssetOut)
def create(body: AssetIn, key: bytes = Depends(get_vault_key)) -> AssetOut:
    for conn in db_from_key(key):
        return AssetOut(**db.create_asset(conn, body.model_dump()))
    raise HTTPException(500, "DB error")


@router.put("/{asset_id}", response_model=AssetOut)
def update(asset_id: int, body: AssetIn, key: bytes = Depends(get_vault_key)) -> AssetOut:
    for conn in db_from_key(key):
        row = db.update_asset(conn, asset_id, body.model_dump())
        if not row:
            raise HTTPException(404, "Asset not found")
        return AssetOut(**row)
    raise HTTPException(500, "DB error")


@router.delete("/{asset_id}")
def delete(asset_id: int, key: bytes = Depends(get_vault_key)) -> dict:
    for conn in db_from_key(key):
        if not db.delete_asset(conn, asset_id):
            raise HTTPException(404, "Asset not found")
        return {"ok": True}
    raise HTTPException(500, "DB error")
