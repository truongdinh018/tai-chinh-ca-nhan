/** Map browser-stored finance data → tool form params. */

import type { Asset, Debt, Salary, Summary } from '../api/client'

export type ToolContext = {
  latestSalary: Salary | null
  debts: Debt[]
  assets: Asset[]
  summary: Summary
}

export function prefillFromContext(
  toolId: string,
  base: Record<string, unknown>,
  ctx: ToolContext,
): { values: Record<string, unknown>; note: string } {
  const values = { ...base }
  const notes: string[] = []
  const s = ctx.latestSalary
  const sum = ctx.summary

  const set = (key: string, val: unknown, label: string) => {
    if (val === null || val === undefined || val === '') return
    values[key] = val
    notes.push(label)
  }

  switch (toolId) {
    case 'luong_gross_net':
      if (s) {
        set('gross', s.gross, `gross ${s.gross}`)
        set('dependents', s.dependents, `${s.dependents} người phụ thuộc`)
      }
      break
    case 'quyet_toan_tncn':
      if (s) {
        set('tong_thu_nhap_nam', s.gross * 12, 'gross × 12')
        set('bao_hiem_nam', Math.round(s.gross * 0.105 * 12), ' ước BH 10.5%×12')
        set('so_nguoi_phu_thuoc', s.dependents, 'phụ thuộc')
      }
      break
    case 'bao_hiem_that_nghiep':
    case 'bao_hiem_huu_tri':
      if (s) {
        set('luong_binh_quan_6_thang', s.gross, 'gross gần nhất')
        set('luong_binh_quan_dong', s.gross, 'gross gần nhất')
      }
      break
    case 'quy_du_phong':
    case 'diem_suc_khoe':
    case 'rui_ro_tai_chinh':
    case 'ty_le_no_dti': {
      const thuNhap = s?.net || s?.gross || 0
      if (thuNhap) set('thu_nhap_thang', thuNhap, 'thu nhập từ kỳ lương')
      if (sum.debts_total_vnd) set('tong_no', sum.debts_total_vnd, 'tổng dư nợ')
      if (sum.assets_total_vnd) {
        set('tai_san_dau_tu', sum.assets_total_vnd, 'tổng tài sản')
        set('tai_san_hien_tai', sum.assets_total_vnd, 'tổng tài sản')
        set('so_tien_hien_co', Math.round(sum.assets_total_vnd * 0.1), 'ước 10% TS làm quỹ')
      }
      const traNo = ctx.debts.reduce((a, d) => a + Math.max(0, d.balance_vnd * (d.rate_year || 0) / 12 / 10), 0)
      // crude min payment estimate: 1% balance + monthly interest piece — optional
      const minPay = ctx.debts.reduce((a, d) => a + Math.max(500000, d.balance_vnd * 0.02), 0)
      if (ctx.debts.length) {
        set('tra_no_thang', Math.round(minPay), 'ước trả nợ tháng')
        set('tong_tra_no_thang', Math.round(minPay), 'ước trả nợ tháng')
      }
      void traNo
      break
    }
    case 'fire':
    case 'barista_fire':
      if (s?.net) set('chi_tieu_nam', Math.round(s.net * 0.7 * 12), 'ước chi ~70% net × 12')
      if (sum.assets_total_vnd) set('tai_san_hien_tai', sum.assets_total_vnd, 'tổng tài sản')
      if (s?.net) set('tiet_kiem_nam', Math.round(s.net * 0.3 * 12), 'ước tiết kiệm 30%')
      break
    case 'snowball_avalanche':
      if (ctx.debts.length) {
        values.debts = ctx.debts.map((d) => ({
          name: d.name,
          balance: d.balance_vnd,
          apr: d.rate_year,
          min_payment: Math.max(500000, Math.round(d.balance_vnd * 0.02)),
        }))
        notes.push(`${ctx.debts.length} khoản nợ`)
      }
      break
    case 'dca':
      if (s?.net) set('so_tien_moi_thang', Math.round(s.net * 0.2), 'ước 20% net')
      break
    default:
      if (s?.gross && 'gross' in values) set('gross', s.gross, 'gross')
      if (sum.assets_total_vnd && 'tai_san_hien_tai' in values) {
        set('tai_san_hien_tai', sum.assets_total_vnd, 'tài sản')
      }
  }

  return {
    values,
    note: notes.length
      ? `Đã điền từ dữ liệu trình duyệt: ${notes.join(' · ')}`
      : 'Chưa có lương/tài sản/nợ lưu trên máy — hãy nhập ở các tab hoặc import Sheet.',
  }
}
