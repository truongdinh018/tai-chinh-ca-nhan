"""Snowball vs Avalanche debt payoff simulation."""

from __future__ import annotations

from copy import deepcopy

from tools.common import money


def _simulate(debts: list[dict], extra: float, order: str) -> dict:
    ds = deepcopy(debts)
    if order == "snowball":
        ds.sort(key=lambda d: d["balance"])
    else:
        ds.sort(key=lambda d: -d["apr"])
    month = 0
    interest_total = 0.0
    max_months = 600
    while any(d["balance"] > 1 for d in ds) and month < max_months:
        month += 1
        # interest
        for d in ds:
            if d["balance"] <= 0:
                continue
            interest = d["balance"] * d["apr"] / 12
            d["balance"] += interest
            interest_total += interest
        # minimums + extra to first target
        extra_left = extra
        for i, d in enumerate(ds):
            if d["balance"] <= 0:
                continue
            pay = d["min_payment"]
            if i == 0 or all(x["balance"] <= 0 for x in ds[:i]):
                # find first with balance
                pass
        # pay mins
        for d in ds:
            if d["balance"] <= 0:
                continue
            pay = min(d["balance"], d["min_payment"])
            d["balance"] -= pay
        # extra to lowest priority remaining
        target = next((d for d in ds if d["balance"] > 0), None)
        if target and extra_left > 0:
            pay = min(target["balance"], extra_left)
            target["balance"] -= pay
    return {"months": month, "interest_total": money(interest_total)}


def calculate(debts: list[dict], extra_payment: float = 0) -> dict:
    """debts: [{name, balance, apr, min_payment}] apr dạng 0.18 = 18%/năm."""
    if not debts:
        raise ValueError("Cần ít nhất 1 khoản nợ")
    snow = _simulate(debts, extra_payment, "snowball")
    aval = _simulate(debts, extra_payment, "avalanche")
    return {
        "snowball": snow,
        "avalanche": aval,
        "tiet_kiem_lai_neu_avalanche": money(snow["interest_total"] - aval["interest_total"]),
        "goi_y": "Avalanche tiết kiệm lãi hơn" if aval["interest_total"] <= snow["interest_total"] else "Snowball nhanh tâm lý hơn",
    }
