# Đối chiếu Tháp Tài Sản (`https://thaptaisan.com/cong-cu`)

Cập nhật: 2026-07-14

Nguồn Tháp công bố: **57+** máy tính = **12 đã ra mắt** + **6 sắp ra mắt** + **39 đang chuẩn bị**.
Trang còn SEO landing hàng loạt dưới `/cong-cu/chien-luoc-tra-no/...` (không phải tool riêng).

## 1) Tool có slug / tên công khai → repo này

| Tháp slug / tên | Tool trong repo | Ghi chú |
|-----------------|-----------------|--------|
| tinh-luong-gross-net | `luong_gross_net` | ✅ |
| quyet-toan-thue-tncn-2025 | `quyet_toan_tncn` | ✅ (ước lượng; không so UI 2025 vs 2026 chi tiết) |
| gia-vang | `gia_vang_loi_lo` | ⚠️ PnL OK — **không** realtime SJC/DOJI/PNJ |
| tinh-dau-tu-dinh-ky-dca | `dca` | ⚠️ FV giả định — **không** backtest VN-Index |
| diem-suc-khoe-tai-chinh | `diem_suc_khoe` | ✅ mô hình 8 yếu tố |
| tinh-fire-nghi-huu-som | `fire` | ✅ lean/standard/fat qua `mode` |
| so-sanh-mua-nha-vs-thue-nha | `mua_vs_thue_nha` | ✅ |
| tinh-ty-le-no-an-toan | `ty_le_no_dti` | ✅ |
| tinh-quy-du-phong | `quy_du_phong` | ✅ |
| chien-luoc-tra-no | `snowball_avalanche` | ✅ |
| tinh-tien-vay-mua-xe | `vay_mua_xe` | ✅ |
| currency-calculator | `ty_gia` | ⚠️ quy đổi — **không** fetch tỷ giá realtime |
| tinh-bao-hiem-huu-tri | `bao_hiem_huu_tri` | ✅ |
| so-sanh-dau-tu-vs-tiet-kiem | `so_sanh_dau_tu_vs_tiet_kiem` | ✅ |
| tinh-barista-fire | `barista_fire` | ✅ |
| so-sanh-cac-khoan-vay | `so_sanh_khoan_vay` | ✅ |
| danh-gia-rui-ro-tai-chinh-ca-nhan | `rui_ro_tai_chinh` | ✅ |
| tinh-chi-phi-nuoi-con | `chi_phi_nuoi_con` | ✅ |
| tinh-bao-hiem-that-nghiep | `bao_hiem_that_nghiep` | ✅ đơn giản hóa |
| tinh-lai-the-tin-dung | `lai_the_tin_dung` | ✅ |
| tinh-appreciation-depreciation-bds | `appreciation_bds` | ✅ |
| tinh-tiet-kiem-vs-lam-phat | `tiet_kiem_vs_lam_phat` | ✅ |

**Kết luận:** Đã cover **toàn bộ tool có tên/slug công khai** trên trang công cụ (= 12 live + 6 sắp + các mục đã liệt kê A–Z).

## 2) Chưa có (vì Tháp chưa public tên)

- **~39 máy tính “đang chuẩn bị”** — không có slug/tên để port.
- Mục content (không phải máy tính): FIRE là gì, DCA là gì, 50/30/20, lãi kép (blog).

## 3) Khác biệt chức năng so với Tháp live

| Tính năng Tháp | Repo |
|----------------|------|
| Giá vàng realtime 15 phút | ❌ nhập tay |
| Tỷ giá Vietcombank realtime | ❌ nhập tay |
| DCA backtest VN-Index | ❌ lợi suất cố định |
| App offline / UI web Tháp | ❌ CLI + Excel |
| ±1₫ marketing / UX | ⚠️ làm tròn VND |

Khi Tháp mở thêm tool mới: thêm module trong `tools/`, đăng ký `registry.py`, cập nhật bảng này.
