# Tài chính cá nhân VN — Bộ máy tính (kiểu Tháp Tài Sản)

Repo **private** chứa các công cụ tính toán tài chính cá nhân cho thị trường Việt Nam,
để bạn (và Cursor/Claude) chạy local trên data của mình, rồi xuất kết quả ra **Excel**.

> Kết quả mang tính **tham khảo**. Không phải tư vấn pháp lý / thuế / đầu tư.

## Mục tiêu thiết kế

| Lớp | Vai trò |
|-----|---------|
| `tools/` | Công thức & máy tính (Python) |
| `data/private/` | Data thật của bạn (**không commit**) |
| `data/samples/` | Input mẫu an toàn để demo |
| `output/` / `excel/` | File Excel kết quả |
| `AGENTS.md` | Hướng dẫn cho AI agent |

## Danh mục công cụ (22)

Chi tiết thiết kế: [`docs/CATALOG.md`](docs/CATALOG.md)  
Đối chiếu Tháp Tài Sản: [`docs/DOI_CHIEU_THAP.md`](docs/DOI_CHIEU_THAP.md)

**Vị trí local:** `odoo17/tai-chinh-ca-nhan/` (repo Git riêng, private trên GitHub).

### Lương - Bảo Hiểm - Thuế
1. `luong_gross_net` — Gross ↔ Net (TNCN 5 bậc 2026)
2. `quyet_toan_tncn` — Quyết toán thuế ước lượng
3. `bao_hiem_that_nghiep` — Trợ cấp thất nghiệp (đơn giản)
4. `bao_hiem_huu_tri` — Hưu trí BHXH vs quỹ tự nguyện

### Đầu Tư - Tiết Kiệm
5. `gia_vang_loi_lo` — Lãi/lỗ vàng bạc
6. `dca` — DCA vs Lump Sum
7. `quy_du_phong` — Quỹ dự phòng
8. `ty_gia` — Quy đổi ngoại tệ (tỷ giá nhập tay)
9. `so_sanh_dau_tu_vs_tiet_kiem` — Đầu tư vs tiết kiệm
10. `tiet_kiem_vs_lam_phat` — Sức mua thực

### Bảo Vệ - Rủi Ro
11. `diem_suc_khoe` — Health score 0–100
12. `rui_ro_tai_chinh` — Risk score

### FIRE
13. `fire` — FIRE lean/standard/fat
14. `barista_fire` — Barista FIRE

### Vay - Nhà - Xe
15. `mua_vs_thue_nha` — Mua vs thuê
16. `ty_le_no_dti` — DTI
17. `snowball_avalanche` — Trả nợ
18. `vay_mua_xe` — Vay mua xe + OPEX
19. `so_sanh_khoan_vay` — So sánh khoản vay
20. `lai_the_tin_dung` — Lãi thẻ
21. `appreciation_bds` — Tăng/giảm giá BĐS

### Gia Đình
22. `chi_phi_nuoi_con` — Chi phí 0–18 tuổi

## Cài đặt

```bash
cd tai-chinh-ca-nhan
# Khuyến nghị dùng uv (nhanh):
uv venv .venv && source .venv/bin/activate && uv pip install -r requirements.txt
# hoặc: python3 -m venv .venv && pip install -r requirements.txt
```

## Chạy nhanh

```bash
# Liệt kê tool
python scripts/run_tool.py --list

# Gross → Net mẫu
python scripts/run_tool.py luong_gross_net --gross 20000000 --dependents 1

# Chạy tool với sample có sẵn
python scripts/run_tool.py fire --sample

# Input tùy chỉnh (JSON)
python scripts/run_tool.py dca --json '{"so_tien_moi_thang":5000000,"so_thang":60,"loi_suat_nam":0.1}'

# Chạy TẤT CẢ sample → Excel
python scripts/export_excel.py
```

File Excel:
- `excel/ket_qua_template.xlsx` — workbook mẫu (commit được)
- `output/ket_qua_latest.xlsx` — lần chạy mới nhất (gitignored)
- `output/ket_qua_YYYYMMDD_HHMMSS.xlsx` — bản có timestamp

## Đưa data thật vào để AI tính

1. Copy mẫu:
   ```bash
   mkdir -p data/private
   cp data/samples/assets.csv data/private/
   ```
2. Sửa số liệu thật trong `data/private/` (đã gitignore).
3. Trong Cursor: *“Đọc AGENTS.md, chạy tool X với data private, cập nhật Excel.”*

## Bảo mật

- Repo này nên để **private** trên GitHub.
- Không commit sao kê ngân hàng, CCCD, mật khẩu.
- `data/private/` và `output/` đã nằm trong `.gitignore`.

## Giả định thuế 2026

Xem `tools/tax_vn_2026.py`:
- Giảm trừ bản thân 15,5tr/tháng; phụ thuộc 6,2tr/tháng
- Biểu 5 bậc: 5% / 10% / 20% / 30% / 35%
- BHXH 8% + BHYT 1,5% + BHTN 1% (có trần)

Cập nhật file này khi luật đổi.
