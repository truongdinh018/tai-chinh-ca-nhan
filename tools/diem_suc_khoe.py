"""Điểm sức khỏe tài chính (8 yếu tố, thang 0–100) — mô hình đơn giản kiểu CFPB."""

from __future__ import annotations


def _score_ratio(value: float, good: float, bad: float, higher_is_better: bool = True) -> float:
    if higher_is_better:
        if value >= good:
            return 100
        if value <= bad:
            return 0
        return (value - bad) / (good - bad) * 100
    if value <= good:
        return 100
    if value >= bad:
        return 0
    return (bad - value) / (bad - good) * 100


def calculate(
    thu_nhap_thang: float,
    chi_tieu_thang: float,
    quy_du_phong: float,
    tong_no: float,
    tra_no_thang: float,
    tai_san_dau_tu: float,
    co_bao_hiem: bool = False,
    theo_doi_ngan_sach: bool = True,
) -> dict:
    savings_rate = (thu_nhap_thang - chi_tieu_thang) / thu_nhap_thang if thu_nhap_thang else 0
    ef_months = quy_du_phong / chi_tieu_thang if chi_tieu_thang else 0
    dti = tra_no_thang / thu_nhap_thang if thu_nhap_thang else 1
    debt_to_income_asset = tong_no / max(thu_nhap_thang * 12, 1)
    invest_ratio = tai_san_dau_tu / max(thu_nhap_thang * 12, 1)

    factors = {
        "ty_le_tiet_kiem": round(_score_ratio(savings_rate, 0.2, 0.0), 1),
        "quy_du_phong_thang": round(_score_ratio(ef_months, 6, 0), 1),
        "dti": round(_score_ratio(dti, 0.2, 0.5, higher_is_better=False), 1),
        "no_tren_thu_nhap_nam": round(_score_ratio(debt_to_income_asset, 1, 5, higher_is_better=False), 1),
        "tai_san_dau_tu": round(_score_ratio(invest_ratio, 1, 0), 1),
        "bao_hiem": 100.0 if co_bao_hiem else 40.0,
        "ngan_sach": 100.0 if theo_doi_ngan_sach else 50.0,
        "du_dia_chi_tieu": round(_score_ratio(1 - chi_tieu_thang / thu_nhap_thang if thu_nhap_thang else 0, 0.3, 0), 1),
    }
    score = round(sum(factors.values()) / len(factors), 1)
    if score >= 80:
        label = "Tốt"
    elif score >= 60:
        label = "Ổn"
    elif score >= 40:
        label = "Cần cải thiện"
    else:
        label = "Yếu"
    return {"score": score, "label": label, "factors": factors}
