# Agent instructions — Tài chính cá nhân VN

## Mục tiêu
Repo chứa bộ máy tính tài chính cá nhân (phong cách Tháp Tài Sản) + export Excel kết quả.
Data thật nằm ở `data/private/` (gitignored). Chỉ dùng `data/samples/` khi demo.

## Cách chạy
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/run_tool.py --list
python scripts/run_tool.py luong_gross_net --gross 20000000 --dependents 1
python scripts/export_excel.py --all-samples
```

## Quy tắc khi agent tính toán
1. Đọc README.md và `docs/CATALOG.md` trước khi chọn tool.
2. Không commit file trong `data/private/` hoặc `output/`.
3. Ghi kết quả ra `output/ket_qua.xlsx` qua `scripts/export_excel.py`.
4. Mọi số tiền mặc định đơn vị **VND**.
5. Thuế TNCN áp dụng biểu **5 bậc 2026** trong `tools/tax_vn_2026.py` — nêu giả định nếu luật đổi.
6. Kết quả chỉ mang tính tham khảo, không phải tư vấn pháp lý/đầu tư.

## Thêm công cụ mới
1. Tạo `tools/<ten>.py` với hàm `calculate(**kwargs) -> dict` và `cli()`.
2. Đăng ký trong `tools/registry.py`.
3. Thêm dòng vào `docs/CATALOG.md`.
4. Viết test trong `tests/`.
