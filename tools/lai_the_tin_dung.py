"""Lãi thẻ tín dụng (ước lượng dư nợ quay vòng)."""

from __future__ import annotations

from tools.common import money


def calculate(
    du_no: float,
    lai_suat_nam: float = 0.25,
    so_thang: int = 6,
    tra_toi_thieu_pct: float = 0.05,
) -> dict:
    bal = du_no
    interest_total = 0.0
    paid_total = 0.0
    monthly_rate = lai_suat_nam / 12
    for _ in range(so_thang):
        interest = bal * monthly_rate
        interest_total += interest
        bal += interest
        pay = max(bal * tra_toi_thieu_pct, 0)
        pay = min(pay, bal)
        bal -= pay
        paid_total += pay
        if bal <= 1:
            break
    return {
        "lai_suat_nam": lai_suat_nam,
        "tong_lai": money(interest_total),
        "tong_da_tra": money(paid_total),
        "du_no_con_lai": money(bal),
        "canh_bao": "Trả tối thiểu khiến lãi đội rất nhanh — ưu tiên trả hết sớm.",
    }
