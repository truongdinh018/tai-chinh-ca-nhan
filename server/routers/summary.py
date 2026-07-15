"""Summary + sample import."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from server import db
from server.deps import db_from_key, get_vault_key
from server.paths import SAMPLES_DIR
from server.schemas import SummaryOut

router = APIRouter(prefix="/api", tags=["summary"])


@router.get("/summary", response_model=SummaryOut)
def get_summary(key: bytes = Depends(get_vault_key)) -> SummaryOut:
    for conn in db_from_key(key):
        return SummaryOut(**db.summary(conn))
    raise HTTPException(500, "DB error")


@router.post("/import/sample-assets")
def import_samples(key: bytes = Depends(get_vault_key)) -> dict:
    csv_path = SAMPLES_DIR / "assets.csv"
    for conn in db_from_key(key):
        try:
            count = db.import_sample_assets(conn, csv_path)
        except FileNotFoundError as e:
            raise HTTPException(404, str(e)) from e
        return {"imported": count}
    raise HTTPException(500, "DB error")
