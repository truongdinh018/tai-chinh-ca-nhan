"""So sánh đầu tư vs gửi tiết kiệm (có điều chỉnh lạm phát)."""

from __future__ import annotations

from tools.common import money


def calculate(
    von: float,
    so_nam: float,
    lai_tiet_kiem: float = 0.05,
    loi_suat_dau_tu: float = 0.10,
    lam_phat: float = 0.035,
) -> dict:
    fv_save = von * (1 + lai_tiet_kiem) ** so_nam
    fv_inv = von * (1 + loi_suat_dau_tu) ** so_nam
    real_save = von * (1 + (lai_tiet_kiem - lam_phat)) ** so_nam
    real_inv = von * (1 + (loi_suat_dau_tu - lam_phat)) ** so_nam
    return {
        "fv_tiet_kiem": money(fv_save),
        "fv_dau_tu": money(fv_inv),
        "chenh_lech": money(fv_inv - fv_save),
        "fv_thuc_tiet_kiem": money(real_save),
        "fv_thuc_dau_tu": money(real_inv),
        "so_nam": so_nam,
        "lam_phat": lam_phat,
    }
