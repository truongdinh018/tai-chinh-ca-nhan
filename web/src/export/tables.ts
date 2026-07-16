import type { FinanceState } from '../store/types'
import { toCsv } from '../sheets/csv'

export type ExportScope =
  | 'all'
  | 'assets'
  | 'transactions'
  | 'salary'
  | 'debts'
  | 'accounts'
  | 'categories'
  | 'tags'
  | 'recurring'
  | 'budgets'

export type ExportTable = {
  key: Exclude<ExportScope, 'all'>
  title: string
  headers: string[]
  rows: Record<string, unknown>[]
}

const DEFS: Array<{
  key: ExportTable['key']
  title: string
  headers: string[]
  pick: (s: FinanceState) => Record<string, unknown>[]
}> = [
  {
    key: 'assets',
    title: 'Tài sản',
    headers: ['id', 'name', 'type', 'quantity', 'unit', 'cost_vnd', 'current_value_vnd', 'note', 'updated_at'],
    pick: (s) => s.assets as unknown as Record<string, unknown>[],
  },
  {
    key: 'transactions',
    title: 'Giao dịch',
    headers: [
      'id',
      'date',
      'amount_vnd',
      'category',
      'direction',
      'note',
      'asset_id',
      'account_id',
      'to_account_id',
      'tag_ids',
      'recurring_id',
      'created_at',
    ],
    pick: (s) =>
      s.transactions.map((t) => ({
        ...t,
        tag_ids: (t.tag_ids ?? []).join('|'),
      })) as unknown as Record<string, unknown>[],
  },
  {
    key: 'salary',
    title: 'Lương',
    headers: ['id', 'period_ym', 'gross', 'net', 'dependents', 'note', 'created_at'],
    pick: (s) => s.salary as unknown as Record<string, unknown>[],
  },
  {
    key: 'debts',
    title: 'Nợ',
    headers: ['id', 'name', 'principal_vnd', 'balance_vnd', 'rate_year', 'note', 'updated_at'],
    pick: (s) => s.debts as unknown as Record<string, unknown>[],
  },
  {
    key: 'accounts',
    title: 'Tài khoản',
    headers: ['id', 'name', 'kind', 'opening_balance_vnd', 'note', 'archived', 'updated_at'],
    pick: (s) => s.accounts as unknown as Record<string, unknown>[],
  },
  {
    key: 'categories',
    title: 'Danh mục',
    headers: ['id', 'name', 'kind', 'parent_id', 'icon', 'updated_at'],
    pick: (s) => s.categories as unknown as Record<string, unknown>[],
  },
  {
    key: 'tags',
    title: 'Nhãn',
    headers: ['id', 'name', 'color', 'updated_at'],
    pick: (s) => s.tags as unknown as Record<string, unknown>[],
  },
  {
    key: 'recurring',
    title: 'Định kỳ',
    headers: [
      'id',
      'name',
      'amount_vnd',
      'category',
      'direction',
      'account_id',
      'to_account_id',
      'day_of_month',
      'note',
      'active',
      'updated_at',
    ],
    pick: (s) => s.recurring as unknown as Record<string, unknown>[],
  },
  {
    key: 'budgets',
    title: 'Ngân sách',
    headers: ['id', 'category', 'amount_vnd', 'note', 'updated_at'],
    pick: (s) => s.budgets as unknown as Record<string, unknown>[],
  },
]

export function listExportTables(state: FinanceState, scope: ExportScope = 'all'): ExportTable[] {
  return DEFS.filter((d) => scope === 'all' || d.key === scope).map((d) => ({
    key: d.key,
    title: d.title,
    headers: d.headers,
    rows: d.pick(state),
  }))
}

/** Import-compatible JSON (no ids required — import strips them anyway). */
export function toImportableJson(state: FinanceState, scope: ExportScope = 'all'): string {
  const payload: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    version: state.version,
  }
  for (const t of listExportTables(state, scope)) {
    payload[t.key] = t.rows
  }
  return `${JSON.stringify(payload, null, 2)}\n`
}

export function tablesToCsvBlob(tables: ExportTable[]): Blob {
  if (tables.length === 1) {
    const t = tables[0]!
    const csv = `\uFEFF${toCsv(t.headers, t.rows)}`
    return new Blob([csv], { type: 'text/csv;charset=utf-8' })
  }
  const parts = tables.map((t) => `# ${t.title}\n${toCsv(t.headers, t.rows)}`)
  return new Blob([`\uFEFF${parts.join('\n\n')}`], { type: 'text/csv;charset=utf-8' })
}

export function countLabel(state: FinanceState): string {
  return `${state.assets.length} TS · ${state.accounts.length} TK · ${state.transactions.length} GD · ${state.salary.length} lương · ${state.debts.length} nợ`
}
