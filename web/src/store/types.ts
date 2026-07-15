/** Browser finance data (plain IndexedDB — no login, no SQLite). */

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

export type TxRow = {
  id: number
  date: string
  amount_vnd: number
  category: string
  direction: 'in' | 'out'
  note: string
  asset_id: number | null
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

export type SheetsSettings = {
  /** Public spreadsheet URL or ID used for import */
  importUrl: string
  /** Deployed Apps Script web app URL for write-back */
  webhookUrl: string
  /** Optional shared secret sent as header X-Sync-Token */
  webhookToken: string
}

export type FinanceState = {
  version: 1
  nextId: number
  assets: AssetRow[]
  transactions: TxRow[]
  salary: SalaryRow[]
  debts: DebtRow[]
  toolRuns: ToolRunRow[]
  sheets: SheetsSettings
}

export function emptyState(): FinanceState {
  return {
    version: 1,
    nextId: 1,
    assets: [],
    transactions: [],
    salary: [],
    debts: [],
    toolRuns: [],
    sheets: { importUrl: '', webhookUrl: '', webhookToken: '' },
  }
}

export function nowIso(): string {
  return new Date().toISOString()
}
