/** Display meta for tool cards (icons + category keys for i18n). */

export type ToolCategoryKey =
  | 'cat.salary'
  | 'cat.invest'
  | 'cat.risk'
  | 'cat.fire'
  | 'cat.loan'
  | 'cat.family'

export type ToolMeta = {
  id: string
  icon: string
  categoryKey: ToolCategoryKey
  accent: 'teal' | 'green' | 'orange' | 'blue' | 'purple' | 'pink'
}

export const TOOL_META: ToolMeta[] = [
  { id: 'luong_gross_net', icon: '💰', categoryKey: 'cat.salary', accent: 'teal' },
  { id: 'quyet_toan_tncn', icon: '🧾', categoryKey: 'cat.salary', accent: 'teal' },
  { id: 'bao_hiem_that_nghiep', icon: '☂️', categoryKey: 'cat.salary', accent: 'teal' },
  { id: 'bao_hiem_huu_tri', icon: '🏦', categoryKey: 'cat.salary', accent: 'teal' },
  { id: 'gia_vang_loi_lo', icon: '🥇', categoryKey: 'cat.invest', accent: 'orange' },
  { id: 'dca', icon: '📈', categoryKey: 'cat.invest', accent: 'green' },
  { id: 'quy_du_phong', icon: '🐷', categoryKey: 'cat.invest', accent: 'green' },
  { id: 'ty_gia', icon: '💱', categoryKey: 'cat.invest', accent: 'blue' },
  { id: 'so_sanh_dau_tu_vs_tiet_kiem', icon: '⚖️', categoryKey: 'cat.invest', accent: 'green' },
  { id: 'tiet_kiem_vs_lam_phat', icon: '📉', categoryKey: 'cat.invest', accent: 'orange' },
  { id: 'diem_suc_khoe', icon: '🩺', categoryKey: 'cat.risk', accent: 'pink' },
  { id: 'rui_ro_tai_chinh', icon: '⚠️', categoryKey: 'cat.risk', accent: 'orange' },
  { id: 'fire', icon: '🔥', categoryKey: 'cat.fire', accent: 'orange' },
  { id: 'barista_fire', icon: '☕', categoryKey: 'cat.fire', accent: 'purple' },
  { id: 'mua_vs_thue_nha', icon: '🏠', categoryKey: 'cat.loan', accent: 'blue' },
  { id: 'ty_le_no_dti', icon: '📊', categoryKey: 'cat.loan', accent: 'blue' },
  { id: 'snowball_avalanche', icon: '❄️', categoryKey: 'cat.loan', accent: 'purple' },
  { id: 'vay_mua_xe', icon: '🚗', categoryKey: 'cat.loan', accent: 'blue' },
  { id: 'so_sanh_khoan_vay', icon: '📋', categoryKey: 'cat.loan', accent: 'teal' },
  { id: 'lai_the_tin_dung', icon: '💳', categoryKey: 'cat.loan', accent: 'pink' },
  { id: 'appreciation_bds', icon: '🏗️', categoryKey: 'cat.loan', accent: 'green' },
  { id: 'chi_phi_nuoi_con', icon: '👶', categoryKey: 'cat.family', accent: 'pink' },
]

export function getToolMeta(id: string): ToolMeta | undefined {
  return TOOL_META.find((t) => t.id === id)
}
