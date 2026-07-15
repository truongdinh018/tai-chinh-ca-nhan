"""So sánh 2–4 khoản vay."""

from __future__ import annotations

from tools.common import money


def _pmt(principal: float, apr: float, months: int) -> float:
    r = apr / 12
    if months <= 0:
        return 0
    if r == 0:
        return principal / months
    return principal * r * (1 + r) ** months / ((1 + r) ** months - 1)


def calculate(loans: list[dict]) -> dict:
    """loans: [{name, principal, apr, months}]"""
    rows = []
    for loan in loans:
        pmt = _pmt(loan["principal"], loan["apr"], loan["months"])
        total = pmt * loan["months"]
        rows.append(
            {
                "name": loan.get("name", "loan"),
                "tra_gop_thang": money(pmt),
                "tong_phai_tra": money(total),
                "tong_lai": money(total - loan["principal"]),
            }
        )
    best = min(rows, key=lambda x: x["tong_phai_tra"]) if rows else None
    return {"loans": rows, "tot_nhat_theo_tong_tra": best}
