"""Sức mua thực của tiết kiệm sau lạm phát."""

from __future__ import annotations

from tools.common import money


def calculate(
    von: float,
    so_nam: float,
    lai_danh_nghia: float = 0.05,
    lam_phat: float = 0.035,
) -> dict:
    nominal = von * (1 + lai_danh_nghia) ** so_nam
    real_rate = (1 + lai_danh_nghia) / (1 + lam_phat) - 1
    real = von * (1 + real_rate) ** so_nam
    return {
        "fv_danh_nghia": money(nominal),
        "fv_suc_mua_thuc": money(real),
        "lai_thuc_hang_nam": round(real_rate * 100, 3),
        "mat_suc_mua_vs_goc": money(von - von / (1 + lam_phat) ** so_nam),
        "so_nam": so_nam,
    }
