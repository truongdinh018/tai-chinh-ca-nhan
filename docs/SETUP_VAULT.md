# Trình duyệt mở — không login, không SQLite

## Model

- UI: Vite + React + `animal-island-ui`
- Dữ liệu: **JSON trong IndexedDB** (mỗi trình duyệt / máy người dùng)
- **Không mật khẩu, không SQLCipher/sql.js**
- Công cụ: **Pyodide** chạy `tools/*.py` trên trình duyệt
- Đồng bộ tuỳ chọn: **Google Sheet public** (import) + **Apps Script webhook** (ghi lại)

Phù hợp GitHub Pages (hosting tĩnh). Không cần server.

> CLI Python / FastAPI SQLCipher dưới `server/` là tùy chọn offline riêng — không đồng bộ với IndexedDB.

## Chạy local

```bash
cd tai-chinh-ca-nhan/web
npm install
npm run dev
# http://127.0.0.1:5174
```

Hoặc: `./scripts/run_web.sh`

## Tab Đồng bộ

### Import sheet công khai

1. Google Sheet → Share → **Anyone with the link (Viewer)**
2. Nên có các tab: `assets`, `transactions`, `salary`, `debts` (header tiếng Anh như CSV mẫu)
3. Dán link vào app → **Import từ link**
4. Nếu trình duyệt chặn CORS: **File → Download → CSV** rồi Upload CSV trong app

### Ghi kết quả / đẩy dữ liệu lên Sheet

1. Mở spreadsheet → Extensions → Apps Script
2. Dán mã từ tab **Đồng bộ** (nút *Xem mã Apps Script*)
3. Deploy → **Web app** → Execute as *Me* → Who has access *Anyone*
4. Copy URL `…/exec` vào app → **Lưu** → **Test webhook**
5. **Đẩy dữ liệu máy → Sheet** hoặc trên Máy tính nhấn **Ghi kết quả lên Google Sheet**

Tuỳ chọn: Script properties `SYNC_TOKEN` = chuỗi bí mật; điền cùng token trong app.

## Privacy

Dữ liệu mặc định chỉ nằm trên máy người dùng. Khi họ kết nối webhook, dữ liệu gửi tới Google account của họ (Apps Script).
