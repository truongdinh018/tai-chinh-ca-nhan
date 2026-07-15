"""Vay mua xe + tổng chi phí sở hữu ước tính."""

from __future__ import annotations

from tools.common import money


def calculate(
    gia_xe: float,
    tra_truoc: float,
    lai_vay_nam: float,
    so_thang: int,
    bao_hiem_nam: float = 0,
    xang_thang: float = 0,
    bao_duong_nam: float = 0,
) -> dict:
    loan = max(0, gia_xe - tra_truoc)
    r = lai_vay_nam / 12
    if r == 0:
        pmt = loan / so_thang if so_thang else 0
    else:
        pmt = loan * r * (1 + r) ** so_thang / ((1 + r) ** so_thang - 1)
    years = so_thang / 12
    ownership = (bao_hiem_nam + bao_duong_nam) * years + xang_thang * so_thang
    total = pmt * so_thang + tra_truoc + ownership
    return {
        "khoan_vay": money(loan),
        "tra_gop_thang": money(pmt),
        "tong_goc_lai": money(pmt * so_thang),
        "tong_chi_phi_so_huu": money(ownership),
        "tong_chi_phi": money(total),
        "so_thang": so_thang,
    }
