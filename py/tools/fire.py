"""FIRE calculator — lean / standard / fat."""

from __future__ import annotations

from tools.common import money


def calculate(
    chi_tieu_nam: float,
    tai_san_hien_tai: float = 0,
    tiet_kiem_nam: float = 0,
    loi_suat_thuc: float = 0.07,
    withdrawal_rate: float = 0.04,
    mode: str = "standard",
) -> dict:
    mult = {"lean": 0.7, "standard": 1.0, "fat": 1.5}.get(mode, 1.0)
    spend = chi_tieu_nam * mult
    fire_number = spend / withdrawal_rate
    gap = max(0, fire_number - tai_san_hien_tai)
    # years to fire with constant contribution
    years = 0.0
    assets = tai_san_hien_tai
    if tiet_kiem_nam <= 0 and assets < fire_number:
        years = None
    else:
        while assets < fire_number and years < 80:
            assets = assets * (1 + loi_suat_thuc) + tiet_kiem_nam
            years += 1
        if assets < fire_number:
            years = None
    return {
        "mode": mode,
        "chi_tieu_nam_dieu_chinh": money(spend),
        "fire_number": money(fire_number),
        "gap": money(gap),
        "so_nam_uoc_tinh": years,
        "withdrawal_rate": withdrawal_rate,
        "loi_suat_thuc": loi_suat_thuc,
    }
