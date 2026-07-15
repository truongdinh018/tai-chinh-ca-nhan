/**
 * Browser-local finance API — no login, no SQLite.
 * Data in IndexedDB; optional Google Sheets sync via public link / Apps Script.
 */

import { clearState, loadState } from '../store/db'
import * as q from '../store/queries'
import { csvToBundle, toCsv } from '../sheets/csv'
import {
  importPublicWorkbook,
  postToAppsScript,
  pullFromAppsScript,
} from '../sheets/google'
import { normalizeImportBundle, parseImportJson } from '../data/importJson'
import { TOOL_CATALOG, runPythonTool } from '../tools/runner'

export type Asset = q.AssetRow
export type Transaction = q.TxRow
export type Salary = q.SalaryRow
export type Debt = q.DebtRow
export type Summary = Awaited<ReturnType<typeof q.summary>>
export type ToolInfo = (typeof TOOL_CATALOG)[number]
export type SheetsSettings = q.SheetsSettings

function sampleAssetsUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  return new URL('samples/assets.csv', window.location.origin + base).href
}

export const api = {
  /** Always ready — kept for compatibility. */
  status: async () => {
    await loadState()
    return { setup_required: false, unlocked: true }
  },

  summary: () => q.summary(),

  importSamples: async () => {
    const res = await fetch(sampleAssetsUrl())
    if (!res.ok) throw new Error('Không tải được sample assets')
    const csv = await res.text()
    const bundle = csvToBundle(csv, 'assets')
    const counts = await q.replaceAllData({ ...bundle, mode: 'append' })
    return { imported: counts.assets }
  },

  importJson: async (
    rawOrBundle: string | Record<string, unknown>,
    mode: 'replace' | 'append' = 'replace',
  ) => {
    const bundle =
      typeof rawOrBundle === 'string'
        ? parseImportJson(rawOrBundle)
        : parseImportJson(JSON.stringify(rawOrBundle))
    const normalized = normalizeImportBundle(bundle)
    return q.replaceAllData({ ...normalized, mode })
  },

  listAssets: () => q.listAssets(),
  createAsset: (data: Omit<Asset, 'id' | 'updated_at'>) => q.createAsset(data),
  updateAsset: async (id: number, data: Omit<Asset, 'id' | 'updated_at'>) => {
    const row = await q.updateAsset(id, data)
    if (!row) throw new Error('Asset not found')
    return row
  },
  deleteAsset: async (id: number) => {
    await q.deleteAsset(id)
    return { ok: true }
  },

  listTransactions: () => q.listTransactions(),
  createTransaction: (data: Omit<Transaction, 'id' | 'created_at'>) =>
    q.createTransaction(data),
  updateTransaction: async (id: number, data: Omit<Transaction, 'id' | 'created_at'>) => {
    const row = await q.updateTransaction(id, data)
    if (!row) throw new Error('Transaction not found')
    return row
  },
  deleteTransaction: async (id: number) => {
    await q.deleteTransaction(id)
    return { ok: true }
  },

  listSalary: () => q.listSalary(),
  createSalary: (data: Omit<Salary, 'id' | 'created_at'>) => q.createSalary(data),
  updateSalary: async (id: number, data: Omit<Salary, 'id' | 'created_at'>) => {
    const row = await q.updateSalary(id, data)
    if (!row) throw new Error('Salary not found')
    return row
  },
  deleteSalary: async (id: number) => {
    await q.deleteSalary(id)
    return { ok: true }
  },

  listDebts: () => q.listDebts(),
  createDebt: (data: Omit<Debt, 'id' | 'updated_at'>) => q.createDebt(data),
  updateDebt: async (id: number, data: Omit<Debt, 'id' | 'updated_at'>) => {
    const row = await q.updateDebt(id, data)
    if (!row) throw new Error('Debt not found')
    return row
  },
  deleteDebt: async (id: number) => {
    await q.deleteDebt(id)
    return { ok: true }
  },

  listTools: async () => TOOL_CATALOG,

  runTool: async (id: string, params: Record<string, unknown>) => {
    const output = await runPythonTool(id, params)
    return q.saveToolRun(id, params, output)
  },

  getSheetsSettings: () => q.getSheetsSettings(),
  saveSheetsSettings: (partial: Partial<SheetsSettings>) => q.saveSheetsSettings(partial),

  importCsvText: async (csvText: string, hint?: string, mode: 'replace' | 'append' = 'append') => {
    const bundle = csvToBundle(csvText, hint)
    return q.replaceAllData({ ...bundle, mode })
  },

  importGoogleSheet: async (url: string, mode: 'replace' | 'append' = 'replace') => {
    const settings = await q.getSheetsSettings()
    await q.saveSheetsSettings({ importUrl: url })
    // Prefer Apps Script full dump when webhook configured with same sheet
    if (settings.webhookUrl) {
      try {
        const bundle = await pullFromAppsScript(settings.webhookUrl, settings.webhookToken)
        return q.replaceAllData({ ...bundle, mode })
      } catch {
        /* fall through to public CSV */
      }
    }
    const bundle = await importPublicWorkbook(url)
    return q.replaceAllData({ ...bundle, mode })
  },

  pullViaWebhook: async (mode: 'replace' | 'append' = 'replace') => {
    const s = await q.getSheetsSettings()
    const bundle = await pullFromAppsScript(s.webhookUrl, s.webhookToken)
    return q.replaceAllData({ ...bundle, mode })
  },

  pushAllToSheet: async () => {
    const s = await q.getSheetsSettings()
    const snap = await q.exportSnapshot()
    return postToAppsScript(
      s.webhookUrl,
      {
        action: 'upsert_all',
        assets: snap.assets,
        transactions: snap.transactions,
        salary: snap.salary,
        debts: snap.debts,
      },
      s.webhookToken,
    )
  },

  pushToolResultToSheet: async (run: {
    tool_id: string
    input: Record<string, unknown>
    output: Record<string, unknown>
    created_at: string
  }) => {
    const s = await q.getSheetsSettings()
    return postToAppsScript(
      s.webhookUrl,
      {
        action: 'append_tool_result',
        tool_id: run.tool_id,
        input: run.input,
        output: run.output,
        created_at: run.created_at,
      },
      s.webhookToken,
    )
  },

  pingWebhook: async () => {
    const s = await q.getSheetsSettings()
    return postToAppsScript(s.webhookUrl, { action: 'ping' }, s.webhookToken)
  },

  downloadCsv: async (kind: 'assets' | 'transactions' | 'salary' | 'debts') => {
    const snap = await q.exportSnapshot()
    const map = {
      assets: {
        headers: [
          'name',
          'type',
          'quantity',
          'unit',
          'cost_vnd',
          'current_value_vnd',
          'note',
        ],
        rows: snap.assets as unknown as Record<string, unknown>[],
      },
      transactions: {
        headers: ['date', 'amount_vnd', 'category', 'direction', 'note', 'asset_id'],
        rows: snap.transactions as unknown as Record<string, unknown>[],
      },
      salary: {
        headers: ['period_ym', 'gross', 'net', 'dependents', 'note'],
        rows: snap.salary as unknown as Record<string, unknown>[],
      },
      debts: {
        headers: ['name', 'principal_vnd', 'balance_vnd', 'rate_year', 'note'],
        rows: snap.debts as unknown as Record<string, unknown>[],
      },
    }[kind]
    const csv = toCsv(map.headers, map.rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${kind}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  },

  clearAll: () => clearState(),

  /** Full IndexedDB snapshot for export downloads. */
  exportSnapshot: () => q.exportSnapshot(),

  /** Prefill helpers for tools from latest browser data. */
  toolContext: async () => {
    const [salary, debts, assets, summary] = await Promise.all([
      q.listSalary(),
      q.listDebts(),
      q.listAssets(),
      q.summary(),
    ])
    const latest = salary[0]
    return {
      latestSalary: latest ?? null,
      debts,
      assets,
      summary,
    }
  },
}

export function formatVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)
}
