"""So sánh mua nhà vs thuê nhà (đơn giản hóa 5–10 năm)."""

from __future__ import annotations

from tools.common import money


def calculate(
    gia_nha: float,
    von_tu_co: float,
    lai_vay_nam: float,
    so_nam_vay: int,
    thue_thang: float,
    chi_phi_so_huu_nam: float = 0,
    tang_gia_nha_nam: float = 0.03,
    tang_thue_nam: float = 0.03,
    so_nam_so_sanh: int = 10,
    loi_suat_dau_tu_von: float = 0.07,
) -> dict:
    loan = max(0, gia_nha - von_tu_co)
    r = lai_vay_nam / 12
    n = so_nam_vay * 12
    pmt = loan * r * (1 + r) ** n / ((1 + r) ** n - 1) if r and n else (loan / n if n else 0)

    # Thuê: đầu tư vốn tự có, trả thuê
    rent_fv_cost = 0.0
    rent = thue_thang
    invest = von_tu_co
    for year in range(so_nam_so_sanh):
        for _ in range(12):
            invest = invest * (1 + loi_suat_dau_tu_von / 12) + 0
            rent_fv_cost += rent  # simplified tracking nominal rent paid
        rent *= 1 + tang_thue_nam
        # contribute what would have been mortgage excess? keep simple: only opportunity on down payment
        invest = invest  # already compounded monthly above — fix: compound yearly lump
    # Recalculate invest properly
    invest = von_tu_co * (1 + loi_suat_dau_tu_von) ** so_nam_so_sanh
    total_rent_paid = 0.0
    rent = thue_thang
    for year in range(so_nam_so_sanh):
        total_rent_paid += rent * 12
        rent *= 1 + tang_thue_nam

    # Mua: trả gốc lãi + phí sở hữu, có equity
    total_paid = pmt * 12 * so_nam_so_sanh + chi_phi_so_huu_nam * so_nam_so_sanh
    house_value = gia_nha * (1 + tang_gia_nha_nam) ** so_nam_so_sanh
    # remaining loan balance after so_nam_so_sanh
    months_paid = so_nam_so_sanh * 12
    if r and n:
        bal = loan * ((1 + r) ** n - (1 + r) ** months_paid) / ((1 + r) ** n - 1)
    else:
        bal = max(0, loan - (loan / n) * months_paid) if n else 0
    equity = house_value - bal
    buy_net = equity - (total_paid - loan)  # rough net position vs cash burned
    # Better metric: net worth buy vs rent
    nw_buy = equity
    nw_rent = invest
    cost_buy_cash = total_paid
    return {
        "tra_gop_thang": money(pmt),
        "tong_tien_tra_mua": money(total_paid),
        "gia_nha_sau_n_nam": money(house_value),
        "du_no_con_lai": money(bal),
        "equity_mua": money(equity),
        "tong_tien_thue": money(total_rent_paid),
        "fv_von_khi_thue": money(invest),
        "chenh_nw_mua_tru_thue": money(nw_buy - nw_rent),
        "so_nam": so_nam_so_sanh,
        "goi_y": "Mua tốt hơn thuê (theo NW)" if nw_buy >= nw_rent else "Thuê + đầu tư vốn có lợi hơn (theo NW)",
    }
