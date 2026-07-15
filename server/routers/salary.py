"""Salary records CRUD."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from server import db
from server.deps import db_from_key, get_vault_key
from server.schemas import SalaryIn, SalaryOut

router = APIRouter(prefix="/api/salary", tags=["salary"])


@router.get("", response_model=list[SalaryOut])
def list_all(key: bytes = Depends(get_vault_key)) -> list[SalaryOut]:
    for conn in db_from_key(key):
        return [SalaryOut(**r) for r in db.list_salary(conn)]
    return []


@router.post("", response_model=SalaryOut)
def create(body: SalaryIn, key: bytes = Depends(get_vault_key)) -> SalaryOut:
    for conn in db_from_key(key):
        return SalaryOut(**db.create_salary(conn, body.model_dump()))
    raise HTTPException(500, "DB error")


@router.put("/{salary_id}", response_model=SalaryOut)
def update(
    salary_id: int, body: SalaryIn, key: bytes = Depends(get_vault_key)
) -> SalaryOut:
    for conn in db_from_key(key):
        row = db.update_salary(conn, salary_id, body.model_dump())
        if not row:
            raise HTTPException(404, "Salary record not found")
        return SalaryOut(**row)
    raise HTTPException(500, "DB error")


@router.delete("/{salary_id}")
def delete(salary_id: int, key: bytes = Depends(get_vault_key)) -> dict:
    for conn in db_from_key(key):
        if not db.delete_salary(conn, salary_id):
            raise HTTPException(404, "Salary record not found")
        return {"ok": True}
    raise HTTPException(500, "DB error")
