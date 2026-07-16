import { loadState, updateState } from './db'
import {
  nowIso,
  type AccountRow,
  type AssetRow,
  type BudgetRow,
  type CategoryRow,
  type DebtRow,
  type FinanceState,
  type RecurringRow,
  type SalaryRow,
  type SheetsSettings,
  type TagRow,
  type ToolRunRow,
  type TxRow,
} from './types'

export type {
  AccountRow,
  AssetRow,
  BudgetRow,
  CategoryRow,
  DebtRow,
  RecurringRow,
  SalaryRow,
  SheetsSettings,
  TagRow,
  ToolRunRow,
  TxRow,
}

function allocId(state: FinanceState): number {
  const id = state.nextId
  state.nextId = id + 1
  return id
}

export async function listAssets(): Promise<AssetRow[]> {
  const s = await loadState()
  return [...s.assets].sort((a, b) => b.id - a.id)
}

export async function createAsset(
  data: Omit<AssetRow, 'id' | 'updated_at'>,
): Promise<AssetRow> {
  let row!: AssetRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), updated_at: nowIso() }
    s.assets.push(row)
  })
  return row
}

export async function updateAsset(
  id: number,
  data: Omit<AssetRow, 'id' | 'updated_at'>,
): Promise<AssetRow | null> {
  let row: AssetRow | null = null
  await updateState((s) => {
    const i = s.assets.findIndex((a) => a.id === id)
    if (i < 0) return
    row = { ...s.assets[i]!, ...data, id, updated_at: nowIso() }
    s.assets[i] = row
  })
  return row
}

export async function deleteAsset(id: number): Promise<boolean> {
  await updateState((s) => {
    s.assets = s.assets.filter((a) => a.id !== id)
  })
  return true
}

export async function listTransactions(): Promise<TxRow[]> {
  const s = await loadState()
  return [...s.transactions].sort((a, b) => {
    if (a.date === b.date) return b.id - a.id
    return a.date < b.date ? 1 : -1
  })
}

export async function createTransaction(
  data: Omit<TxRow, 'id' | 'created_at'>,
): Promise<TxRow> {
  let row!: TxRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), created_at: nowIso() }
    s.transactions.push(row)
  })
  return row
}

export async function updateTransaction(
  id: number,
  data: Omit<TxRow, 'id' | 'created_at'>,
): Promise<TxRow | null> {
  let row: TxRow | null = null
  await updateState((s) => {
    const i = s.transactions.findIndex((t) => t.id === id)
    if (i < 0) return
    row = { ...s.transactions[i]!, ...data, id, created_at: s.transactions[i]!.created_at }
    s.transactions[i] = row
  })
  return row
}

export async function deleteTransaction(id: number): Promise<boolean> {
  await updateState((s) => {
    s.transactions = s.transactions.filter((t) => t.id !== id)
  })
  return true
}

export async function listSalary(): Promise<SalaryRow[]> {
  const s = await loadState()
  return [...s.salary].sort((a, b) => {
    if (a.period_ym === b.period_ym) return b.id - a.id
    return a.period_ym < b.period_ym ? 1 : -1
  })
}

export async function createSalary(
  data: Omit<SalaryRow, 'id' | 'created_at'>,
): Promise<SalaryRow> {
  let row!: SalaryRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), created_at: nowIso() }
    s.salary.push(row)
  })
  return row
}

export async function updateSalary(
  id: number,
  data: Omit<SalaryRow, 'id' | 'created_at'>,
): Promise<SalaryRow | null> {
  let row: SalaryRow | null = null
  await updateState((s) => {
    const i = s.salary.findIndex((t) => t.id === id)
    if (i < 0) return
    row = { ...s.salary[i]!, ...data, id, created_at: s.salary[i]!.created_at }
    s.salary[i] = row
  })
  return row
}

export async function deleteSalary(id: number): Promise<boolean> {
  await updateState((s) => {
    s.salary = s.salary.filter((t) => t.id !== id)
  })
  return true
}

export async function listDebts(): Promise<DebtRow[]> {
  const s = await loadState()
  return [...s.debts].sort((a, b) => b.id - a.id)
}

export async function createDebt(
  data: Omit<DebtRow, 'id' | 'updated_at'>,
): Promise<DebtRow> {
  let row!: DebtRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), updated_at: nowIso() }
    s.debts.push(row)
  })
  return row
}

export async function updateDebt(
  id: number,
  data: Omit<DebtRow, 'id' | 'updated_at'>,
): Promise<DebtRow | null> {
  let row: DebtRow | null = null
  await updateState((s) => {
    const i = s.debts.findIndex((d) => d.id === id)
    if (i < 0) return
    row = { ...s.debts[i]!, ...data, id, updated_at: nowIso() }
    s.debts[i] = row
  })
  return row
}

