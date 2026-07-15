"""Đánh giá rủi ro tài chính cá nhân (score + gợi ý)."""

from __future__ import annotations


def calculate(
    thu_nhap_thang: float,
    chi_tieu_thang: float,
    quy_du_phong: float,
    thu_nhap_don_nguon: bool = True,
    ty_trong_tai_san_rui_ro: float = 0.3,
    co_bao_hiem_nhan_tho: bool = False,
) -> dict:
    ef = quy_du_phong / chi_tieu_thang if chi_tieu_thang else 0
    risk = 0
    notes = []
    if ef < 3:
        risk += 25
        notes.append("Quỹ dự phòng < 3 tháng chi tiêu")
    if thu_nhap_don_nguon:
        risk += 15
        notes.append("Thu nhập đơn nguồn")
    if chi_tieu_thang / thu_nhap_thang > 0.8 if thu_nhap_thang else True:
        risk += 20
        notes.append("Chi tiêu cao so với thu nhập")
    if ty_trong_tai_san_rui_ro > 0.5:
        risk += 20
        notes.append("Tỷ trọng tài sản rủi ro cao")
    if not co_bao_hiem_nhan_tho:
        risk += 10
        notes.append("Chưa có bảo hiểm nhân thọ/bảo vệ")
    risk = min(100, risk)
    level = "Thấp" if risk < 30 else ("Trung bình" if risk < 60 else "Cao")
    return {
        "risk_score": risk,
        "level": level,
        "notes": notes,
        "goi_y": [
            "Ưu tiên quỹ dự phòng 3–6 tháng",
            "Đa dạng nguồn thu / giảm phụ thuộc 1 kênh",
            "Giảm tỷ trọng tài sản biến động mạnh nếu chưa đủ đệm",
        ],
    }
