"""Quyết toán thuế TNCN (ước lượng năm)."""

from __future__ import annotations

from tools.common import money
from tools.tax_vn_2026 import ASSUMPTIONS, pit_from_taxable


def calculate(
    tong_thu_nhap_nam: float,
    bao_hiem_nam: float,
    so_nguoi_phu_thuoc: int = 0,
    thue_da_khau_tru: float = 0,
    giam_tru_khac: float = 0,
) -> dict:
    """Ước lượng quyết toán: so sánh thuế phải nộp vs đã khấu trừ."""
    personal = ASSUMPTIONS["personal_deduction_month"] * 12
    dep = so_nguoi_phu_thuoc * ASSUMPTIONS["dependent_deduction_month"] * 12
    taxable_year = tong_thu_nhap_nam - bao_hiem_nam - personal - dep - giam_tru_khac
    # Quy về tháng để dùng công thức tháng × 12 (đơn giản hóa)
    monthly_taxable = max(0, taxable_year) / 12
    tax_year = pit_from_taxable(monthly_taxable) * 12
    delta = tax_year - thue_da_khau_tru
    return {
        "thu_nhap_tinh_thue_nam": money(max(0, taxable_year)),
        "thue_phai_nop_nam": money(tax_year),
        "thue_da_khau_tru": money(thue_da_khau_tru),
        "chenh_lech": money(delta),
        "ket_luan": "Nộp thêm" if delta > 0 else ("Hoàn thuế" if delta < 0 else "Khớp"),
        "ghi_chu": "Ước lượng theo bình quân tháng; quyết toán thực tế theo tờ khai năm.",
    }