export async function deleteDebt(id: number): Promise<boolean> {
  await updateState((s) => {
    s.debts = s.debts.filter((d) => d.id !== id)
  })
  return true
}

/* ------------------------------- Accounts -------------------------------- */

export async function listAccounts(): Promise<AccountRow[]> {
  const s = await loadState()
  return [...s.accounts].sort((a, b) => a.id - b.id)
}

/** Compute the running balance of one account from opening + tx effects. */
export function computeAccountBalance(state: FinanceState, accountId: number): number {
  const acc = state.accounts.find((a) => a.id === accountId)
  let bal = acc ? Number(acc.opening_balance_vnd || 0) : 0
  for (const t of state.transactions) {
    const amt = Number(t.amount_vnd || 0)
    if (t.direction === 'transfer') {
      if (t.account_id === accountId) bal -= amt
      if (t.to_account_id === accountId) bal += amt
    } else if (t.account_id === accountId) {
      bal += t.direction === 'in' ? amt : -amt
    }
  }
  return bal
}

export async function listAccountsWithBalance(): Promise<
  Array<AccountRow & { balance_vnd: number }>
> {
  const s = await loadState()
  return [...s.accounts]
    .sort((a, b) => a.id - b.id)
    .map((a) => ({ ...a, balance_vnd: computeAccountBalance(s, a.id) }))
}

export async function createAccount(
  data: Omit<AccountRow, 'id' | 'updated_at'>,
): Promise<AccountRow> {
  let row!: AccountRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), updated_at: nowIso() }
    s.accounts.push(row)
  })
  return row
}

export async function updateAccount(
  id: number,
  data: Omit<AccountRow, 'id' | 'updated_at'>,
): Promise<AccountRow | null> {
  let row: AccountRow | null = null
  await updateState((s) => {
    const i = s.accounts.findIndex((a) => a.id === id)
    if (i < 0) return
    row = { ...s.accounts[i]!, ...data, id, updated_at: nowIso() }
    s.accounts[i] = row
  })
  return row
}

export async function deleteAccount(id: number): Promise<boolean> {
  await updateState((s) => {
    s.accounts = s.accounts.filter((a) => a.id !== id)
    // Detach removed account from transactions.
    s.transactions = s.transactions.map((t) => ({
      ...t,
      account_id: t.account_id === id ? null : t.account_id,
      to_account_id: t.to_account_id === id ? null : t.to_account_id,
    }))
  })
  return true
}

/* ------------------------------ Categories ------------------------------- */

export async function listCategories(): Promise<CategoryRow[]> {
  const s = await loadState()
  return [...s.categories].sort((a, b) => a.id - b.id)
}

export async function createCategory(
  data: Omit<CategoryRow, 'id' | 'updated_at'>,
): Promise<CategoryRow> {
  let row!: CategoryRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), updated_at: nowIso() }
    s.categories.push(row)
  })
  return row
}

export async function updateCategory(
  id: number,
  data: Omit<CategoryRow, 'id' | 'updated_at'>,
): Promise<CategoryRow | null> {
  let row: CategoryRow | null = null
  await updateState((s) => {
    const i = s.categories.findIndex((c) => c.id === id)
    if (i < 0) return
    row = { ...s.categories[i]!, ...data, id, updated_at: nowIso() }
    s.categories[i] = row
  })
  return row
}

export async function deleteCategory(id: number): Promise<boolean> {
  await updateState((s) => {
    s.categories = s.categories.filter((c) => c.id !== id && c.parent_id !== id)
  })
  return true
}

/* --------------------------------- Tags ---------------------------------- */

export async function listTags(): Promise<TagRow[]> {
  const s = await loadState()
  return [...s.tags].sort((a, b) => a.id - b.id)
}

export async function createTag(data: Omit<TagRow, 'id' | 'updated_at'>): Promise<TagRow> {
  let row!: TagRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), updated_at: nowIso() }
    s.tags.push(row)
  })
  return row
}

export async function updateTag(
  id: number,
  data: Omit<TagRow, 'id' | 'updated_at'>,
): Promise<TagRow | null> {
  let row: TagRow | null = null
  await updateState((s) => {
    const i = s.tags.findIndex((t) => t.id === id)
    if (i < 0) return
    row = { ...s.tags[i]!, ...data, id, updated_at: nowIso() }
    s.tags[i] = row
  })
  return row
}

export async function deleteTag(id: number): Promise<boolean> {
  await updateState((s) => {
    s.tags = s.tags.filter((t) => t.id !== id)
    s.transactions = s.transactions.map((t) => ({
      ...t,
      tag_ids: t.tag_ids.filter((tid) => tid !== id),
    }))
  })
  return true
}

/* ------------------------------- Recurring ------------------------------- */

