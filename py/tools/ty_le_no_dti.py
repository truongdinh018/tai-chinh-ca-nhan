"""Debt-to-Income ratio."""

from __future__ import annotations

from tools.common import money


def calculate(
    thu_nhap_thang: float,
    tong_tra_no_thang: float,
    nguong_an_toan: float = 0.40,
) -> dict:
    dti = tong_tra_no_thang / thu_nhap_thang if thu_nhap_thang else 0
    max_debt_service = thu_nhap_thang * nguong_an_toan
    return {
        "dti": round(dti, 4),
        "dti_pct": round(dti * 100, 2),
        "nguong_an_toan_pct": nguong_an_toan * 100,
        "an_toan": dti <= nguong_an_toan,
        "tra_no_toi_da_goi_y": money(max_debt_service),
        "du_dia": money(max(0, max_debt_service - tong_tra_no_thang)),
    }
