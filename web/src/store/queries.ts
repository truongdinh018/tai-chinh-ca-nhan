import { loadState, updateState } from './db'
import {
  nowIso,
  type AssetRow,
  type DebtRow,
  type FinanceState,
  type SalaryRow,
  type SheetsSettings,
  type ToolRunRow,
  type TxRow,
} from './types'

export type {
  AssetRow,
  DebtRow,
  SalaryRow,
  SheetsSettings,
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

export async function summary() {
  const s = await loadState()
  const assets_total_vnd = s.assets.reduce((a, x) => a + Number(x.current_value_vnd || 0), 0)
  const debts_total_vnd = s.debts.reduce((a, x) => a + Number(x.balance_vnd || 0), 0)
  return {
    assets_total_vnd,
    debts_total_vnd,
    net_worth_vnd: assets_total_vnd - debts_total_vnd,
    asset_count: s.assets.length,
    debt_count: s.debts.length,
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
  transactions?: Omit<TxRow, 'id' | 'created_at'>[]
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
      s.transactions.push({ ...t, id: allocId(s), created_at: nowIso() })
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
