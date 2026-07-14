#!/usr/bin/env python3
"""CLI: chạy từng công cụ tài chính."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tools.common import dumps
from tools.registry import REGISTRY, get_tool


SAMPLES = {
    "luong_gross_net": {"gross": 20_000_000, "dependents": 1, "region": "I"},
    "quyet_toan_tncn": {
        "tong_thu_nhap_nam": 240_000_000,
        "bao_hiem_nam": 25_200_000,
        "so_nguoi_phu_thuoc": 1,
        "thue_da_khau_tru": 8_000_000,
    },
    "bao_hiem_that_nghiep": {"luong_binh_quan_6_thang": 15_000_000, "so_thang_dong_bhtn": 36},
    "bao_hiem_huu_tri": {
        "luong_binh_quan_dong": 15_000_000,
        "so_nam_dong": 20,
        "dong_tu_nguyen_thang": 2_000_000,
    },
    "gia_vang_loi_lo": {"so_luong": 2, "don_vi": "luong", "gia_mua": 90_000_000, "gia_hien_tai": 95_000_000},
    "dca": {"so_tien_moi_thang": 5_000_000, "so_thang": 120, "loi_suat_nam": 0.10},
    "quy_du_phong": {"chi_tieu_thang": 15_000_000, "so_thang_muc_tieu": 6, "so_tien_hien_co": 40_000_000, "tiet_kiem_moi_thang": 5_000_000},
    "ty_gia": {"so_tien": 1000, "ty_gia": 25500, "currency": "USD"},
    "so_sanh_dau_tu_vs_tiet_kiem": {"von": 100_000_000, "so_nam": 10},
    "tiet_kiem_vs_lam_phat": {"von": 100_000_000, "so_nam": 10},
    "diem_suc_khoe": {
        "thu_nhap_thang": 30_000_000,
        "chi_tieu_thang": 18_000_000,
        "quy_du_phong": 90_000_000,
        "tong_no": 200_000_000,
        "tra_no_thang": 8_000_000,
        "tai_san_dau_tu": 300_000_000,
        "co_bao_hiem": True,
    },
    "rui_ro_tai_chinh": {
        "thu_nhap_thang": 30_000_000,
        "chi_tieu_thang": 22_000_000,
        "quy_du_phong": 20_000_000,
        "ty_trong_tai_san_rui_ro": 0.6,
    },
    "fire": {"chi_tieu_nam": 240_000_000, "tai_san_hien_tai": 800_000_000, "tiet_kiem_nam": 120_000_000},
    "barista_fire": {"chi_tieu_nam": 240_000_000, "thu_nhap_part_time_nam": 120_000_000, "tai_san_hien_tai": 500_000_000},
    "mua_vs_thue_nha": {
        "gia_nha": 3_000_000_000,
        "von_tu_co": 900_000_000,
        "lai_vay_nam": 0.09,
        "so_nam_vay": 20,
        "thue_thang": 15_000_000,
        "so_nam_so_sanh": 10,
    },
    "ty_le_no_dti": {"thu_nhap_thang": 30_000_000, "tong_tra_no_thang": 10_000_000},
    "snowball_avalanche": {
        "debts": [
            {"name": "the", "balance": 30_000_000, "apr": 0.25, "min_payment": 2_000_000},
            {"name": "vay_xe", "balance": 80_000_000, "apr": 0.12, "min_payment": 3_000_000},
        ],
        "extra_payment": 2_000_000,
    },
    "vay_mua_xe": {
        "gia_xe": 700_000_000,
        "tra_truoc": 200_000_000,
        "lai_vay_nam": 0.1,
        "so_thang": 48,
        "bao_hiem_nam": 8_000_000,
        "xang_thang": 3_000_000,
        "bao_duong_nam": 5_000_000,
    },
    "so_sanh_khoan_vay": {
        "loans": [
            {"name": "NH_A", "principal": 500_000_000, "apr": 0.09, "months": 60},
            {"name": "NH_B", "principal": 500_000_000, "apr": 0.095, "months": 48},
        ]
    },
    "lai_the_tin_dung": {"du_no": 20_000_000, "lai_suat_nam": 0.28, "so_thang": 12},
    "appreciation_bds": {"gia_mua": 2_000_000_000, "so_nam": 5, "ty_le_tang_nam": 0.06},
    "chi_phi_nuoi_con": {"chi_phi_thang_hien_tai": 12_000_000, "tuoi_hien_tai": 0, "tuoi_ket_thuc": 18},
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Máy tính tài chính cá nhân VN")
    parser.add_argument("tool", nargs="?", help="Tên tool")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--sample", action="store_true", help="Chạy với input mẫu")
    parser.add_argument("--json", dest="json_args", help="Input JSON object")
    parser.add_argument("--gross", type=float)
    parser.add_argument("--net", type=float)
    parser.add_argument("--dependents", type=int, default=0)
    parser.add_argument("--region", default="I")
    args = parser.parse_args()

    if args.list or not args.tool:
        for key, meta in REGISTRY.items():
            print(f"{key:30} [{meta['status']:4}] {meta['title']}")
        return

    fn = get_tool(args.tool)
    if args.json_args:
        payload = json.loads(args.json_args)
    elif args.sample:
        payload = SAMPLES[args.tool]
    elif args.tool == "luong_gross_net":
        payload = {"gross": args.gross, "net": args.net, "dependents": args.dependents, "region": args.region}
        payload = {k: v for k, v in payload.items() if v is not None}
    else:
        raise SystemExit("Cần --sample hoặc --json '{...}'")

    print(dumps(fn(**payload)))


if __name__ == "__main__":
    main()
