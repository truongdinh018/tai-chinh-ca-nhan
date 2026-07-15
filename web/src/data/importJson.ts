import type { AssetRow, DebtRow, SalaryRow, TxRow } from '../store/types'
import type { ImportJsonBundle } from '../data/financeSample'

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.replace(/,/g, ''))
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

function str(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v)
}

function normalizeAssets(rows: Array<Record<string, unknown>> | undefined) {
  if (!rows?.length) return undefined
  return rows.map((r) => ({
    name: str(r.name, 'Unnamed'),
    type: str(r.type, 'other'),
    quantity: num(r.quantity, 1),
    unit: str(r.unit),
    cost_vnd: num(r.cost_vnd),
    current_value_vnd: num(r.current_value_vnd),
    note: str(r.note),
  })) satisfies Omit<AssetRow, 'id' | 'updated_at'>[]
}

function normalizeTransactions(rows: Array<Record<string, unknown>> | undefined) {
  if (!rows?.length) return undefined
  return rows.map((r) => {
    const dir = str(r.direction, 'out')
    return {
      date: str(r.date, new Date().toISOString().slice(0, 10)),
      amount_vnd: num(r.amount_vnd),
      category: str(r.category),
      direction: (dir === 'in' ? 'in' : 'out') as 'in' | 'out',
      note: str(r.note),
      asset_id: r.asset_id == null || r.asset_id === '' ? null : num(r.asset_id),
    }
  }) satisfies Omit<TxRow, 'id' | 'created_at'>[]
}

function normalizeSalary(rows: Array<Record<string, unknown>> | undefined) {
  if (!rows?.length) return undefined
  return rows.map((r) => ({
    period_ym: str(r.period_ym, new Date().toISOString().slice(0, 7)),
    gross: num(r.gross),
    net: num(r.net),
    dependents: num(r.dependents),
    note: str(r.note),
  })) satisfies Omit<SalaryRow, 'id' | 'created_at'>[]
}

function normalizeDebts(rows: Array<Record<string, unknown>> | undefined) {
  if (!rows?.length) return undefined
  return rows.map((r) => ({
    name: str(r.name, 'Unnamed'),
    principal_vnd: num(r.principal_vnd),
    balance_vnd: num(r.balance_vnd),
    rate_year: num(r.rate_year),
    note: str(r.note),
  })) satisfies Omit<DebtRow, 'id' | 'updated_at'>[]
}

/** Parse + validate finance import JSON (allows missing sections). */
export function parseImportJson(raw: string): ImportJsonBundle {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('JSON không hợp lệ')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON phải là object có keys assets / transactions / salary / debts')
  }
  const o = parsed as Record<string, unknown>
  const pick = (key: string) => {
    const v = o[key]
    if (v == null) return undefined
    if (!Array.isArray(v)) throw new Error(`"${key}" phải là mảng`)
    return v as Array<Record<string, unknown>>
  }
  const bundle: ImportJsonBundle = {
    assets: pick('assets'),
    transactions: pick('transactions'),
    salary: pick('salary'),
    debts: pick('debts'),
  }
  if (!bundle.assets && !bundle.transactions && !bundle.salary && !bundle.debts) {
    throw new Error('JSON trống — cần ít nhất một trong: assets, transactions, salary, debts')
  }
  return bundle
}

export function normalizeImportBundle(bundle: ImportJsonBundle) {
  return {
    assets: normalizeAssets(bundle.assets),
    transactions: normalizeTransactions(bundle.transactions),
    salary: normalizeSalary(bundle.salary),
    debts: normalizeDebts(bundle.debts),
  }
}
