/** Field schema for user-friendly tool forms (Vietnamese labels + tip text). */

export type FieldType = 'money' | 'number' | 'percent' | 'text' | 'select' | 'bool' | 'json'

export type FieldDef = {
  key: string
  label: string
  type: FieldType
  /** Shown in island tooltip next to the label */
  help?: string
  options?: { value: string; label: string }[]
  optional?: boolean
}

const regionOpts = [
  { value: 'I', label: 'Vùng I' },
  { value: 'II', label: 'Vùng II' },
  { value: 'III', label: 'Vùng III' },
  { value: 'IV', label: 'Vùng IV' },
]

export const TOOL_FIELDS: Record<string, FieldDef[]> = {
  luong_gross_net: [
    {
      key: 'gross',
      label: 'Lương gross (VND/tháng)',
      type: 'money',
      optional: true,
      help: 'Lương trước khi trừ BHXH/BHYT/BHTN và thuế TNCN. Chỉ cần gross HOẶC net.',
    },
    {
      key: 'net',
      label: 'Lương net mong muốn (VND)',
      type: 'money',
      optional: true,
      help: 'Số thực nhận. Nếu điền net, hệ thống dò ngược gross phù hợp.',
    },
    {
      key: 'dependents',
      label: 'Số người phụ thuộc',
      type: 'number',
      help: 'Mỗi người phụ thuộc hợp lệ làm tăng giảm trừ thuế TNCN hàng tháng.',
    },
    {
      key: 'region',
      label: 'Vùng lương tối thiểu',
      type: 'select',
      options: regionOpts,
      help: 'Ảnh hưởng trần đóng BHTN theo vùng lương tối thiểu (I–IV).',
    },
  ],
  quyet_toan_tncn: [
    {
      key: 'tong_thu_nhap_nam',
      label: 'Tổng thu nhập năm (VND)',
      type: 'money',
      help: 'Tổng thu nhập chịu thuế cả năm (ước/tính từ chứng từ).',
    },
    {
      key: 'bao_hiem_nam',
      label: 'Bảo hiểm đã đóng trong năm (VND)',
      type: 'money',
      help: 'BHXH/BHYT/BHTN (và BH hợp lệ khác) đã đóng trong năm để trừ khi quyết toán.',
    },
    {
      key: 'so_nguoi_phu_thuoc',
      label: 'Số người phụ thuộc',
      type: 'number',
      help: 'Số người phụ thuộc khai trong năm → nhân với mức giảm trừ phụ thuộc.',
    },
    {
      key: 'thue_da_khau_tru',
      label: 'Thuế TNCN đã khấu trừ (VND)',
      type: 'money',
      help: 'Thuế đã bị công ty/ tổ chức khấu trừ tại nguồn — dùng để so với thuế phải nộp.',
    },
    {
      key: 'giam_tru_khac',
      label: 'Giảm trừ khác (VND)',
      type: 'money',
      optional: true,
      help: 'Từ thiện, đóng góp hưu trí tự nguyện… nếu được luật cho phép (tuỳ năm).',
    },
  ],
  bao_hiem_that_nghiep: [
    {
      key: 'luong_binh_quan_6_thang',
      label: 'Lương bình quân 6 tháng (VND)',
      type: 'money',
      help: 'Bình quân tiền lương đóng BHTN 6 tháng liền kề trước khi nghỉ việc.',
    },
    {
      key: 'so_thang_dong_bhtn',
      label: 'Số tháng đã đóng BHTN',
      type: 'number',
      help: 'Thời gian đóng càng lâu thì số tháng được hưởng càng nhiều (có trần).',
    },
  ],
  bao_hiem_huu_tri: [
    {
      key: 'luong_binh_quan_dong',
      label: 'Lương bình quân đóng BHXH (VND)',
      type: 'money',
      help: 'Cơ sở tính lương hưu ước lượng theo công thức rút gọn của công cụ.',
    },
    {
      key: 'so_nam_dong',
      label: 'Số năm đóng BHXH',
      type: 'number',
      help: 'Số năm đóng càng cao thì tỷ lệ hưởng lương hưu càng tăng.',
    },
    {
      key: 'dong_tu_nguyen_thang',
      label: 'Đóng quỹ tự nguyện / tháng (VND)',
      type: 'money',
      help: 'Phần đóng thêm tự nguyện (nếu có) — chỉ mang tính ước lượng trong model.',
    },
  ],
  gia_vang_loi_lo: [
    { key: 'so_luong', label: 'Số lượng', type: 'number', help: 'Số đơn vị đang nắm (lượng, chỉ…).' },
    { key: 'don_vi', label: 'Đơn vị', type: 'text', help: 'vd: luong, chi — chỉ để ghi chú hiển thị.' },
    { key: 'gia_mua', label: 'Giá mua / đơn vị (VND)', type: 'money', help: 'Giá vốn trung bình khi mua.' },
    {
      key: 'gia_hien_tai',
      label: 'Giá hiện tại / đơn vị (VND)',
      type: 'money',
      help: 'Giá thị trường bạn muốn so sánh (tự nhập, không lấy live).',
    },
  ],
  dca: [
    {
      key: 'so_tien_moi_thang',
      label: 'Số tiền mỗi tháng (VND)',
      type: 'money',
      help: 'Số tiền cố định góp định kỳ mỗi tháng.',
    },
    { key: 'so_thang', label: 'Số tháng', type: 'number', help: 'Thời gian duy trì kế hoạch DCA.' },
    {
      key: 'loi_suat_nam',
      label: 'Lợi suất kỳ vọng / năm',
      type: 'percent',
      help: 'Nhập dạng thập phân: 0.1 = 10%/năm. Đây là giả định, không phải cam kết.',
    },
  ],
  quy_du_phong: [
    {
      key: 'chi_tieu_thang',
      label: 'Chi tiêu hàng tháng (VND)',
      type: 'money',
      help: 'Chi tiêu thiết yếu trung bình/tháng — dùng làm đơn vị tính quỹ dự phòng.',
    },
    {
      key: 'so_thang_muc_tieu',
      label: 'Số tháng mục tiêu',
      type: 'number',
      help: 'Thường 3–6 tháng chi tiêu. Càng cao càng an toàn nhưng chậm tích lũy hơn.',
    },
    {
      key: 'so_tien_hien_co',
      label: 'Quỹ hiện có (VND)',
      type: 'money',
      help: 'Tiền mặt / tiết kiệm dễ rút dành riêng cho quỹ khẩn cấp.',
    },
    {
      key: 'tiet_kiem_moi_thang',
      label: 'Tiết kiệm thêm / tháng (VND)',
      type: 'money',
      help: 'Số có thể dành thêm mỗi tháng để lấp khoảng trống quỹ.',
    },
  ],
  ty_gia: [
    { key: 'so_tien', label: 'Số tiền ngoại tệ', type: 'number', help: 'Số lượng ngoại tệ cần quy đổi.' },
    {
      key: 'ty_gia',
      label: 'Tỷ giá (VND / 1 đơn vị)',
      type: 'money',
      help: 'Bạn tự nhập tỷ giá (không lấy giá live từ ngân hàng).',
    },
    { key: 'currency', label: 'Mã tiền tệ', type: 'text', help: 'vd: USD, EUR, JPY — chỉ để ghi chú.' },
  ],
  so_sanh_dau_tu_vs_tiet_kiem: [
    { key: 'von', label: 'Vốn ban đầu (VND)', type: 'money', help: 'Số tiền khởi điểm để so hai kịch bản.' },
    {
      key: 'so_nam',
      label: 'Số năm',
      type: 'number',
      help: 'Kỳ vọng nắm giữ. Model dùng lợi suất giả định cố định.',
    },
  ],
  tiet_kiem_vs_lam_phat: [
    { key: 'von', label: 'Vốn ban đầu (VND)', type: 'money', help: 'Số tiền hiện có trên sổ / ví.' },
    {
      key: 'so_nam',
      label: 'Số năm',
      type: 'number',
      help: 'Khoảng thời gian ước sức mua thực sau lạm phát.',
    },
  ],
  diem_suc_khoe: [
    { key: 'thu_nhap_thang', label: 'Thu nhập / tháng', type: 'money', help: 'Thu nhập ròng/tháng sau thuế nếu có.' },
    { key: 'chi_tieu_thang', label: 'Chi tiêu / tháng', type: 'money', help: 'Tổng chi tiêu trung bình hàng tháng.' },
    {
      key: 'quy_du_phong',
      label: 'Quỹ dự phòng',
      type: 'money',
      help: 'Tiền dễ rút để sống nếu mất thu nhập tạm thời.',
    },
    { key: 'tong_no', label: 'Tổng nợ', type: 'money', help: 'Tổng dư nợ còn lại (vay, thẻ…).' },
    {
      key: 'tra_no_thang',
      label: 'Trả nợ / tháng',
      type: 'money',
      help: 'Tổng nghĩa vụ trả nợ tối thiểu mỗi tháng.',
    },
    {
      key: 'tai_san_dau_tu',
      label: 'Tài sản đầu tư',
      type: 'money',
      help: 'Chứng khoán, quỹ, vàng… không kể nhà ở chính nếu muốn tách.',
    },
    {
      key: 'co_bao_hiem',
      label: 'Có bảo hiểm sức khỏe/nhân thọ',
      type: 'bool',
      help: 'Có lớp bảo vệ rủi ro giúp điểm sức khỏe cao hơn.',
    },
  ],
  rui_ro_tai_chinh: [
    { key: 'thu_nhap_thang', label: 'Thu nhập / tháng', type: 'money', help: 'Thu nhập ổn định hàng tháng.' },
    { key: 'chi_tieu_thang', label: 'Chi tiêu / tháng', type: 'money', help: 'Chi tiêu càng sát thu nhập thì rủi ro thanh khoản càng cao.' },
    {
      key: 'quy_du_phong',
      label: 'Quỹ dự phòng',
      type: 'money',
      help: 'Đệm thanh khoản — thiếu quỹ làm tăng mức rủi ro.',
    },
    {
      key: 'ty_trong_tai_san_rui_ro',
      label: 'Tỷ trọng tài sản rủi ro',
      type: 'percent',
      help: '0.6 = 60% tài sản biến động (cổ phiếu, crypto…).',
    },
  ],
  fire: [
    {
      key: 'chi_tieu_nam',
      label: 'Chi tiêu năm (VND)',
      type: 'money',
      help: 'Mức sống mục tiêu khi nghỉ sớm — quyết định số FIRE cần có.',
    },
    {
      key: 'tai_san_hien_tai',
      label: 'Tài sản hiện tại (VND)',
      type: 'money',
      optional: true,
      help: 'Tổng tài sản đầu tư/lỏng hiện có (tuỳ chọn).',
    },
    {
      key: 'tiet_kiem_nam',
      label: 'Tiết kiệm / năm (VND)',
      type: 'money',
      optional: true,
      help: 'Số dư tiết kiệm đầu tư thêm mỗi năm — dùng ước số năm tới FIRE.',
    },
    {
      key: 'withdrawal_rate',
      label: 'Tỷ lệ rút (4% rule)',
      type: 'percent',
      optional: true,
      help: 'Mặc định 0.04 (4%). Thấp hơn → số tiền cần lớn hơn nhưng an toàn hơn.',
    },
  ],
  barista_fire: [
    {
      key: 'chi_tieu_nam',
      label: 'Chi tiêu năm',
      type: 'money',
      help: 'Chi tiêu mục tiêu cả năm khi bán thời gian / part-time.',
    },
    {
      key: 'thu_nhap_part_time_nam',
      label: 'Thu nhập part-time / năm',
      type: 'money',
      help: 'Thu nhập từ công việc nhẹ vẫn giữ sau khi “FIRE một phần”.',
    },
    {
      key: 'tai_san_hien_tai',
      label: 'Tài sản hiện tại',
      type: 'money',
      help: 'Tài sản đầu tư hiện có để so với số Barista FIRE.',
    },
  ],
  mua_vs_thue_nha: [
    { key: 'gia_nha', label: 'Giá nhà', type: 'money', help: 'Giá mua ước tính (đã gồm phí cơ bản nếu muốn).' },
    { key: 'von_tu_co', label: 'Vốn tự có', type: 'money', help: 'Số tiền trả trước / không vay.' },
    {
      key: 'lai_vay_nam',
      label: 'Lãi vay / năm',
      type: 'percent',
      help: 'Lãi suất vay mua nhà kỳ vọng (vd 0.09 = 9%/năm).',
    },
    { key: 'so_nam_vay', label: 'Số năm vay', type: 'number', help: 'Thời hạn vay thế chấp.' },
    {
      key: 'thue_thang',
      label: 'Tiền thuê / tháng nếu thuê',
      type: 'money',
      help: 'Chi phí thuê căn tương đương để so với mua.',
    },
    {
      key: 'so_nam_so_sanh',
      label: 'Số năm so sánh',
      type: 'number',
      help: 'Khung thời gian cộng dồn chi phí hai phương án.',
    },
  ],
  ty_le_no_dti: [
    {
      key: 'thu_nhap_thang',
      label: 'Thu nhập / tháng',
      type: 'money',
      help: 'Thu nhập trước khi trả nợ — mẫu số của DTI.',
    },
    {
      key: 'tong_tra_no_thang',
      label: 'Tổng trả nợ / tháng',
      type: 'money',
      help: 'Gồm trả góp, thẻ, vay… Ngân hàng thường cảnh báo khi DTI > 40–50%.',
    },
  ],
  snowball_avalanche: [
    {
      key: 'debts',
      label: 'Danh sách nợ (JSON)',
      type: 'json',
      help: 'Mảng [{name, balance, apr, min_payment}]. apr dạng thập phân (0.18 = 18%).',
    },
    {
      key: 'extra_payment',
      label: 'Trả thêm mỗi tháng',
      type: 'money',
      help: 'Số tiền trả thêm sau khi đã đủ các khoản tối thiểu — càng lớn càng sạch nợ nhanh.',
    },
  ],
  vay_mua_xe: [
    { key: 'gia_xe', label: 'Giá xe', type: 'money', help: 'Giá xe trước khi trừ trả trước.' },
    { key: 'tra_truoc', label: 'Trả trước', type: 'money', help: 'Vốn tự có — phần còn lại là khoản vay.' },
    { key: 'lai_vay_nam', label: 'Lãi vay / năm', type: 'percent', help: 'Lãi suất vay mua xe (0.1 = 10%/năm).' },
    { key: 'so_thang', label: 'Số tháng vay', type: 'number', help: 'Kỳ hạn trả góp.' },
    { key: 'bao_hiem_nam', label: 'Bảo hiểm / năm', type: 'money', help: 'BH thân vỏ / trách nhiệm… quy năm.' },
    { key: 'xang_thang', label: 'Xăng / tháng', type: 'money', help: 'Chi phí nhiên liệu trung bình.' },
    { key: 'bao_duong_nam', label: 'Bảo dưỡng / năm', type: 'money', help: 'Bảo dưỡng, đăng kiểm, hao mòn ước theo năm.' },
  ],
  so_sanh_khoan_vay: [
    {
      key: 'loans',
      label: 'Các khoản vay (JSON)',
      type: 'json',
      help: 'Mảng [{name, principal, apr, months}] để so trả tháng & tổng lãi.',
    },
  ],
  lai_the_tin_dung: [
    { key: 'du_no', label: 'Dư nợ thẻ', type: 'money', help: 'Số dư quay vòng đang chịu lãi.' },
    {
      key: 'lai_suat_nam',
      label: 'Lãi suất / năm',
      type: 'percent',
      help: 'Lãi suất thẻ (thường rất cao, vd 0.25–0.4).',
    },
    {
      key: 'so_thang',
      label: 'Số tháng mô phỏng trả tối thiểu',
      type: 'number',
      help: 'Giả sử chỉ trả tối thiểu trong N tháng — xem lãi cộng dồn.',
    },
  ],
  appreciation_bds: [
    { key: 'gia_mua', label: 'Giá mua', type: 'money', help: 'Giá gốc lúc mua / định giá ban đầu.' },
    { key: 'so_nam', label: 'Số năm nắm giữ', type: 'number', help: 'Kỳ vọng giữ tài sản.' },
    {
      key: 'ty_le_tang_nam',
      label: 'Tỷ lệ tăng giá / năm',
      type: 'percent',
      help: 'Giả định tăng giá kép hàng năm (không phải dự báo thị trường).',
    },
  ],
  chi_phi_nuoi_con: [
    {
      key: 'chi_phi_thang_hien_tai',
      label: 'Chi phí / tháng hiện tại',
      type: 'money',
      help: 'Chi phí nuôi hiện tại (học, ăn, chăm sóc…).',
    },
    { key: 'tuoi_hien_tai', label: 'Tuổi hiện tại', type: 'number', help: 'Tuổi trẻ hiện tại.' },
    {
      key: 'tuoi_ket_thuc',
      label: 'Tuổi kết thúc ước lượng',
      type: 'number',
      help: 'Thường 18 — năm kết thúc giai đoạn hỗ trợ bạn muốn mô phỏng.',
    },
  ],
}
