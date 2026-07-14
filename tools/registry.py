"""Registry: danh sách công cụ và entrypoint."""

from __future__ import annotations

from typing import Callable

from tools import (
    appreciation_bds,
    barista_fire,
    bao_hiem_huu_tri,
    bao_hiem_that_nghiep,
    chi_phi_nuoi_con,
    dca,
    diem_suc_khoe,
    fire,
    gia_vang_loi_lo,
    lai_the_tin_dung,
    luong_gross_net,
    mua_vs_thue_nha,
    quy_du_phong,
    quyet_toan_tncn,
    rui_ro_tai_chinh,
    snowball_avalanche,
    so_sanh_dau_tu_vs_tiet_kiem,
    so_sanh_khoan_vay,
    tiet_kiem_vs_lam_phat,
    ty_gia,
    ty_le_no_dti,
    vay_mua_xe,
)

ToolFn = Callable[..., dict]

REGISTRY: dict[str, dict] = {
    "luong_gross_net": {
        "title": "Tính Lương Gross ↔ Net (2 chiều)",
        "category": "Lương - Bảo Hiểm - Thuế",
        "status": "live",
        "module": luong_gross_net,
    },
    "quyet_toan_tncn": {
        "title": "Quyết Toán Thuế TNCN",
        "category": "Lương - Bảo Hiểm - Thuế",
        "status": "live",
        "module": quyet_toan_tncn,
    },
    "bao_hiem_that_nghiep": {
        "title": "Bảo Hiểm Thất Nghiệp",
        "category": "Lương - Bảo Hiểm - Thuế",
        "status": "live",
        "module": bao_hiem_that_nghiep,
    },
    "bao_hiem_huu_tri": {
        "title": "Bảo Hiểm Hưu Trí (ước lượng)",
        "category": "Lương - Bảo Hiểm - Thuế",
        "status": "live",
        "module": bao_hiem_huu_tri,
    },
    "gia_vang_loi_lo": {
        "title": "Giá Vàng/Bạc — Lãi/Lỗ Holding",
        "category": "Đầu Tư - Tiết Kiệm",
        "status": "live",
        "module": gia_vang_loi_lo,
    },
    "dca": {
        "title": "Đầu Tư Định Kỳ DCA vs Lump Sum",
        "category": "Đầu Tư - Tiết Kiệm",
        "status": "live",
        "module": dca,
    },
    "quy_du_phong": {
        "title": "Quỹ Dự Phòng Khẩn Cấp",
        "category": "Đầu Tư - Tiết Kiệm",
        "status": "live",
        "module": quy_du_phong,
    },
    "ty_gia": {
        "title": "Quy Đổi Tỷ Giá Ngoại Tệ",
        "category": "Đầu Tư - Tiết Kiệm",
        "status": "live",
        "module": ty_gia,
    },
    "so_sanh_dau_tu_vs_tiet_kiem": {
        "title": "So Sánh Đầu Tư vs Tiết Kiệm",
        "category": "Đầu Tư - Tiết Kiệm",
        "status": "live",
        "module": so_sanh_dau_tu_vs_tiet_kiem,
    },
    "tiet_kiem_vs_lam_phat": {
        "title": "Tiết Kiệm vs Lạm Phát",
        "category": "Đầu Tư - Tiết Kiệm",
        "status": "live",
        "module": tiet_kiem_vs_lam_phat,
    },
    "diem_suc_khoe": {
        "title": "Điểm Sức Khỏe Tài Chính",
        "category": "Bảo Vệ - Rủi Ro",
        "status": "live",
        "module": diem_suc_khoe,
    },
    "rui_ro_tai_chinh": {
        "title": "Đánh Giá Rủi Ro Tài Chính Cá Nhân",
        "category": "Bảo Vệ - Rủi Ro",
        "status": "live",
        "module": rui_ro_tai_chinh,
    },
    "fire": {
        "title": "FIRE Calculator",
        "category": "FIRE - Nghỉ Hưu",
        "status": "live",
        "module": fire,
    },
    "barista_fire": {
        "title": "Barista FIRE",
        "category": "FIRE - Nghỉ Hưu",
        "status": "live",
        "module": barista_fire,
    },
    "mua_vs_thue_nha": {
        "title": "So Sánh Mua Nhà vs Thuê Nhà",
        "category": "Vay - Nhà - Xe",
        "status": "live",
        "module": mua_vs_thue_nha,
    },
    "ty_le_no_dti": {
        "title": "Tỷ Lệ Nợ An Toàn (DTI)",
        "category": "Vay - Nhà - Xe",
        "status": "live",
        "module": ty_le_no_dti,
    },
    "snowball_avalanche": {
        "title": "Trả Nợ Snowball vs Avalanche",
        "category": "Vay - Nhà - Xe",
        "status": "live",
        "module": snowball_avalanche,
    },
    "vay_mua_xe": {
        "title": "Tính Tiền Vay Mua Xe",
        "category": "Vay - Nhà - Xe",
        "status": "live",
        "module": vay_mua_xe,
    },
    "so_sanh_khoan_vay": {
        "title": "So Sánh Các Khoản Vay",
        "category": "Vay - Nhà - Xe",
        "status": "live",
        "module": so_sanh_khoan_vay,
    },
    "lai_the_tin_dung": {
        "title": "Tính Lãi Thẻ Tín Dụng",
        "category": "Vay - Nhà - Xe",
        "status": "live",
        "module": lai_the_tin_dung,
    },
    "appreciation_bds": {
        "title": "Appreciation & Depreciation BĐS",
        "category": "Vay - Nhà - Xe",
        "status": "live",
        "module": appreciation_bds,
    },
    "chi_phi_nuoi_con": {
        "title": "Chi Phí Nuôi Con (0–18)",
        "category": "Gia Đình - Giáo Dục",
        "status": "live",
        "module": chi_phi_nuoi_con,
    },
}


def get_tool(name: str) -> ToolFn:
    if name not in REGISTRY:
        raise KeyError(f"Không có tool `{name}`. Dùng --list để xem.")
    return REGISTRY[name]["module"].calculate
