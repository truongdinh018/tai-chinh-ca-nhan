"""Quy đổi ngoại tệ (tỷ giá nhập tay — không gọi API)."""

from __future__ import annotations

from tools.common import money


def calculate(
    so_tien: float,
    ty_gia: float,
    currency: str = "USD",
    huong: str = "to_vnd",
) -> dict:
    """huong: to_vnd = ngoại tệ → VND; from_vnd = VND → ngoại tệ."""
    if huong == "to_vnd":
        out = so_tien * ty_gia
        return {"currency": currency, "input": so_tien, "ty_gia": ty_gia, "vnd": money(out)}
    out = so_tien / ty_gia if ty_gia else 0
    return {"currency": currency, "vnd": money(so_tien), "ty_gia": ty_gia, "foreign": round(out, 4)}
