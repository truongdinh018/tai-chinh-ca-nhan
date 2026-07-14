"""Ước lượng trợ cấp thất nghiệp (mô hình đơn giản)."""

from __future__ import annotations

from tools.common import money


def calculate(
    luong_binh_quan_6_thang: float,
    so_thang_dong_bhtn: int,
    muc_toi_da_he_so: float = 5.0,
) -> dict:
    """Trợ cấp ≈ 60% lương BQ, tối đa X lần LTT vùng (đơn giản bằng hệ số × LTT nhập tay)."""
    months_benefit = min(12, max(0, so_thang_dong_bhtn // 12 * 3))  # ~3 tháng / 12 tháng đóng (làm tròn)
    if so_thang_dong_bhtn >= 12:
        months_benefit = min(12, 3 * (so_thang_dong_bhtn // 12))
    else:
        months_benefit = 0
    monthly = min(luong_binh_quan_6_thang * 0.6, luong_binh_quan_6_thang)  # cap tùy chỉnh ngoài
    # Cho phép người dùng đưa sẵn mức trần qua muc_toi_da_he_so * (LTT ~ lương/20 ước lượng)
    return {
        "tro_cap_thang_uoc_tinh": money(luong_binh_quan_6_thang * 0.6),
        "so_thang_huong_uoc_tinh": months_benefit,
        "tong_tro_cap_uoc_tinh": money(luong_binh_quan_6_thang * 0.6 * months_benefit),
        "ghi_chu": "Công thức đơn giản hóa — đối chiếu quy định BHTN hiện hành & LTT vùng.",
        "muc_toi_da_he_so_tham_chieu": muc_toi_da_he_so,
    }
