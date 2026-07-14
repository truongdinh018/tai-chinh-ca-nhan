"""Thuế TNCN & bảo hiểm bắt buộc VN — giả định luật áp dụng từ 01/01/2026.

Nguồn tham khảo công khai (giảm trừ & 5 bậc). Cập nhật `ASSUMPTIONS` nếu luật đổi.
"""

from __future__ import annotations

from dataclasses import dataclass

ASSUMPTIONS = {
    "personal_deduction_month": 15_500_000,
    "dependent_deduction_month": 6_200_000,
    "bhxh_rate": 0.08,
    "bhyt_rate": 0.015,
    "bhtn_rate": 0.01,
    "bhxh_bhyt_cap_base": 46_800_000,  # 20 × lương cơ sở (cập nhật theo quy định)
    # BHTN cap phụ thuộc lương tối thiểu vùng — đơn giản hóa theo region multiplier
}

# (upper_bound inclusive for bracket end, rate, quick_formula_offset)
# Thuế = TNTT * rate - offset  (công thức rút gọn từng phần)
BRACKETS_2026 = [
    (10_000_000, 0.05, 0),
    (30_000_000, 0.10, 500_000),
    (60_000_000, 0.20, 3_500_000),
    (100_000_000, 0.30, 9_500_000),
    (float("inf"), 0.35, 14_500_000),
]


@dataclass(frozen=True)
class RegionCap:
    name: str
    bhtn_max_base: float


REGIONS = {
    "I": RegionCap("Vùng I", 104_400_000),  # ~20 × LTT vùng I (ước lượng — chỉnh trong config)
    "II": RegionCap("Vùng II", 93_200_000),
    "III": RegionCap("Vùng III", 81_600_000),
    "IV": RegionCap("Vùng IV", 73_000_000),
}


def insurance_employee(
    salary_for_insurance: float,
    region: str = "I",
) -> dict[str, float]:
    """Khấu trừ bảo hiểm phía người lao động (10.5%)."""
    region = region.upper()
    caps = REGIONS.get(region, REGIONS["I"])
    base_bhxh = min(salary_for_insurance, ASSUMPTIONS["bhxh_bhyt_cap_base"])
    base_bhtn = min(salary_for_insurance, caps.bhtn_max_base)
    bhxh = base_bhxh * ASSUMPTIONS["bhxh_rate"]
    bhyt = base_bhxh * ASSUMPTIONS["bhyt_rate"]
    bhtn = base_bhtn * ASSUMPTIONS["bhtn_rate"]
    total = bhxh + bhyt + bhtn
    return {
        "bhxh": round(bhxh),
        "bhyt": round(bhyt),
        "bhtn": round(bhtn),
        "total": round(total),
        "base_bhxh_bhyt": base_bhxh,
        "base_bhtn": base_bhtn,
    }


def pit_from_taxable(taxable_income: float) -> float:
    """Thuế TNCN tháng từ thu nhập tính thuế (sau giảm trừ)."""
    if taxable_income <= 0:
        return 0.0
    for upper, rate, offset in BRACKETS_2026:
        if taxable_income <= upper:
            return max(0.0, taxable_income * rate - offset)
    return 0.0


def pit_progressive_detail(taxable_income: float) -> list[dict]:
    """Chi tiết thuế từng bậc (để minh bạch)."""
    if taxable_income <= 0:
        return []
    edges = [0, 10_000_000, 30_000_000, 60_000_000, 100_000_000, float("inf")]
    rates = [0.05, 0.10, 0.20, 0.30, 0.35]
    rows = []
    remaining = taxable_income
    prev = 0.0
    for i, rate in enumerate(rates):
        width = edges[i + 1] - prev
        chunk = min(remaining, width)
        if chunk <= 0:
            break
        tax = chunk * rate
        rows.append(
            {
                "bac": i + 1,
                "phan_tntt": round(chunk),
                "thue_suat": rate,
                "thue": round(tax),
            }
        )
        remaining -= chunk
        prev = edges[i + 1]
        if remaining <= 0:
            break
    return rows


def format_vnd(value: float) -> str:
    return f"{int(round(value)):,} ₫".replace(",", ".")
