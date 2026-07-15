"""Barista FIRE — bán nghỉ hưu với thu nhập part-time."""

from __future__ import annotations

from tools.common import money


def calculate(
    chi_tieu_nam: float,
    thu_nhap_part_time_nam: float,
    tai_san_hien_tai: float = 0,
    withdrawal_rate: float = 0.04,
) -> dict:
    gap_spend = max(0, chi_tieu_nam - thu_nhap_part_time_nam)
    barista_number = gap_spend / withdrawal_rate if withdrawal_rate else 0
    covered = thu_nhap_part_time_nam / chi_tieu_nam if chi_tieu_nam else 0
    return {
        "chi_phi_can_tu_dau_tu": money(gap_spend),
        "barista_fire_number": money(barista_number),
        "tai_san_hien_tai": money(tai_san_hien_tai),
        "con_thieu": money(max(0, barista_number - tai_san_hien_tai)),
        "ty_le_part_time_cover_pct": round(covered * 100, 1),
    }
