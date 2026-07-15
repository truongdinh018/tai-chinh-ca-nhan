/** Minimal CSV parse (handles quotes). */

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length)
  if (!lines.length) return { headers: [], rows: [] }

  const cells = (line: string): string[] => {
    const out: string[] = []
    let cur = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"'
          i++
        } else q = !q
      } else if (ch === ',' && !q) {
        out.push(cur.trim())
        cur = ''
      } else cur += ch
    }
    out.push(cur.trim())
    return out
  }

  const headers = cells(lines[0]!).map((h) => h.toLowerCase().replace(/\s+/g, '_'))
  const rows = lines.slice(1).map((line) => {
    const cols = cells(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? ''
    })
    return row
  })
  return { headers, rows }
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => esc(row[h])).join(','))
  }
  return lines.join('\n')
}

function num(v: string | undefined, fallback = 0): number {
  if (v == null || v === '') return fallback
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : fallback
}

export type ImportBundle = {
  assets?: {
    name: string
    type: string
    quantity: number
    unit: string
    cost_vnd: number
    current_value_vnd: number
    note: string
  }[]
  transactions?: {
    date: string
    amount_vnd: number
    category: string
    direction: 'in' | 'out'
    note: string
    asset_id: number | null
  }[]
  salary?: {
    period_ym: string
    gross: number
    net: number
    dependents: number
    note: string
  }[]
  debts?: {
    name: string
    principal_vnd: number
    balance_vnd: number
    rate_year: number
    note: string
  }[]
}

function detectKind(headers: string[], hint?: string): keyof ImportBundle | null {
  const h = new Set(headers)
  const name = (hint || '').toLowerCase()
  if (name.includes('asset') || name.includes('tai_san') || name.includes('taisăn')) return 'assets'
  if (name.includes('debt') || name.includes('no') || name.includes('nợ')) return 'debts'
  if (name.includes('salary') || name.includes('luong') || name.includes('lương')) return 'salary'
  if (name.includes('tx') || name.includes('transaction') || name.includes('giao')) return 'transactions'

  if (h.has('current_value_vnd') || (h.has('name') && h.has('type') && h.has('quantity'))) return 'assets'
  if (h.has('balance_vnd') || h.has('principal_vnd') || h.has('rate_year')) return 'debts'
  if (h.has('period_ym') || (h.has('gross') && h.has('net'))) return 'salary'
  if (h.has('amount_vnd') || h.has('direction') || (h.has('date') && h.has('category'))) {
    return 'transactions'
  }
  return null
}

export function csvToBundle(csvText: string, sheetHint?: string): ImportBundle {
  const { headers, rows } = parseCsv(csvText)
  const kind = detectKind(headers, sheetHint)
  const bundle: ImportBundle = {}
  if (!kind || !rows.length) return bundle

  if (kind === 'assets') {
    bundle.assets = rows.map((r) => ({
      name: r.name || r.ten || 'item',
      type: r.type || r.loai || 'other',
      quantity: num(r.quantity ?? r.so_luong, 1),
      unit: r.unit || r.don_vi || '',
      cost_vnd: num(r.cost_vnd ?? r.gia_von),
      current_value_vnd: num(r.current_value_vnd ?? r.gia_tri),
      note: r.note || r.ghi_chu || '',
    }))
  } else if (kind === 'debts') {
    bundle.debts = rows.map((r) => ({
      name: r.name || r.ten || 'nợ',
      principal_vnd: num(r.principal_vnd ?? r.goc),
      balance_vnd: num(r.balance_vnd ?? r.du_no),
      rate_year: num(r.rate_year ?? r.lai_suat),
      note: r.note || r.ghi_chu || '',
    }))
  } else if (kind === 'salary') {
    bundle.salary = rows.map((r) => ({
      period_ym: r.period_ym || r.ky || '',
      gross: num(r.gross || r.luong_gross),
      net: num(r.net || r.luong_net),
      dependents: num(r.dependents ?? r.phu_thuoc, 0),
      note: r.note || r.ghi_chu || '',
    }))
  } else if (kind === 'transactions') {
    bundle.transactions = rows.map((r) => ({
      date: r.date || r.ngay || new Date().toISOString().slice(0, 10),
      amount_vnd: num(r.amount_vnd ?? r.so_tien),
      category: r.category || r.danh_muc || 'khac',
      direction: (r.direction || r.chieu || 'out') === 'in' ? 'in' : 'out',
      note: r.note || r.ghi_chu || '',
      asset_id: r.asset_id ? num(r.asset_id) : null,
    }))
  }
  return bundle
}

export function mergeBundles(parts: ImportBundle[]): ImportBundle {
  const out: ImportBundle = {}
  for (const p of parts) {
    if (p.assets?.length) out.assets = [...(out.assets ?? []), ...p.assets]
    if (p.transactions?.length) {
      out.transactions = [...(out.transactions ?? []), ...p.transactions]
    }
    if (p.salary?.length) out.salary = [...(out.salary ?? []), ...p.salary]
    if (p.debts?.length) out.debts = [...(out.debts ?? []), ...p.debts]
  }
  return out
}
