<!-- markdownlint-disable MD013 MD033 MD036 MD041 MD045 -->

<div align="center">

<img src="https://img.shields.io/badge/-💰_Tài_chính_cá_nhân_VN-0F766E?style=for-the-badge&labelColor=000000" alt="Tài chính cá nhân VN" />

### **Bộ máy tính tài chính cá nhân cho Việt Nam**

**22 tools · CLI + Excel · Web (Pyodide) · GitHub Pages**

<p>
  <a href="https://www.python.org"><img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" /></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" /></a>
  <a href="https://pyodide.org"><img src="https://img.shields.io/badge/Pyodide-in_browser-FFD43B?style=flat-square&logo=python&logoColor=black" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-optional-009688?style=flat-square&logo=fastapi&logoColor=white" /></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Market-Việt_Nam-success?style=flat-square" />
  <img src="https://img.shields.io/badge/TNCN-5_bậc_2026-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Data-IndexedDB_/_private-yellow?style=flat-square" />
  <a href="https://truongdinh018.github.io/tai-chinh-ca-nhan/"><img src="https://img.shields.io/badge/GitHub_Pages-live-222?style=flat-square&logo=github&logoColor=white" /></a>
  <img src="https://img.shields.io/badge/License-Personal_use-lightgrey?style=flat-square" />
</p>

<p>
  <a href="https://truongdinh018.github.io/tai-chinh-ca-nhan/"><strong>🌐 Live app</strong></a> ·
  <a href="docs/CATALOG.md"><strong>📘 Catalog</strong></a> ·
  <a href="docs/DOI_CHIEU_THAP.md"><strong>🗺️ Đối chiếu Tháp</strong></a> ·
  <a href="docs/SETUP_VAULT.md"><strong>🗄️ Setup web</strong></a> ·
  <a href="AGENTS.md"><strong>🤖 AGENTS.md</strong></a>
</p>

</div>

---

> Kết quả mang tính **tham khảo**. Không phải tư vấn pháp lý / thuế / đầu tư.

---

## 📊 Suite at a glance

<table>
<tr>
<td width="50%">

### 🎯 Mission
Bộ máy tính phong cách **Tháp Tài Sản** cho thị trường VN — chạy local trên data của bạn (Cursor/Claude + Excel), hoặc trên trình duyệt qua **Animal Island UI** + Pyodide.

### 🏗️ How
- **`tools/`** — công thức Python dùng chung CLI và web
- **`web/`** — Vite + React, data **IndexedDB**, không login
- **`server/`** — FastAPI + SQLCipher (tuỳ chọn, offline riêng)
- **`scripts/`** — CLI runner + export Excel

</td>
<td width="50%">

### 📈 Numbers

| | |
|--:|:--|
| **22** | Máy tính cá nhân |
| **6** | Nhóm chức năng |
| **3** | Surface: CLI · Web · Excel |
| **1** | Biểu thuế TNCN 2026 dùng chung |
| **0** | Login bắt buộc trên Pages |
| **∞** | Data thật chỉ nằm máy bạn |

</td>
</tr>
</table>

---

## 🧭 Quick navigation

