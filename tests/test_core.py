"""Core + smoke tests for all finance tools."""

from __future__ import annotations

import pytest

from scripts.run_tool import SAMPLES
from tools.dca import calculate as dca_calc
from tools.fire import calculate as fire_calc
from tools.luong_gross_net import calculate
from tools.registry import REGISTRY, get_tool
from tools.ty_le_no_dti import calculate as dti_calc


def test_gross_to_net_positive():
    res = calculate(gross=20_000_000, dependents=0, region="I")
    assert res["net"] < res["gross"]
    assert res["net"] > 15_000_000
    assert res["bao_hiem"]["total"] > 0


def test_gross_to_net_with_dependents():
    res = calculate(gross=20_000_000, dependents=1, region="I")
    # BH 10.5% → 2.1tr; GT 15.5 + 6.2 → taxable ~0 → net = gross - BH
    assert res["thue_tncn"] == 0
    assert res["net"] == 17_900_000


def test_net_to_gross_roundtrip():
    target = 18_000_000
    res = calculate(net=target, dependents=0, region="I")
    assert abs(res["net"] - target) < 2


def test_fire_number():
    res = fire_calc(chi_tieu_nam=240_000_000, withdrawal_rate=0.04)
    assert res["fire_number"] == 6_000_000_000


def test_dca_grows():
    res = dca_calc(so_tien_moi_thang=1_000_000, so_thang=12, loi_suat_nam=0.12)
    assert res["fv_dca"] > res["goc_dca"]


def test_dti_safe_threshold():
    res = dti_calc(thu_nhap_thang=30_000_000, tong_tra_no_thang=10_000_000)
    assert res["dti_pct"] == 33.33
    assert res["an_toan"] is True


@pytest.mark.parametrize("tool_id", sorted(REGISTRY.keys()))
def test_all_tools_sample_smoke(tool_id: str):
    """Every registered tool runs with SAMPLES and returns a dict."""
    assert tool_id in SAMPLES, f"Missing sample for {tool_id}"
    out = get_tool(tool_id)(**SAMPLES[tool_id])
    assert isinstance(out, dict)
    assert len(out) > 0
