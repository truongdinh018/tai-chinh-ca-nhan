"""Quỹ dự phòng khẩn cấp."""

from __future__ import annotations

from tools.common import money


def calculate(
    chi_tieu_thang: float,
    so_thang_muc_tieu: float = 6,
    so_tien_hien_co: float = 0,
    tiet_kiem_moi_thang: float = 0,
) -> dict:
    target = chi_tieu_thang * so_thang_muc_tieu
    gap = max(0, target - so_tien_hien_co)
    months = (gap / tiet_kiem_moi_thang) if tiet_kiem_moi_thang > 0 else None
    return {
        "muc_tieu": money(target),
        "hien_co": money(so_tien_hien_co),
        "con_thieu": money(gap),
        "ty_le_hoan_thanh_pct": round(so_tien_hien_co / target * 100, 1) if target else 0,
        "thang_can_de_dat": round(months, 1) if months is not None else None,
        "so_thang_chi_tra_duoc": round(so_tien_hien_co / chi_tieu_thang, 1) if chi_tieu_thang else 0,
    }
