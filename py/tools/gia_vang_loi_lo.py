"""Lãi/lỗ holding vàng bạc theo giá mua/bán."""

from __future__ import annotations

from tools.common import money


def calculate(
    so_luong: float,
    don_vi: str = "chi",
    gia_mua: float = 0,
    gia_hien_tai: float = 0,
    phi_mua: float = 0,
    phi_ban: float = 0,
) -> dict:
    cost = so_luong * gia_mua + phi_mua
    value = so_luong * gia_hien_tai - phi_ban
    pnl = value - cost
    pct = (pnl / cost * 100) if cost else 0
    return {
        "don_vi": don_vi,
        "so_luong": so_luong,
        "von": money(cost),
        "gia_tri_hien_tai": money(value),
        "lai_lo": money(pnl),
        "lai_lo_pct": round(pct, 2),
    }