| | Document | What it covers | Read time |
|---|---|---|---|
| 🌐 | **[Live app](https://truongdinh018.github.io/tai-chinh-ca-nhan/)** | Web animal-island + máy tính Pyodide | — |
| 📘 | **[CATALOG.md](docs/CATALOG.md)** | Input / output / ghi chú từng tool | ~5 min |
| 🗺️ | **[DOI_CHIEU_THAP.md](docs/DOI_CHIEU_THAP.md)** | Map tool ↔ thaptaisan.com/cong-cu | ~5 min |
| 🗄️ | **[SETUP_VAULT.md](docs/SETUP_VAULT.md)** | IndexedDB, Google Sheet sync, privacy | ~5 min |
| 🤖 | **[AGENTS.md](AGENTS.md)** | Hướng dẫn AI agent (Cursor/Claude) | ~3 min |
| 🧾 | **[tax_vn_2026.py](tools/tax_vn_2026.py)** | Giảm trừ + biểu 5 bậc + trần BH | ~2 min |

---

## 🏗️ Architecture at a glance

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Surfaces                                                                │
│  🖥️  CLI (scripts/run_tool.py)   📊 Excel export   🌐 Web (Vite+React)  │
├──────────────────────────────────────────────────────────────────────────┤
│                         tools/*.py  (calculate → dict)                   │
│                         registry.py · tax_vn_2026.py                     │
│                    ▲                              ▲                      │
│                    │                              │                      │
│              CPython local                 Pyodide in browser            │
├────────────────────┼──────────────────────────────┼──────────────────────┤
│  data/private/     │                              │  IndexedDB (JSON)    │
│  data/samples/     │                              │  optional Google     │
│  (gitignored)      │                              │  Sheet webhook       │
└────────────────────┴──────────────────────────────┴──────────────────────┘
                                    │
                                    ▼ (optional, offline riêng)
                ┌──────────────────────────────────────────────┐
                │  🔐  server/ FastAPI + SQLCipher             │
                │  Không đồng bộ với IndexedDB web app         │
                └──────────────────────────────────────────────┘
```

**Vì sao IndexedDB trên Pages?** Hosting tĩnh, không password, không server. Data mặc định chỉ trên máy user; Sheet sync là tuỳ chọn. SQLCipher dưới `server/` dành cho vault CLI/local.

---

## 📦 Danh mục 22 công cụ

<table>
<tr>
<th align="center">💼<br/>Lương · BH · Thuế</th>
<th align="center">📈<br/>Đầu tư · Tiết kiệm</th>
<th align="center">🛡️<br/>Bảo vệ · Rủi ro</th>
<th align="center">🔥<br/>FIRE</th>
</tr>
<tr>
<td valign="top">

`luong_gross_net`<br/>
`quyet_toan_tncn`<br/>
`bao_hiem_that_nghiep`<br/>
`bao_hiem_huu_tri`

</td>
<td valign="top">

`gia_vang_loi_lo`<br/>
`dca`<br/>
`quy_du_phong`<br/>
`ty_gia`<br/>
`so_sanh_dau_tu_vs_tiet_kiem`<br/>
`tiet_kiem_vs_lam_phat`

</td>
<td valign="top">

`diem_suc_khoe`<br/>
`rui_ro_tai_chinh`

</td>
<td valign="top">

`fire`<br/>
`barista_fire`

</td>
</tr>
<tr>
<th align="center">🏠<br/>Vay · Nhà · Xe</th>
<th align="center">👨‍👩‍👧<br/>Gia đình</th>
<th align="center" colspan="2">📎 Chi tiết</th>
</tr>
<tr>
<td valign="top">

`mua_vs_thue_nha`<br/>
`ty_le_no_dti`<br/>
`snowball_avalanche`<br/>
`vay_mua_xe`<br/>
`so_sanh_khoan_vay`<br/>
`lai_the_tin_dung`<br/>
`appreciation_bds`

</td>
<td valign="top">

`chi_phi_nuoi_con`

</td>
<td valign="top" colspan="2">

📋 Spec từng tool: [`docs/CATALOG.md`](docs/CATALOG.md)<br/>
🗺️ Map Tháp Tài Sản: [`docs/DOI_CHIEU_THAP.md`](docs/DOI_CHIEU_THAP.md)

</td>
</tr>
</table>

---

## 🧰 Repository layout

```
tai-chinh-ca-nhan/
│
├── 🧮 tools/                     # Máy tính Python (22 + tax helpers)
│   ├── registry.py               #   Đăng ký tool cho CLI + web
│   ├── tax_vn_2026.py            #   Giả định TNCN / BH 2026
│   └── <tool_id>.py              #   calculate(**kwargs) -> dict
│
├── 🌐 web/                       # Animal Island UI (Vite + React)
│   ├── src/                      #   IndexedDB store · Pyodide runner
│   └── public/py/tools/          #   Bản sync từ tools/ (Pages)
│
├── 🔐 server/                    # FastAPI + SQLCipher (tuỳ chọn)
├── 🛠️ scripts/                   # run_tool · export_excel · run_web
├── 📁 data/
│   ├── samples/                  #   CSV mẫu (commit được)
│   └── private/                  #   Data thật (gitignored)
├── 📊 excel/ · output/           # Template + kết quả Excel
├── 📚 docs/                      # CATALOG · SETUP_VAULT · DOI_CHIEU_THAP
├── 🧪 tests/                     # pytest
└── 🤖 AGENTS.md                  # Hướng dẫn cho AI agent
```

---

## 🛠️ Build · 🏃 Run · 🚢 Deploy

### Cài đặt

```bash
cd tai-chinh-ca-nhan
uv venv .venv --python 3.12 && source .venv/bin/activate
uv pip install -r requirements.txt
cd web && npm install && cd ..
```

### Web (dev)

```bash
./scripts/run_web.sh          # http://127.0.0.1:5174
```

### CLI

```bash
python scripts/run_tool.py --list
python scripts/run_tool.py luong_gross_net --gross 20000000 --dependents 1
python scripts/run_tool.py fire --sample
python scripts/run_tool.py dca --json '{"so_tien_moi_thang":5000000,"so_thang":60,"loi_suat_nam":0.1}'
python scripts/export_excel.py
```

### Vault SQLCipher (tuỳ chọn)

```bash
./scripts/run_server.sh       # http://127.0.0.1:8787
```

### Excel outputs

| File | Mô tả |
|---|---|
| `excel/ket_qua_template.xlsx` | Workbook mẫu (commit được) |
| `output/ket_qua_latest.xlsx` | Lần chạy mới nhất (gitignored) |
| `output/ket_qua_YYYYMMDD_HHMMSS.xlsx` | Bản có timestamp |

### Deploy

| Path | How |
|---|---|
| 🟢 **GitHub Pages** | Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) trên push `web/` / `tools/` |
| 🟡 **Fallback** | Build local rồi push nhánh `gh-pages` |
| 🌐 **Live** | https://truongdinh018.github.io/tai-chinh-ca-nhan/ |

---

## 🔐 Privacy · 🧾 Thuế 2026 · 🤖 Agent

<table>
<tr>
<td width="33%" valign="top">

### 🔐 Privacy
- Code **public**; số liệu cá nhân **không** commit
- `data/private/` + `output/` đã gitignore
- Web: data trong **IndexedDB** trên máy bạn
- Sheet webhook chỉ gửi tới Google account bạn cấu hình
- SQLCipher vault: **mất password ≈ mất data**
- Không commit sao kê / CCCD / `finance.db` / `vault.salt`

</td>
<td width="33%" valign="top">

### 🧾 Thuế TNCN 2026
Xem [`tools/tax_vn_2026.py`](tools/tax_vn_2026.py):
- GTGC bản thân **15,5tr**/tháng
- Phụ thuộc **6,2tr**/tháng
- Biểu **5 bậc**: 5 / 10 / 20 / 30 / 35%
- BHXH 8% + BHYT 1,5% + BHTN 1% (có trần)

Cập nhật file này khi luật đổi.

</td>
<td width="33%" valign="top">

### 🤖 Agent workflow
1. Đọc [`AGENTS.md`](AGENTS.md) + catalog
2. Copy sample → `data/private/`
3. Prompt: *chạy tool X với data private, cập nhật Excel*
4. Không commit `data/private/` hay `output/`
5. Đơn vị tiền mặc định: **VND**

</td>
</tr>
</table>

---

## 🗄️ Data thật (CLI)

```bash
mkdir -p data/private
cp data/samples/assets.csv data/private/
# Sửa số liệu thật → chạy tool / export Excel
```

Web giữ data trên IndexedDB / Google Sheet — chi tiết [`docs/SETUP_VAULT.md`](docs/SETUP_VAULT.md).

---

## 🏃 Current status

<table>
<tr>
<td width="50%">

### ✅ Done

- 🧮 22 máy tính Python + registry
- 📊 Export Excel (template + timestamp)
- 🌐 Web Animal Island + Pyodide
- 🗄️ IndexedDB store (không login)
- 🔗 Google Sheet import / Apps Script webhook
- 📘 Docs: catalog · đối chiếu Tháp · setup vault
- 🚀 GitHub Pages live

</td>
<td width="50%">

### 🔄 Optional / next

- 🔐 Dùng `server/` SQLCipher khi cần vault offline
- 📈 Mở rộng tool theo [`DOI_CHIEU_THAP.md`](docs/DOI_CHIEU_THAP.md)
- 🧪 Tăng coverage `tests/`
- 🧾 Cập nhật `tax_vn_2026.py` khi luật đổi

</td>
</tr>
</table>

---

## 📞 Links

- 🌐 **Live:** [truongdinh018.github.io/tai-chinh-ca-nhan](https://truongdinh018.github.io/tai-chinh-ca-nhan/)
- 📦 **Repo:** [github.com/truongdinh018/tai-chinh-ca-nhan](https://github.com/truongdinh018/tai-chinh-ca-nhan)
- 🏠 **Local path:** `odoo17/tai-chinh-ca-nhan/`
- 🤖 **Agent guide:** [`AGENTS.md`](AGENTS.md)

---

<div align="center">

**Built for local-first personal finance · Cursor / Claude ready**

*Last updated: 2026-07-15*

</div>
