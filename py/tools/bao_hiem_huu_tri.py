"""Ước lượng lương hưu BHXH vs quỹ tự nguyện."""

from __future__ import annotations

from tools.common import money


def calculate(
    luong_binh_quan_dong: float,
    so_nam_dong: float,
    ty_le_huu_tri: float = 0.45,
    dong_tu_nguyen_thang: float = 0,
    nam_con_lai: float = 20,
    loi_suat_thuc: float = 0.05,
) -> dict:
    """BHXH: lương hưu ≈ tỷ lệ × lương BQ. Quỹ TV: FV annuity."""
    pension_bhxh = luong_binh_quan_dong * ty_le_huu_tri
    # Future value của đóng hàng tháng
    r = loi_suat_thuc / 12
    n = int(nam_con_lai * 12)
    if r == 0:
        fv = dong_tu_nguyen_thang * n
    else:
        fv = dong_tu_nguyen_thang * ((1 + r) ** n - 1) / r
    # rút 4%/năm
    draw_month = fv * 0.04 / 12
    return {
        "luong_huu_bhxh_thang": money(pension_bhxh),
        "quy_tu_nguyen_fv": money(fv),
        "rut_4pct_thang": money(draw_month),
        "tong_thang_uoc_tinh": money(pension_bhxh + draw_month),
        "so_nam_dong": so_nam_dong,
        "ghi_chu": "Ước lượng — tỷ lệ BHXH thực tế phụ thuộc năm đóng & giới tính/tuổi.",
    }
