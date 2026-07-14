"""Tính lương Gross ↔ Net 2 chiều — TNCN 5 bậc 2026."""

from __future__ import annotations

from tools.common import money
from tools.tax_vn_2026 import ASSUMPTIONS, insurance_employee, pit_from_taxable, pit_progressive_detail


def _net_from_gross(gross: float, dependents: int, region: str) -> dict:
    ins = insurance_employee(gross, region)
    personal = ASSUMPTIONS["personal_deduction_month"]
    dep = dependents * ASSUMPTIONS["dependent_deduction_month"]
    taxable = gross - ins["total"] - personal - dep
    pit = pit_from_taxable(taxable)
    net = gross - ins["total"] - pit
    return {
        "mode": "gross_to_net",
        "gross": money(gross),
        "bao_hiem": ins,
        "giam_tru_ban_than": personal,
        "giam_tru_phu_thuoc": money(dep),
        "thu_nhap_tinh_thue": money(max(0, taxable)),
        "thue_tncn": money(pit),
        "chi_tiet_bac": pit_progressive_detail(max(0, taxable)),
        "net": money(net),
    }


def _gross_from_net(target_net: float, dependents: int, region: str) -> dict:
    """Binary search gross để đạt net mong muốn."""
    lo, hi = target_net, target_net * 2.5 + 50_000_000
    best = None
    for _ in range(60):
        mid = (lo + hi) / 2
        res = _net_from_gross(mid, dependents, region)
        best = res
        if abs(res["net"] - target_net) < 1:
            break
        if res["net"] < target_net:
            lo = mid
        else:
            hi = mid
    assert best is not None
    best = {**best, "mode": "net_to_gross", "target_net": money(target_net)}
    return best


def calculate(
    gross: float | None = None,
    net: float | None = None,
    dependents: int = 0,
    region: str = "I",
) -> dict:
    if (gross is None) == (net is None):
        raise ValueError("Truyền đúng một trong hai: gross hoặc net")
    if gross is not None:
        return _net_from_gross(float(gross), int(dependents), region)
    return _gross_from_net(float(net), int(dependents), region)