export async function listRecurring(): Promise<RecurringRow[]> {
  const s = await loadState()
  return [...s.recurring].sort((a, b) => a.id - b.id)
}

export async function createRecurring(
  data: Omit<RecurringRow, 'id' | 'updated_at'>,
): Promise<RecurringRow> {
  let row!: RecurringRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), updated_at: nowIso() }
    s.recurring.push(row)
  })
  return row
}

export async function updateRecurring(
  id: number,
  data: Omit<RecurringRow, 'id' | 'updated_at'>,
): Promise<RecurringRow | null> {
  let row: RecurringRow | null = null
  await updateState((s) => {
    const i = s.recurring.findIndex((r) => r.id === id)
    if (i < 0) return
    row = { ...s.recurring[i]!, ...data, id, updated_at: nowIso() }
    s.recurring[i] = row
  })
  return row
}

export async function deleteRecurring(id: number): Promise<boolean> {
  await updateState((s) => {
    s.recurring = s.recurring.filter((r) => r.id !== id)
  })
  return true
}

function clampDay(ym: string, day: number): string {
  const [y, m] = ym.split('-').map(Number)
  const daysInMonth = new Date(y!, m!, 0).getDate()
  const d = Math.min(Math.max(1, day || 1), daysInMonth)
  return `${ym}-${String(d).padStart(2, '0')}`
}

/**
 * Post active recurring templates for a month (YYYY-MM), skipping templates
 * already generated for that month. Returns the number of created rows.
 */
export async function generateRecurringForMonth(ym: string): Promise<number> {
  let created = 0
  await updateState((s) => {
    for (const tpl of s.recurring) {
      if (!tpl.active) continue
      const exists = s.transactions.some(
        (t) => t.recurring_id === tpl.id && t.date.startsWith(ym),
      )
      if (exists) continue
      s.transactions.push({
        id: allocId(s),
        date: clampDay(ym, tpl.day_of_month),
        amount_vnd: tpl.amount_vnd,
        category: tpl.category,
        direction: tpl.direction,
        note: tpl.note || tpl.name,
        asset_id: null,
        account_id: tpl.account_id,
        to_account_id: tpl.to_account_id,
        tag_ids: [...tpl.tag_ids],
        recurring_id: tpl.id,
        created_at: nowIso(),
      })
      created++
    }
  })
  return created
}

/* -------------------------------- Budgets -------------------------------- */

export async function listBudgets(): Promise<BudgetRow[]> {
  const s = await loadState()
  return [...s.budgets].sort((a, b) => a.id - b.id)
}

export async function createBudget(
  data: Omit<BudgetRow, 'id' | 'updated_at'>,
): Promise<BudgetRow> {
  let row!: BudgetRow
  await updateState((s) => {
    row = { ...data, id: allocId(s), updated_at: nowIso() }
    s.budgets.push(row)
  })
  return row
}

export async function updateBudget(
  id: number,
  data: Omit<BudgetRow, 'id' | 'updated_at'>,
): Promise<BudgetRow | null> {
  let row: BudgetRow | null = null
  await updateState((s) => {
    const i = s.budgets.findIndex((b) => b.id === id)
    if (i < 0) return
    row = { ...s.budgets[i]!, ...data, id, updated_at: nowIso() }
    s.budgets[i] = row
  })
  return row
}

export async function deleteBudget(id: number): Promise<boolean> {
  await updateState((s) => {
    s.budgets = s.budgets.filter((b) => b.id !== id)
  })
  return true
}

/* ------------------------------- Analytics ------------------------------- */

export type CategorySpend = { category: string; total: number }
export type MonthlyFlow = { ym: string; income: number; expense: number }
export type BudgetProgress = {
  id: number
  category: string
  amount_vnd: number
  spent_vnd: number
  ratio: number
}

