"""DCA vs Lump Sum simulation (lợi suất cố định)."""

from __future__ import annotations

from tools.common import money


def calculate(
    so_tien_moi_thang: float,
    so_thang: int,
    loi_suat_nam: float = 0.10,
    lump_sum: float | None = None,
) -> dict:
    r = loi_suat_nam / 12
    fv_dca = 0.0
    for _ in range(so_thang):
        fv_dca = (fv_dca + so_tien_moi_thang) * (1 + r)
    principal_dca = so_tien_moi_thang * so_thang
    ls = lump_sum if lump_sum is not None else principal_dca
    fv_ls = ls * (1 + r) ** so_thang
    return {
        "goc_dca": money(principal_dca),
        "fv_dca": money(fv_dca),
        "lai_dca": money(fv_dca - principal_dca),
        "goc_lump_sum": money(ls),
        "fv_lump_sum": money(fv_ls),
        "lai_lump_sum": money(fv_ls - ls),
        "chenh_fv": money(fv_ls - fv_dca),
        "loi_suat_nam": loi_suat_nam,
        "so_thang": so_thang,
    }
