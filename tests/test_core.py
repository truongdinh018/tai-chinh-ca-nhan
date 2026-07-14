from tools.luong_gross_net import calculate
from tools.fire import calculate as fire_calc
from tools.dca import calculate as dca_calc


def test_gross_to_net_positive():
    res = calculate(gross=20_000_000, dependents=0, region="I")
    assert res["net"] < res["gross"]
    assert res["net"] > 15_000_000
    assert res["bao_hiem"]["total"] > 0


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
