# Tài chính cá nhân VN — Bộ máy tính (kiểu Tháp Tài Sản)

Repo **public** chứa công cụ tính toán tài chính cá nhân cho thị trường Việt Nam:
chạy local (CLI + Excel), hoặc dùng **web app** trên trình duyệt / [GitHub Pages](https://truongdinh018.github.io/tai-chinh-ca-nhan/).

> Kết quả mang tính **tham khảo**. Không phải tư vấn pháp lý / thuế / đầu tư.

## Kiến trúc

| Lớp | Vai trò |
|-----|---------|
| `tools/` | Công thức & máy tính (Python) — dùng chung CLI và Pyodide |
| `web/` | Animal Island UI — dữ liệu **IndexedDB** trên trình duyệt, không login |
| `server/` | (Tuỳ chọn) FastAPI + SQLCipher local — **không** đồng bộ với IndexedDB |
| `data/private/` | Data thật / vault DB CLI (**không commit**) |
| `data/samples/` | Input mẫu an toàn để demo |
| `output/` / `excel/` | File Excel kết quả |
| `AGENTS.md` | Hướng dẫn cho AI agent |

Chi tiết web: [`docs/SETUP_VAULT.md`](docs/SETUP_VAULT.md)  
Catalog tool: [`docs/CATALOG.md`](docs/CATALOG.md) · Đối chiếu Tháp: [`docs/DOI_CHIEU_THAP.md`](docs/DOI_CHIEU_THAP.md)

**Vị trí local:** `odoo17/tai-chinh-ca-nhan/` (repo Git riêng).

## Danh mục công cụ (22)

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

## Web app (không login)

UI Animal Island + JSON trong **IndexedDB** (mỗi máy / trình duyệt).
Tools chạy bằng **Pyodide** (cùng `tools/*.py`).
Tuỳ chọn: import Google Sheet public + ghi lại qua Apps Script webhook.

```bash
./scripts/run_web.sh      # http://127.0.0.1:5174
```

**Live:** https://truongdinh018.github.io/tai-chinh-ca-nhan/

Deploy: workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) (push `web/` / `tools/` lên `main`), hoặc build local rồi push nhánh `gh-pages`.

Server SQLCipher (tuỳ chọn, offline riêng):

```bash
./scripts/run_server.sh   # http://127.0.0.1:8787
```

## Cài đặt

```bash
cd tai-chinh-ca-nhan
# Khuyến nghị dùng uv:
uv venv .venv --python 3.12 && source .venv/bin/activate && uv pip install -r requirements.txt
cd web && npm install && cd ..
```

## Chạy nhanh (CLI)

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

## Data thật (CLI / AI)

1. Copy mẫu:
   ```bash
   mkdir -p data/private
   cp data/samples/assets.csv data/private/
   ```
2. Sửa số liệu trong `data/private/` (đã gitignore).
3. Trong Cursor: *“Đọc AGENTS.md, chạy tool X với data private, cập nhật Excel.”*

Web app giữ data trên IndexedDB / Google Sheet của bạn — xem [`docs/SETUP_VAULT.md`](docs/SETUP_VAULT.md).

## Bảo mật

- Code **public**; số liệu cá nhân **không** đưa lên Git.
- Không commit sao kê, CCCD, mật khẩu, `finance.db`, `vault.salt`.
- `data/private/` và `output/` đã trong `.gitignore`.
- Vault SQLCipher (nếu dùng `server/`): **mất password ≈ mất dữ liệu mã hóa**.

## Giả định thuế 2026

Xem `tools/tax_vn_2026.py`:
- Giảm trừ bản thân 15,5tr/tháng; phụ thuộc 6,2tr/tháng
- Biểu 5 bậc: 5% / 10% / 20% / 30% / 35%
- BHXH 8% + BHYT 1,5% + BHTN 1% (có trần)

Cập nhật file này khi luật đổi.
