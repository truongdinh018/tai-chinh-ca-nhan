/** Browser finance data (plain IndexedDB — no login, no SQLite). Schema v2. */

export type AssetRow = {
  id: number
  name: string
  type: string
  quantity: number
  unit: string
  cost_vnd: number
  current_value_vnd: number
  note: string
  updated_at: string
}

export type TxDirection = 'in' | 'out' | 'transfer'

export type TxRow = {
  id: number
  date: string
  amount_vnd: number
  category: string
  direction: TxDirection
  note: string
  asset_id: number | null
  /** Source account for in/out/transfer (v2). */
  account_id: number | null
  /** Destination account for transfers (v2). */
  to_account_id: number | null
  /** Tag references (v2). */
  tag_ids: number[]
  /** Recurring template that generated this row, if any (v2). */
  recurring_id: number | null
  created_at: string
}

export type SalaryRow = {
  id: number
  period_ym: string
  gross: number
  net: number
  dependents: number
  note: string
  created_at: string
}

export type DebtRow = {
  id: number
  name: string
  principal_vnd: number
  balance_vnd: number
  rate_year: number
  note: string
  updated_at: string
}

export type ToolRunRow = {
  id: number
  tool_id: string
  input_json: string
  output_json: string
  created_at: string
}

export type AccountKind = 'cash' | 'bank' | 'ewallet' | 'credit' | 'other'

export type AccountRow = {
  id: number
  name: string
  kind: AccountKind
  opening_balance_vnd: number
  note: string
  archived: boolean
  updated_at: string
}

export type CategoryRow = {
  id: number
  name: string
  /** Direction this category applies to. */
  kind: 'in' | 'out'
  /** Optional two-level nesting. */
  parent_id: number | null
  icon: string
  updated_at: string
}

export type TagRow = {
  id: number
  name: string
  color: string
  updated_at: string
}

export type RecurringRow = {
  id: number
  name: string
  amount_vnd: number
  category: string
  direction: TxDirection
  account_id: number | null
  to_account_id: number | null
  tag_ids: number[]
  /** Day of month (1-31) the template posts. */
  day_of_month: number
  note: string
  active: boolean
  updated_at: string
}

export type BudgetRow = {
  id: number
  category: string
  amount_vnd: number
  note: string
  updated_at: string
}

export type SheetsSettings = {
  /** Public spreadsheet URL or ID used for import */
  importUrl: string
  /** Deployed Apps Script web app URL for write-back */
  webhookUrl: string
  /** Optional shared secret sent as header X-Sync-Token */
  webhookToken: string
}

export type FinanceState = {
  version: 2
  nextId: number
  assets: AssetRow[]
  transactions: TxRow[]
  salary: SalaryRow[]
  debts: DebtRow[]
  toolRuns: ToolRunRow[]
  accounts: AccountRow[]
  categories: CategoryRow[]
  tags: TagRow[]
  recurring: RecurringRow[]
  budgets: BudgetRow[]
  sheets: SheetsSettings
}

