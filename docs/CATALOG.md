# Catalog thiết kế công cụ

Mỗi tool: `tools/<id>.py` → hàm `calculate(**kwargs) -> dict`, đăng ký trong `tools/registry.py`.

| ID | Tên | Input | Output | Ghi chú |
|----|-----|-------|--------|---------|
| luong_gross_net | Gross ↔ Net | gross\|net, dependents, region | net/gross, BH, thuế, chi tiết bậc | TNCN 2026 |
| quyet_toan_tncn | Quyết toán TNCN | thu nhập năm, BH, đã KT | nộp thêm / hoàn | Ước lượng |
| bao_hiem_that_nghiep | BHTN | lương BQ, tháng đóng | trợ cấp | Đơn giản hóa |
| bao_hiem_huu_tri | Hưu trí | lương BQ, quỹ TV | lương hưu + 4% | Ước lượng |
| gia_vang_loi_lo | Vàng/bạc PnL | SL, giá mua/bán | lãi/lỗ | Không API giá |
| dca | DCA vs Lump Sum | tiền/tháng, tháng, r | FV 2 chiến lược | Lợi suất cố định |
| quy_du_phong | Emergency fund | chi tiêu, đệm | thiếu / tháng | |
| ty_gia | FX | số tiền, tỷ giá | VND↔FX | Nhập tay tỷ giá |
| so_sanh_dau_tu_vs_tiet_kiem | Invest vs save | vốn, năm, lãi | FV + real | |
| tiet_kiem_vs_lam_phat | Real yield | vốn, lãi, CPI | sức mua thực | |
| diem_suc_khoe | Health score | thu nhập, nợ, đệm… | 0–100 + factors | 8 yếu tố |
| rui_ro_tai_chinh | Risk | thu nhập, rủi ro TS | risk score | |
| fire | FIRE | chi tiêu, tiết kiệm | FIRE# , năm | lean/standard/fat |
| barista_fire | Barista FIRE | chi tiêu, part-time | barista# | |
| mua_vs_thue_nha | Buy vs rent | giá, thuê, vay | NW so sánh | Đơn giản |
| ty_le_no_dti | DTI | thu nhập, trả nợ | % DTI | Ngưỡng 40% |
| snowball_avalanche | Debt payoff | debts[], extra | tháng & lãi | |
| vay_mua_xe | Car loan | giá, vay, OPEX | PMT + TCO | |
| so_sanh_khoan_vay | Compare loans | loans[] | tổng trả | |
| lai_the_tin_dung | Credit card | dư nợ, APR | tổng lãi | |
| appreciation_bds | RE appreciation | giá, CAGR | FV | |
| chi_phi_nuoi_con | Child cost | chi phí tháng | tổng 0–18 | Có lạm phát |

## Luồng Excel

```
samples/input → calculate() × N → openpyxl → excel/ket_qua_template.xlsx
                                         → output/ket_qua_*.xlsx
```

Sheet trong workbook:
- `Tong_quan` — trạng thái từng tool
- `Danh_muc_thiet_ke` — catalog
- 1 sheet / tool (flatten key-value)
- `Raw_JSON` — JSON đầy đủ

## Mapping Tháp Tài Sản

Các mục live + roadmap đã đặt tên công khai trên thaptaisan.com được port thành tool ở trên.
Giá vàng/CK **realtime** không fetch tự động (an toàn & ổn định) — bạn nhập giá thủ công hoặc bổ sung adapter riêng sau.