export async function spendByCategory(ym?: string): Promise<CategorySpend[]> {
  const s = await loadState()
  const map = new Map<string, number>()
  for (const t of s.transactions) {
    if (t.direction !== 'out') continue
    if (ym && !t.date.startsWith(ym)) continue
    const key = t.category || '(khác)'
    map.set(key, (map.get(key) ?? 0) + Number(t.amount_vnd || 0))
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

export async function monthlyCashflow(months = 6): Promise<MonthlyFlow[]> {
  const s = await loadState()
  const now = new Date()
  const keys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const flows = new Map<string, MonthlyFlow>()
  for (const k of keys) flows.set(k, { ym: k, income: 0, expense: 0 })
  for (const t of s.transactions) {
    const ym = t.date.slice(0, 7)
    const flow = flows.get(ym)
    if (!flow) continue
    const amt = Number(t.amount_vnd || 0)
    if (t.direction === 'in') flow.income += amt
    else if (t.direction === 'out') flow.expense += amt
  }
  return keys.map((k) => flows.get(k)!)
}

export async function budgetProgress(ym: string): Promise<BudgetProgress[]> {
  const s = await loadState()
  const spentByCat = new Map<string, number>()
  for (const t of s.transactions) {
    if (t.direction !== 'out' || !t.date.startsWith(ym)) continue
    const key = t.category || '(khác)'
    spentByCat.set(key, (spentByCat.get(key) ?? 0) + Number(t.amount_vnd || 0))
  }
  return s.budgets.map((b) => {
    const spent = spentByCat.get(b.category) ?? 0
    return {
      id: b.id,
      category: b.category,
      amount_vnd: b.amount_vnd,
      spent_vnd: spent,
      ratio: b.amount_vnd > 0 ? spent / b.amount_vnd : 0,
    }
  })
}

export async function summary() {
  const s = await loadState()
  const assets_total_vnd = s.assets.reduce((a, x) => a + Number(x.current_value_vnd || 0), 0)
  const debts_total_vnd = s.debts.reduce((a, x) => a + Number(x.balance_vnd || 0), 0)
  const accounts_total_vnd = s.accounts.reduce(
    (a, x) => a + computeAccountBalance(s, x.id),
    0,
  )
  return {
    assets_total_vnd,
    debts_total_vnd,
    accounts_total_vnd,
    net_worth_vnd: assets_total_vnd - debts_total_vnd,
    asset_count: s.assets.length,
    debt_count: s.debts.length,
    account_count: s.accounts.length,
    transaction_count: s.transactions.length,
    salary_count: s.salary.length,
  }
}

export async function saveToolRun(
  toolId: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
) {
  let saved!: {
    id: number
    tool_id: string
    input: Record<string, unknown>
    output: Record<string, unknown>
    created_at: string
  }
  await updateState((s) => {
    const row: ToolRunRow = {
      id: allocId(s),
      tool_id: toolId,
      input_json: JSON.stringify(input),
      output_json: JSON.stringify(output),
      created_at: nowIso(),
    }
    s.toolRuns.push(row)
    // Keep last 100 runs
    if (s.toolRuns.length > 100) s.toolRuns = s.toolRuns.slice(-100)
    saved = {
      id: row.id,
      tool_id: toolId,
      input,
      output,
      created_at: row.created_at,
    }
  })
  return saved
}

export async function getSheetsSettings(): Promise<SheetsSettings> {
  return (await loadState()).sheets
}

export async function saveSheetsSettings(partial: Partial<SheetsSettings>): Promise<SheetsSettings> {
  let next!: SheetsSettings
  await updateState((s) => {
    s.sheets = { ...s.sheets, ...partial }
    next = s.sheets
  })
  return next
}

/** Merge imported rows (replace mode or append). */
export async function replaceAllData(payload: {
  assets?: Omit<AssetRow, 'id' | 'updated_at'>[]
  transactions?: Array<Partial<Omit<TxRow, 'id' | 'created_at'>> & { date: string }>
  salary?: Omit<SalaryRow, 'id' | 'created_at'>[]
  debts?: Omit<DebtRow, 'id' | 'updated_at'>[]
  mode?: 'replace' | 'append'
}): Promise<{ assets: number; transactions: number; salary: number; debts: number }> {
  const mode = payload.mode ?? 'replace'
  const counts = { assets: 0, transactions: 0, salary: 0, debts: 0 }
  await updateState((s) => {
    if (mode === 'replace') {
      if (payload.assets) s.assets = []
      if (payload.transactions) s.transactions = []
      if (payload.salary) s.salary = []
      if (payload.debts) s.debts = []
    }
    for (const a of payload.assets ?? []) {
      s.assets.push({ ...a, id: allocId(s), updated_at: nowIso() })
      counts.assets++
    }
    for (const t of payload.transactions ?? []) {
      s.transactions.push({
        date: t.date,
        amount_vnd: Number(t.amount_vnd ?? 0),
        category: t.category ?? '',
        direction: t.direction ?? 'out',
        note: t.note ?? '',
        asset_id: t.asset_id ?? null,
        account_id: t.account_id ?? null,
        to_account_id: t.to_account_id ?? null,
        tag_ids: t.tag_ids ?? [],
        recurring_id: t.recurring_id ?? null,
        id: allocId(s),
        created_at: nowIso(),
      })
      counts.transactions++
    }
    for (const r of payload.salary ?? []) {
      s.salary.push({ ...r, id: allocId(s), created_at: nowIso() })
      counts.salary++
    }
    for (const d of payload.debts ?? []) {
      s.debts.push({ ...d, id: allocId(s), updated_at: nowIso() })
      counts.debts++
    }
  })
  return counts
}

export async function exportSnapshot(): Promise<FinanceState> {
  return structuredClone(await loadState())
}
