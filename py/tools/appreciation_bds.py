"""Appreciation / depreciation bất động sản."""

from __future__ import annotations

from tools.common import money


def calculate(
    gia_mua: float,
    so_nam: float,
    ty_le_tang_nam: float = 0.05,
    chi_phi_cai_tao: float = 0,
    ty_le_khau_hao_cong_trinh_nam: float = 0.0,
) -> dict:
    appreciated = (gia_mua + chi_phi_cai_tao) * (1 + ty_le_tang_nam) ** so_nam
    depreciated_structure = 0.0
    if ty_le_khau_hao_cong_trinh_nam:
        depreciated_structure = gia_mua * (1 - ty_le_khau_hao_cong_trinh_nam) ** so_nam
    return {
        "gia_tri_sau_appreciation": money(appreciated),
        "lai_danh_nghia": money(appreciated - gia_mua - chi_phi_cai_tao),
        "gia_tri_sau_khau_hao_uoc_tinh": money(depreciated_structure) if ty_le_khau_hao_cong_trinh_nam else None,
        "so_nam": so_nam,
        "cagr": ty_le_tang_nam,
    }
