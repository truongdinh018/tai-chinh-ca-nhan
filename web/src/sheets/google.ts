/**
 * Google Sheets helpers (public import + Apps Script write-back).
 *
 * Public CSV export is attempted from the browser; if CORS blocks it,
 * users can upload a downloaded CSV or sync via Apps Script webhook.
 */

import { csvToBundle, mergeBundles, type ImportBundle } from './csv'

export type SheetRef = { spreadsheetId: string; gid: string }

export function parseSheetUrl(input: string): SheetRef | null {
  const raw = input.trim()
  if (!raw) return null
  if (/^[a-zA-Z0-9-_]{20,}$/.test(raw) && !raw.includes('/')) {
    return { spreadsheetId: raw, gid: '0' }
  }
  try {
    const u = new URL(raw)
    const m = u.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!m) return null
    const gid = u.hash.match(/gid=(\d+)/)?.[1] || u.searchParams.get('gid') || '0'
    return { spreadsheetId: m[1]!, gid }
  } catch {
    return null
  }
}

export function csvExportUrl(ref: SheetRef): string {
  return `https://docs.google.com/spreadsheets/d/${ref.spreadsheetId}/export?format=csv&gid=${ref.gid}`
}

/** gviz CSV endpoint (sometimes more cache-friendly). */
export function gvizCsvUrl(ref: SheetRef): string {
  return `https://docs.google.com/spreadsheets/d/${ref.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${ref.gid}`
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${url}`)
  const text = await res.text()
  if (text.includes('<!DOCTYPE html') || text.includes('<html')) {
    throw new Error('Google trả HTML thay vì CSV — sheet có thể không public / bị chặn CORS.')
  }
  return text
}

/**
 * Import one public sheet tab as CSV. Tries export then gviz.
 * For multi-entity workbooks, call once per gid or use Apps Script dump.
 */
export async function importPublicSheetCsv(
  urlOrId: string,
  sheetHint?: string,
): Promise<ImportBundle> {
  const ref = parseSheetUrl(urlOrId)
  if (!ref) throw new Error('Link Google Sheet không hợp lệ.')

  const urls = [csvExportUrl(ref), gvizCsvUrl(ref)]
  let lastErr: unknown
  for (const u of urls) {
    try {
      const csv = await fetchText(u)
      return csvToBundle(csv, sheetHint)
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(
    `Không tải được sheet công khai (có thể do CORS). ` +
      `Cách khác: File → Tải CSV rồi import file, hoặc dùng webhook Apps Script. ` +
      `(${lastErr instanceof Error ? lastErr.message : String(lastErr)})`,
  )
}

/** Known tab tags: append `#assets` / `?sheet=debts` hints, or try common gids. */
export async function importPublicWorkbook(urlOrId: string): Promise<ImportBundle> {
  const ref = parseSheetUrl(urlOrId)
  if (!ref) throw new Error('Link Google Sheet không hợp lệ.')

  // Prefer explicit gid in URL; also try sibling tabs 0..3 with hints
  const attempts: { gid: string; hint: string }[] = [
    { gid: ref.gid, hint: '' },
    { gid: '0', hint: 'assets' },
    { gid: '1', hint: 'transactions' },
    { gid: '2', hint: 'salary' },
    { gid: '3', hint: 'debts' },
  ]
  const seen = new Set<string>()
  const parts: ImportBundle[] = []
  const errors: string[] = []

  for (const a of attempts) {
    if (seen.has(a.gid)) continue
    seen.add(a.gid)
    try {
      const bundle = await importPublicSheetCsv(
        `https://docs.google.com/spreadsheets/d/${ref.spreadsheetId}/edit#gid=${a.gid}`,
        a.hint,
      )
      if (bundle.assets || bundle.transactions || bundle.salary || bundle.debts) {
        parts.push(bundle)
      }
    } catch (e) {
      errors.push(a.gid + ': ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const merged = mergeBundles(parts)
  const any =
    (merged.assets?.length ?? 0) +
      (merged.transactions?.length ?? 0) +
      (merged.salary?.length ?? 0) +
      (merged.debts?.length ?? 0) >
    0
  if (!any) {
    throw new Error(
      'Không import được dữ liệu từ sheet. Hãy đặt sheet ở chế độ "Anyone with the link", ' +
        'đặt header đúng (name, type, …) hoặc tải CSV upload. ' +
        errors.slice(0, 2).join(' | '),
    )
  }
  return merged
}

export type WebhookPayload =
  | {
      action: 'upsert_all'
      assets: unknown[]
      transactions: unknown[]
      salary: unknown[]
      debts: unknown[]
    }
  | {
      action: 'append_tool_result'
      tool_id: string
      input: Record<string, unknown>
      output: Record<string, unknown>
      created_at: string
    }
  | { action: 'ping' }

export async function postToAppsScript(
  webhookUrl: string,
  payload: WebhookPayload,
  token = '',
): Promise<{ ok: boolean; message?: string }> {
  if (!webhookUrl.trim()) throw new Error('Chưa cấu hình webhook Apps Script.')
  const u = new URL(webhookUrl.trim())
  if (token) u.searchParams.set('token', token)
  // text/plain avoids CORS preflight; Apps Script still reads postData.contents.
  const headers: Record<string, string> = { 'Content-Type': 'text/plain;charset=utf-8' }

  const res = await fetch(u.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    redirect: 'follow',
  })
  const text = await res.text()
  let data: { ok?: boolean; message?: string } = {}
  try {
    data = JSON.parse(text) as { ok?: boolean; message?: string }
  } catch {
    /* HTML redirect pages from Apps Script */
  }
  if (!res.ok) {
    throw new Error(data.message || `Webhook lỗi HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  return { ok: data.ok !== false, message: data.message || text.slice(0, 200) }
}

/** Pull full dump from Apps Script GET ?action=export */
export async function pullFromAppsScript(
  webhookUrl: string,
  token = '',
): Promise<ImportBundle> {
  const u = new URL(webhookUrl.trim())
  u.searchParams.set('action', 'export')
  if (token) u.searchParams.set('token', token)
  const headers: Record<string, string> = {}
  if (token) headers['X-Sync-Token'] = token
  const res = await fetch(u.toString(), { headers, redirect: 'follow' })
  if (!res.ok) throw new Error(`Không đọc được webhook (HTTP ${res.status})`)
  const data = (await res.json()) as {
    ok?: boolean
    message?: string
    assets?: Record<string, unknown>[]
    transactions?: Record<string, unknown>[]
    salary?: Record<string, unknown>[]
    debts?: Record<string, unknown>[]
  }
  if (data.ok === false) throw new Error(data.message || 'Webhook export thất bại')
  return normalizeWebhookBundle(data)
}

function n(v: unknown, fb = 0): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : fb
}

function str(v: unknown, fb = ''): string {
  return v == null ? fb : String(v)
}

function normalizeWebhookBundle(data: {
  assets?: Record<string, unknown>[]
  transactions?: Record<string, unknown>[]
  salary?: Record<string, unknown>[]
  debts?: Record<string, unknown>[]
}): ImportBundle {
  return {
    assets: (data.assets ?? []).map((r) => ({
      name: str(r.name ?? r.ten, 'item'),
      type: str(r.type ?? r.loai, 'other'),
      quantity: n(r.quantity ?? r.so_luong, 1),
      unit: str(r.unit ?? r.don_vi),
      cost_vnd: n(r.cost_vnd ?? r.gia_von),
      current_value_vnd: n(r.current_value_vnd ?? r.gia_tri),
      note: str(r.note ?? r.ghi_chu),
    })),
    transactions: (data.transactions ?? []).map((r) => ({
      date: str(r.date ?? r.ngay, new Date().toISOString().slice(0, 10)),
      amount_vnd: n(r.amount_vnd ?? r.so_tien),
      category: str(r.category ?? r.danh_muc, 'khac'),
      direction: str(r.direction ?? r.chieu, 'out') === 'in' ? 'in' : 'out',
      note: str(r.note ?? r.ghi_chu),
      asset_id: r.asset_id == null || r.asset_id === '' ? null : n(r.asset_id),
    })),
    salary: (data.salary ?? []).map((r) => ({
      period_ym: str(r.period_ym ?? r.ky),
      gross: n(r.gross ?? r.luong_gross),
      net: n(r.net ?? r.luong_net),
      dependents: n(r.dependents ?? r.phu_thuoc),
      note: str(r.note ?? r.ghi_chu),
    })),
    debts: (data.debts ?? []).map((r) => ({
      name: str(r.name ?? r.ten, 'nợ'),
      principal_vnd: n(r.principal_vnd ?? r.goc),
      balance_vnd: n(r.balance_vnd ?? r.du_no),
      rate_year: n(r.rate_year ?? r.lai_suat),
      note: str(r.note ?? r.ghi_chu),
    })),
  }
}