export function emptyState(): FinanceState {
  return {
    version: 2,
    nextId: 1,
    assets: [],
    transactions: [],
    salary: [],
    debts: [],
    toolRuns: [],
    accounts: [],
    categories: [],
    tags: [],
    recurring: [],
    budgets: [],
    sheets: { importUrl: '', webhookUrl: '', webhookToken: '' },
  }
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** Default Vietnamese accounts seeded when none exist. */
export const DEFAULT_ACCOUNTS: Array<Omit<AccountRow, 'id' | 'updated_at'>> = [
  { name: 'Tiền mặt', kind: 'cash', opening_balance_vnd: 0, note: '', archived: false },
  { name: 'Ngân hàng', kind: 'bank', opening_balance_vnd: 0, note: '', archived: false },
]

/** Default Vietnamese categories seeded when none exist. */
export const DEFAULT_CATEGORIES: Array<Omit<CategoryRow, 'id' | 'updated_at' | 'parent_id'>> = [
  { name: 'Ăn uống', kind: 'out', icon: '🍜' },
  { name: 'Đi lại', kind: 'out', icon: '🚌' },
  { name: 'Nhà ở', kind: 'out', icon: '🏠' },
  { name: 'Hóa đơn', kind: 'out', icon: '🧾' },
  { name: 'Mua sắm', kind: 'out', icon: '🛍️' },
  { name: 'Giải trí', kind: 'out', icon: '🎬' },
  { name: 'Sức khỏe', kind: 'out', icon: '💊' },
  { name: 'Giáo dục', kind: 'out', icon: '📚' },
  { name: 'Khác (chi)', kind: 'out', icon: '📦' },
  { name: 'Lương', kind: 'in', icon: '💰' },
  { name: 'Thưởng', kind: 'in', icon: '🎁' },
  { name: 'Đầu tư', kind: 'in', icon: '📈' },
  { name: 'Khác (thu)', kind: 'in', icon: '💵' },
]

/**
 * Migrate any stored blob to the current v2 shape. Preserves all existing
 * entities; adds new fields/collections with safe defaults and seeds default
 * accounts + categories when empty.
 */
export function migrateState(raw: unknown): FinanceState {
  const base = emptyState()
  if (!raw || typeof raw !== 'object') {
    return seedDefaults(base)
  }
  const o = raw as Partial<FinanceState> & Record<string, unknown>

  const state: FinanceState = {
    ...base,
    nextId: typeof o.nextId === 'number' && o.nextId > 0 ? o.nextId : 1,
    assets: Array.isArray(o.assets) ? (o.assets as AssetRow[]) : [],
    transactions: Array.isArray(o.transactions)
      ? (o.transactions as Partial<TxRow>[]).map(normalizeTx)
      : [],
    salary: Array.isArray(o.salary) ? (o.salary as SalaryRow[]) : [],
    debts: Array.isArray(o.debts) ? (o.debts as DebtRow[]) : [],
    toolRuns: Array.isArray(o.toolRuns) ? (o.toolRuns as ToolRunRow[]) : [],
    accounts: Array.isArray(o.accounts) ? (o.accounts as AccountRow[]) : [],
    categories: Array.isArray(o.categories) ? (o.categories as CategoryRow[]) : [],
    tags: Array.isArray(o.tags) ? (o.tags as TagRow[]) : [],
    recurring: Array.isArray(o.recurring) ? (o.recurring as RecurringRow[]) : [],
    budgets: Array.isArray(o.budgets) ? (o.budgets as BudgetRow[]) : [],
    sheets:
      o.sheets && typeof o.sheets === 'object'
        ? { ...base.sheets, ...(o.sheets as SheetsSettings) }
        : base.sheets,
  }

  // Ensure nextId is above every existing id to avoid collisions.
  state.nextId = Math.max(state.nextId, maxId(state) + 1)
  return seedDefaults(state)
}

function normalizeTx(t: Partial<TxRow>): TxRow {
  const dir = t.direction === 'in' || t.direction === 'transfer' ? t.direction : 'out'
  return {
    id: Number(t.id ?? 0),
    date: String(t.date ?? new Date().toISOString().slice(0, 10)),
    amount_vnd: Number(t.amount_vnd ?? 0),
    category: String(t.category ?? ''),
    direction: dir,
    note: String(t.note ?? ''),
    asset_id: t.asset_id == null ? null : Number(t.asset_id),
    account_id: t.account_id == null ? null : Number(t.account_id),
    to_account_id: t.to_account_id == null ? null : Number(t.to_account_id),
    tag_ids: Array.isArray(t.tag_ids) ? t.tag_ids.map(Number) : [],
    recurring_id: t.recurring_id == null ? null : Number(t.recurring_id),
    created_at: String(t.created_at ?? new Date().toISOString()),
  }
}

function maxId(state: FinanceState): number {
  let max = 0
  const scan = (rows: Array<{ id: number }>) => {
    for (const r of rows) if (r.id > max) max = r.id
  }
  scan(state.assets)
  scan(state.transactions)
  scan(state.salary)
  scan(state.debts)
  scan(state.toolRuns)
  scan(state.accounts)
  scan(state.categories)
  scan(state.tags)
  scan(state.recurring)
  scan(state.budgets)
  return max
}

/** Seed default accounts + categories when the respective collection is empty. */
export function seedDefaults(state: FinanceState): FinanceState {
  const now = nowIso()
  if (state.accounts.length === 0) {
    for (const a of DEFAULT_ACCOUNTS) {
      state.accounts.push({ ...a, id: state.nextId++, updated_at: now })
    }
  }
  if (state.categories.length === 0) {
    for (const c of DEFAULT_CATEGORIES) {
      state.categories.push({ ...c, parent_id: null, id: state.nextId++, updated_at: now })
    }
  }
  return state
}
