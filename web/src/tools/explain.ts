/** Step-by-step Vietnamese explanations for tool outputs. */

export type ExplainStep = {
  title: string
  detail: string
  value?: string
}

export type Explanation = {
  summary: string
  steps: ExplainStep[]
}

function vnd(n: unknown): string {
  const x = Number(n)
  if (!Number.isFinite(x)) return String(n ?? '—')
  return new Intl.NumberFormat('vi-VN').format(Math.round(x)) + ' ₫'
}

function pct(n: unknown, digits = 1): string {
  const x = Number(n)
  if (!Number.isFinite(x)) return String(n ?? '—')
  return `${(x * 100).toFixed(digits)}%`
}

function num(n: unknown, digits = 1): string {
  const x = Number(n)
  if (!Number.isFinite(x)) return String(n ?? '—')
  return x.toLocaleString('vi-VN', { maximumFractionDigits: digits })
}

function asRec(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

export function explainTool(
  toolId: string,
  input: Record<string, unknown>,
  output: unknown,
): Explanation {
  const o = asRec(output)
  const fn = EXPLAINERS[toolId]
  if (fn) return fn(input, o)
  return {
    summary: 'Đã tính xong. Xem các chỉ số chính bên dưới.',
    steps: Object.entries(o)
      .filter(([, v]) => v !== null && typeof v !== 'object')
      .slice(0, 8)
      .map(([k, v]) => ({
        title: k,
        detail: 'Giá trị trả về từ công thức của công cụ.',
        value: String(v),
      })),
  }
}

type Explainer = (input: Record<string, unknown>, o: Record<string, unknown>) => Explanation

const EXPLAINERS: Record<string, Explainer> = {
  luong_gross_net(input, o) {
    const bh = asRec(o.bao_hiem)
    const mode = String(o.mode ?? '')
    const steps: ExplainStep[] = [
      {
        title: '1. Xác định chiều tính',
        detail:
          mode === 'net_to_gross'
            ? 'Bạn nhập lương net mục tiêu → hệ thống dò gross sao cho sau BH + thuế = net đó.'
            : 'Bạn nhập lương gross → trừ BH bắt buộc và thuế TNCN để ra net.',
        value: mode === 'net_to_gross' ? 'Net → Gross' : 'Gross → Net',
      },
      {
        title: '2. Bảo hiểm bắt buộc',
        detail:
          'BHXH 8% + BHYT 1.5% + BHTN 1% trên mức lương đóng (có trần vùng/lương tối thiểu). ' +
          `Trần / cơ sở đóng BHXH-BHYT: ${vnd(bh.base_bhxh_bhyt)}, BHTN: ${vnd(bh.base_bhtn)}.`,
        value: `BHXH ${vnd(bh.bhxh)} · BHYT ${vnd(bh.bhyt)} · BHTN ${vnd(bh.bhtn)} · Tổng ${vnd(bh.total)}`,
      },
      {
        title: '3. Giảm trừ thuế TNCN',
        detail:
          'Thu nhập tính thuế = Gross − BH − giảm trừ bản thân − giảm trừ người phụ thuộc. ' +
          'Mức GT theo giả định công cụ (cập nhật theo chính sách năm trong code thuế).',
        value: `Bản thân ${vnd(o.giam_tru_ban_than)} · Phụ thuộc (${input.dependents ?? 0} người) ${vnd(o.giam_tru_phu_thuoc)}`,
      },
      {
        title: '4. Thuế TNCN',
        detail:
          Number(o.thu_nhap_tinh_thue) <= 0
            ? 'Thu nhập tính thuế ≤ 0 → chưa phải nộp thuế TNCN tháng này.'
            : 'Áp biểu thuế lũy tiến từng phần lên thu nhập tính thuế để ra thuế phải nộp.',
        value: `TNTT ${vnd(o.thu_nhap_tinh_thue)} → Thuế ${vnd(o.thue_tncn)}`,
      },
      {
        title: '5. Lương net',
        detail: 'Net = Gross − tổng bảo hiểm − thuế TNCN.',
        value: vnd(o.net),
      },
    ]
    return {
      summary: `Gross ${vnd(o.gross)} → Net ${vnd(o.net)} (BH ${vnd(bh.total)}, thuế ${vnd(o.thue_tncn)}).`,
      steps,
    }
  },

  quyet_toan_tncn(input, o) {
    const thue = Number(o.thue_phai_nop ?? 0)
    const daNop = Number(input.thue_da_khau_tru ?? 0)
    const chenh = thue - daNop
    return {
      summary:
        chenh > 0
          ? `Cần nộp thêm khoảng ${vnd(chenh)} khi quyết toán.`
          : chenh < 0
            ? `Có thể được hoàn / bù trừ khoảng ${vnd(Math.abs(chenh))}.`
            : 'Thuế phải nộp khớp với số đã khấu trừ.',
      steps: [
        {
          title: '1. Tổng thu nhập chịu thuế năm',
          detail: 'Cộng các khoản thu nhập chịu thuế trong kỳ quyết toán.',
          value: vnd(o.tong_thu_nhap ?? input.tong_thu_nhap_nam),
        },
        {
          title: '2. Trừ bảo hiểm & giảm trừ',
          detail: 'Trừ BH đã đóng, GT bản thân/phụ thuộc và giảm trừ hợp lệ khác.',
          value: `BH ${vnd(input.bao_hiem_nam)} · GT khác ${vnd(input.giam_tru_khac ?? 0)}`,
        },
        {
          title: '3. Thuế theo biểu năm',
          detail: 'Áp biểu thuế TNCN cả năm lên thu nhập tính thuế.',
          value: vnd(o.thue_phai_nop ?? o.thue_tncn),
        },
        {
          title: '4. So với đã khấu trừ',
          detail: 'Chênh lệch = thuế phải nộp − thuế đã khấu trừ tại nguồn.',
          value: `${vnd(thue)} − ${vnd(daNop)} = ${vnd(chenh)}`,
        },
      ],
    }
  },

  bao_hiem_that_nghiep(_i, o) {
    return {
      summary: `Ước nhận BHTN khoảng ${vnd(o.muc_huong_thang)} / tháng × ${num(o.so_thang_huong, 0)} tháng.`,
      steps: [
        {
          title: '1. Mức hưởng hàng tháng',
          detail: 'Thường ≈ 60% lương bình quân 6 tháng gần nhất (có trần theo vùng).',
          value: vnd(o.muc_huong_thang ?? o.tien_hang_thang),
        },
        {
          title: '2. Thời gian hưởng',
          detail: 'Số tháng hưởng phụ thuộc thời gian đã đóng BHTN (cứ ~12 tháng đóng ≈ 3 tháng hưởng, có trần).',
          value: `${num(o.so_thang_huong, 0)} tháng`,
        },
        {
          title: '3. Tổng ước tính',
          detail: 'Tổng = mức tháng × số tháng được hưởng.',
          value: vnd(o.tong_tien ?? o.tong_huong),
        },
      ],
    }
  },

  bao_hiem_huu_tri(_i, o) {
    return {
      summary: `Ước lương hưu khoảng ${vnd(o.luong_huu_thang)} / tháng.`,
      steps: [
        {
          title: '1. Cơ sở tính',
          detail: 'Dựa trên lương bình quân đóng BHXH và số năm đóng.',
          value: `${vnd(o.luong_binh_quan ?? _i.luong_binh_quan_dong)} · ${num(_i.so_nam_dong, 1)} năm`,
        },
        {
          title: '2. Tỷ lệ hưởng',
          detail: 'Tỷ lệ % lương hưu tăng theo số năm đóng (công thức BHXH VN rút gọn trong công cụ).',
          value: pct(o.ty_le_huong ?? o.ty_le),
        },
        {
          title: '3. Lương hưu ước tính',
          detail: 'Lương hưu ≈ lương bình quân × tỷ lệ hưởng (+ phần đóng tự nguyện nếu có).',
          value: vnd(o.luong_huu_thang),
        },
      ],
    }
  },

  gia_vang_loi_lo(input, o) {
    const lai = Number(o.lai_lo ?? o.loi_lo ?? 0)
    return {
      summary: lai >= 0 ? `Đang lãi khoảng ${vnd(lai)}.` : `Đang lỗ khoảng ${vnd(Math.abs(lai))}.`,
      steps: [
        {
          title: '1. Giá vốn',
          detail: 'Giá vốn = số lượng × giá mua.',
          value: vnd(o.gia_von ?? Number(input.so_luong) * Number(input.gia_mua)),
        },
        {
          title: '2. Giá thị trường',
          detail: 'Giá trị hiện tại = số lượng × giá hiện tại.',
          value: vnd(o.gia_tri_hien_tai ?? Number(input.so_luong) * Number(input.gia_hien_tai)),
        },
        {
          title: '3. Lãi / lỗ',
          detail: 'Lãi/lỗ = giá trị hiện tại − giá vốn. % = lãi/lỗ ÷ giá vốn.',
          value: `${vnd(lai)} (${pct(o.ty_le_lai_lo ?? o.pct)})`,
        },
      ],
    }
  },

  dca(input, o) {
    return {
      summary: `Góp ${vnd(input.so_tien_moi_thang)} × ${num(input.so_thang, 0)} tháng → ước còn lại ${vnd(o.gia_tri_cuoi)}.`,
      steps: [
        {
          title: '1. Tổng vốn góp',
          detail: 'Tổng tiền bạn bỏ vào = tiền mỗi tháng × số tháng (chưa tính lãi).',
          value: vnd(o.tong_von_gop ?? Number(input.so_tien_moi_thang) * Number(input.so_thang)),
        },
        {
          title: '2. Lợi suất gộp tháng',
          detail: 'Lấy lợi suất năm kỳ vọng quy ra lãi kép theo tháng và cộng dồn mỗi kỳ góp.',
          value: pct(input.loi_suat_nam),
        },
        {
          title: '3. Giá trị cuối kỳ',
          detail: 'Công thức niên kim (future value of annuity): mỗi khoản góp được lãi theo số tháng còn lại.',
          value: vnd(o.gia_tri_cuoi ?? o.gia_tri),
        },
        {
          title: '4. Lãi ước tính',
          detail: 'Lãi = giá trị cuối − tổng vốn đã góp.',
          value: vnd(o.lai ?? Number(o.gia_tri_cuoi) - Number(o.tong_von_gop)),
        },
      ],
    }
  },

  quy_du_phong(input, o) {
    return {
      summary: `Cần quỹ ${vnd(o.muc_tieu)} · hiện có ${vnd(input.so_tien_hien_co)} · thiếu ${vnd(o.thieu)}.`,
      steps: [
        {
          title: '1. Mục tiêu quỹ',
          detail: 'Mục tiêu = chi tiêu tháng × số tháng dự phòng (thường 3–6 tháng).',
          value: `${vnd(input.chi_tieu_thang)} × ${num(input.so_thang_muc_tieu, 0)} = ${vnd(o.muc_tieu)}`,
        },
        {
          title: '2. Khoảng trống',
          detail: 'Thiều = mục tiêu − số tiền hiện có (không âm nếu đã đủ).',
          value: vnd(o.thieu ?? o.con_thieu),
        },
        {
          title: '3. Thời gian tích lũy',
          detail: 'Nếu tiết kiệm thêm mỗi tháng > 0, ước số tháng để lấp khoảng trống.',
          value: o.so_thang_can != null ? `${num(o.so_thang_can, 1)} tháng` : 'Đã đủ / không ước được',
        },
      ],
    }
  },

  ty_gia(input, o) {
    return {
      summary: `${num(input.so_tien, 2)} ${input.currency ?? ''} ≈ ${vnd(o.vnd ?? o.so_tien_vnd)}.`,
      steps: [
        {
          title: '1. Quy đổi',
          detail: 'VND = số tiền ngoại tệ × tỷ giá (VND cho 1 đơn vị). Đây là quy đổi tính tay, không lấy giá live.',
          value: `${num(input.so_tien, 2)} × ${vnd(input.ty_gia)} = ${vnd(o.vnd ?? o.so_tien_vnd)}`,
        },
      ],
    }
  },

  so_sanh_dau_tu_vs_tiet_kiem(input, o) {
    return {
      summary: `Sau ${num(input.so_nam, 0)} năm: đầu tư ước ${vnd(o.dau_tu)} vs tiết kiệm ${vnd(o.tiet_kiem)}.`,
      steps: [
        {
          title: '1. Kịch bản tiết kiệm',
          detail: 'Giả định lãi suất thấp/ổn định hơn (tiền gửi).',
          value: vnd(o.tiet_kiem ?? o.gia_tri_tiet_kiem),
        },
        {
          title: '2. Kịch bản đầu tư',
          detail: 'Giả định lợi suất kỳ vọng cao hơn nhưng biến động lớn hơn.',
          value: vnd(o.dau_tu ?? o.gia_tri_dau_tu),
        },
        {
          title: '3. Chênh lệch',
          detail: 'Chênh = giá trị đầu tư − tiết kiệm. Không phải cam kết lợi nhuận thực tế.',
          value: vnd(o.chenh_lech ?? Number(o.dau_tu) - Number(o.tiet_kiem)),
        },
      ],
    }
  },

  tiet_kiem_vs_lam_phat(input, o) {
    return {
      summary: `Sức mua thực sau ${num(input.so_nam, 0)} năm ≈ ${vnd(o.suc_mua_thuc ?? o.gia_tri_thuc)}.`,
      steps: [
        {
          title: '1. Giá trị danh nghĩa',
          detail: 'Số tiền trong sổ (có thể tăng nhờ lãi) — chưa trừ lạm phát.',
          value: vnd(o.gia_tri_danh_nghia ?? o.danh_nghia),
        },
        {
          title: '2. Điều chỉnh lạm phát',
          detail: 'Sức mua thực = giá trị danh nghĩa / (1 + lạm phát)^n — cho thấy tiền “mất giá” thế nào.',
          value: vnd(o.suc_mua_thuc ?? o.gia_tri_thuc),
        },
      ],
    }
  },

  diem_suc_khoe(_i, o) {
    return {
      summary: `Điểm sức khỏe tài chính: ${num(o.diem, 0)}/100 · ${o.xep_loai ?? o.label ?? ''}.`,
      steps: [
        {
          title: '1. Các trụ cột chấm điểm',
          detail: 'Thường gồm: tỷ lệ tiết kiệm, quỹ dự phòng, gánh nặng nợ, tỷ trọng đầu tư, bảo hiểm.',
          value: String(o.chi_tiet ? 'Xem bảng điểm chi tiết' : o.xep_loai ?? ''),
        },
        {
          title: '2. Tổng điểm',
          detail: 'Công cụ quy từng chỉ số về thang điểm rồi cộng/trung bình có trọng số.',
          value: `${num(o.diem, 0)} điểm`,
        },
        {
          title: '3. Xếp loại',
          detail: 'Nhãn (tốt / khá / yếu…) chỉ mang tính định hướng, không phải xếp hạng ngân hàng.',
          value: String(o.xep_loai ?? o.label ?? '—'),
        },
      ],
    }
  },

  rui_ro_tai_chinh(_i, o) {
    return {
      summary: `Mức rủi ro ước tính: ${o.muc_rui_ro ?? o.level ?? '—'} (${pct(o.diem_rui_ro ?? o.score)}).`,
      steps: [
        {
          title: '1. Đệm thanh khoản',
          detail: 'Quỹ dự phòng / chi tiêu tháng → số tháng sống được nếu mất thu nhập.',
          value: o.so_thang_du_phong != null ? `${num(o.so_thang_du_phong, 1)} tháng` : '—',
        },
        {
          title: '2. Phân bổ rủi ro',
          detail: 'Tỷ trọng tài sản biến động cao làm tăng điểm rủi ro tổng.',
          value: pct(_i.ty_trong_tai_san_rui_ro),
        },
        {
          title: '3. Kết luận',
          detail: 'Mức rủi ro là ước lượng định hướng để điều chỉnh tiết kiệm / phân bổ, không phải dự báo sự cố.',
          value: String(o.muc_rui_ro ?? o.level ?? '—'),
        },
      ],
    }
  },

  fire(input, o) {
    return {
      summary: `Số FIRE cần ≈ ${vnd(o.so_fire ?? o.fire_number)} · còn thiếu ${vnd(o.thieu ?? o.gap)}.`,
      steps: [
        {
          title: '1. Số FIRE (4% rule)',
          detail: 'Số tiền cần ≈ chi tiêu năm ÷ tỷ lệ rút an toàn (mặc định 4%). Ví dụ chi 240tr/năm → cần ~6 tỷ.',
          value: `${vnd(input.chi_tieu_nam)} ÷ ${pct(input.withdrawal_rate ?? 0.04)} = ${vnd(o.so_fire ?? o.fire_number)}`,
        },
        {
          title: '2. Khoảng cách',
          detail: 'Thiếu = số FIRE − tài sản hiện tại (nếu đã nhập).',
          value: vnd(o.thieu ?? o.gap),
        },
        {
          title: '3. Thời gian ước lượng',
          detail: 'Nếu có tiết kiệm/năm, ước số năm để đạt FIRE (giả định lợi suất đơn giản).',
          value: o.so_nam != null ? `~${num(o.so_nam, 1)} năm` : 'Chưa ước (thiếu tiết kiệm/năm)',
        },
      ],
    }
  },

  barista_fire(input, o) {
    return {
      summary: `Barista FIRE cần ≈ ${vnd(o.so_can ?? o.barista_number)}.`,
      steps: [
        {
          title: '1. Chi tiêu còn lại cần quỹ chi trả',
          detail: 'Chi tiêu năm − thu nhập part-time = phần phải lấy từ tài sản đầu tư.',
          value: `${vnd(input.chi_tieu_nam)} − ${vnd(input.thu_nhap_part_time_nam)}`,
        },
        {
          title: '2. Số Barista FIRE',
          detail: 'Áp 4% rule lên phần chi tiêu còn lại.',
          value: vnd(o.so_can ?? o.barista_number),
        },
        {
          title: '3. So với tài sản hiện tại',
          detail: 'Đã đủ hay còn thiếu bao nhiêu so với mục tiêu barista FIRE.',
          value: vnd(o.thieu ?? o.gap),
        },
      ],
    }
  },

  mua_vs_thue_nha(input, o) {
    return {
      summary: String(o.ket_luan ?? o.recommendation ?? `So sánh mua vs thuê trong ${num(input.so_nam_so_sanh, 0)} năm.`),
      steps: [
        {
          title: '1. Chi phí sở hữu',
          detail: 'Gồm trả trước, lãi vay ước tính, và chi phí nắm giữ trong kỳ so sánh.',
          value: vnd(o.chi_phi_mua ?? o.tong_chi_mua),
        },
        {
          title: '2. Chi phí thuê',
          detail: 'Tiền thuê × số tháng trong kỳ (chưa gồm tiền thuê tăng theo năm nếu mô hình đơn giản).',
          value: vnd(o.chi_phi_thue ?? o.tong_chi_thue),
        },
        {
          title: '3. Kết luận định hướng',
          detail: 'Chọn phương án tổng chi thấp hơn trong giả định — thực tế còn phụ thuộc vị trí, thanh khoản, rủi ro lãi suất.',
          value: String(o.ket_luan ?? o.recommendation ?? '—'),
        },
      ],
    }
  },

  ty_le_no_dti(input, o) {
    const dti = Number(o.dti ?? o.ty_le ?? 0)
    return {
      summary: `DTI ≈ ${pct(dti)} — ${o.danh_gia ?? o.label ?? (dti > 0.4 ? 'cao' : 'ổn')}.`,
      steps: [
        {
          title: '1. Công thức DTI',
          detail: 'Debt-to-Income = tổng trả nợ tháng ÷ thu nhập tháng. Ngân hàng thường cảnh báo khi > 40–50%.',
          value: `${vnd(input.tong_tra_no_thang)} ÷ ${vnd(input.thu_nhap_thang)} = ${pct(dti)}`,
        },
        {
          title: '2. Đánh giá',
          detail: 'DTI thấp → dư địa vay/thêm chi tiêu tốt hơn; DTI cao → nên giảm nợ hoặc tăng thu nhập trước khi vay thêm.',
          value: String(o.danh_gia ?? o.label ?? '—'),
        },
      ],
    }
  },

  snowball_avalanche(_i, o) {
    return {
      summary: `So sánh Snowball vs Avalanche — xem lịch trả và lãi tiết kiệm được.`,
      steps: [
        {
          title: '1. Snowball',
          detail: 'Ưu tiên trả hết khoản nợ nhỏ nhất trước (tâm lý chiến thắng), trả tối thiểu các khoản còn lại.',
          value: o.snowball ? `Lãi ước ${vnd(asRec(o.snowball).total_interest)}` : '—',
        },
        {
          title: '2. Avalanche',
          detail: 'Ưu tiên nợ lãi suất cao nhất trước — thường tiết kiệm lãi hơn về toán học.',
          value: o.avalanche ? `Lãi ước ${vnd(asRec(o.avalanche).total_interest)}` : '—',
        },
        {
          title: '3. Chọn cách nào?',
          detail: 'Avalanche thường rẻ hơn; Snowball dễ duy trì thói quen. Có thể kết hợp: thắng nhỏ rồi chuyển sang lãi cao.',
          value: String(o.goi_y ?? o.recommendation ?? '—'),
        },
      ],
    }
  },

  vay_mua_xe(input, o) {
    return {
      summary: `Trả góp ước ${vnd(o.tra_thang ?? o.monthly)} / tháng · tổng chi sở hữu ${vnd(o.tong_chi ?? o.total_cost)}.`,
      steps: [
        {
          title: '1. Khoản vay',
          detail: 'Vốn vay = giá xe − trả trước.',
          value: vnd(o.khoan_vay ?? Number(input.gia_xe) - Number(input.tra_truoc)),
        },
        {
          title: '2. Trả góp tháng',
          detail: 'Tính theo lãi suất năm và số tháng vay (công thức trả đều / amortized).',
          value: vnd(o.tra_thang ?? o.monthly),
        },
        {
          title: '3. Chi phí vận hành',
          detail: 'Cộng bảo hiểm, xăng, bảo dưỡng quy theo tháng/năm vào tổng chi sở hữu.',
          value: vnd(o.tong_chi ?? o.total_cost),
        },
      ],
    }
  },

  so_sanh_khoan_vay(_i, o) {
    return {
      summary: 'So sánh tổng lãi / trả tháng giữa các gói vay.',
      steps: [
        {
          title: '1. Cách so',
          detail: 'Với mỗi khoản: tính trả tháng và tổng lãi trên cùng giả định số tháng & lãi suất.',
          value: Array.isArray(o.ket_qua) ? `${o.ket_qua.length} gói` : '—',
        },
        {
          title: '2. Gói tối ưu (theo tổng lãi)',
          detail: 'Thường chọn gói tổng tiền phải trả thấp nhất — kiểm tra phí ẩn ngoài model.',
          value: String(o.tot_nhat ?? o.best ?? '—'),
        },
      ],
    }
  },

  lai_the_tin_dung(input, o) {
    return {
      summary: `Trả tối thiểu trong ${num(input.so_thang, 0)} tháng có thể phát sinh lãi ~${vnd(o.tong_lai ?? o.interest)}.`,
      steps: [
        {
          title: '1. Lãi tháng',
          detail: 'Lãi suất tháng ≈ lãi năm / 12, tính trên dư nợ quay vòng.',
          value: pct(Number(input.lai_suat_nam) / 12),
        },
        {
          title: '2. Mô phỏng trả tối thiểu',
          detail: 'Mỗi tháng trả một phần nhỏ → dư nợ giảm chậm → lãi cộng dồn.',
          value: vnd(o.tong_lai ?? o.interest),
        },
        {
          title: '3. Gợi ý',
          detail: 'Trả nhiều hơn mức tối thiểu (hoặc chuyển đổi dư nợ) để cắt lãi nhanh.',
          value: o.goi_y ? String(o.goi_y) : 'Ưu tiên trả hết dư nợ lãi cao',
        },
      ],
    }
  },

  appreciation_bds(input, o) {
    return {
      summary: `Giá ước sau ${num(input.so_nam, 0)} năm: ${vnd(o.gia_tuong_lai ?? o.future_value)}.`,
      steps: [
        {
          title: '1. Lãi kép giá BĐS',
          detail: 'Giá tương lai = giá mua × (1 + tỷ lệ tăng)^số năm. Đây là giả định, không phải dự báo thị trường.',
          value: `${vnd(input.gia_mua)} × (1+${pct(input.ty_le_tang_nam)})^${num(input.so_nam, 0)}`,
        },
        {
          title: '2. Kết quả',
          detail: 'Chênh lệch so với giá mua cho thấy mức tăng danh nghĩa (chưa trừ thuế, phí, lạm phát).',
          value: vnd(o.gia_tuong_lai ?? o.future_value),
        },
      ],
    }
  },

  chi_phi_nuoi_con(input, o) {
    return {
      summary: `Tổng ước từ ${num(input.tuoi_hien_tai, 0)}→${num(input.tuoi_ket_thuc, 0)} tuổi: ${vnd(o.tong_chi_phi ?? o.total)}.`,
      steps: [
        {
          title: '1. Chi tháng hiện tại',
          detail: 'Điểm xuất phát = chi phí nuôi / tháng bạn đang chi.',
          value: vnd(input.chi_phi_thang_hien_tai),
        },
        {
          title: '2. Số năm còn lại',
          detail: 'Số năm = tuổi kết thúc − tuổi hiện tại (ước lượng đến hết giai đoạn hỗ trợ).',
          value: `${num(Number(input.tuoi_ket_thuc) - Number(input.tuoi_hien_tai), 0)} năm`,
        },
        {
          title: '3. Tổng ước',
          detail: 'Công cụ cộng dồn chi theo các năm (có thể có hệ số tăng theo tuổi). Chỉ mang tính lập kế hoạch.',
          value: vnd(o.tong_chi_phi ?? o.total),
        },
      ],
    }
  },
}
