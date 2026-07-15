"""Chi phí nuôi con 0–18 tuổi (ước lượng có lạm phát)."""

from __future__ import annotations

from tools.common import money


def calculate(
    chi_phi_thang_hien_tai: float,
    tuoi_hien_tai: int = 0,
    tuoi_ket_thuc: int = 18,
    lam_phat: float = 0.04,
    he_so_tang_theo_tuoi: float = 0.03,
) -> dict:
    total = 0.0
    monthly = chi_phi_thang_hien_tai
    rows = []
    for age in range(tuoi_hien_tai, tuoi_ket_thuc):
        year_cost = monthly * 12
        rows.append({"tuoi": age, "chi_phi_nam": money(year_cost)})
        total += year_cost
        monthly *= (1 + lam_phat) * (1 + he_so_tang_theo_tuoi)
    return {
        "tong_chi_phi": money(total),
        "so_nam": tuoi_ket_thuc - tuoi_hien_tai,
        "chi_tiet_theo_nam": rows,
        "ghi_chu": "Ước lượng — chỉnh chi_phi_thang theo thực tế gia đình.",
    }
