import type { FinanceState } from '../store/types'
import { downloadBlob, exportStamp } from './downloadBlob'
import {
  countLabel,
  listExportTables,
  tablesToCsvBlob,
  toImportableJson,
  type ExportScope,
} from './tables'

function formatVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)
}

export async function downloadJsonExport(state: FinanceState, scope: ExportScope = 'all') {
  const text = toImportableJson(state, scope)
  const suffix = scope === 'all' ? 'all' : scope
  downloadBlob(
    new Blob([text], { type: 'application/json;charset=utf-8' }),
    `${exportStamp(`tai-chinh-${suffix}`)}.json`,
  )
}

export async function downloadCsvExport(state: FinanceState, scope: ExportScope = 'all') {
  const tables = listExportTables(state, scope)
  if (!tables.length) throw new Error('Không có dữ liệu để xuất')
  const suffix = scope === 'all' ? 'all' : scope
  downloadBlob(tablesToCsvBlob(tables), `${exportStamp(`tai-chinh-${suffix}`)}.csv`)
}

export async function downloadExcelExport(state: FinanceState, scope: ExportScope = 'all') {
  const XLSX = await import('xlsx')
  const tables = listExportTables(state, scope)
  if (!tables.length) throw new Error('Không có dữ liệu để xuất')

  const wb = XLSX.utils.book_new()
  for (const t of tables) {
    const aoa: unknown[][] = [t.headers]
    for (const row of t.rows) {
      aoa.push(t.headers.map((h) => row[h] ?? ''))
    }
    const sheet = XLSX.utils.aoa_to_sheet(aoa)
    const name = t.title.slice(0, 31)
    XLSX.utils.book_append_sheet(wb, sheet, name)
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const suffix = scope === 'all' ? 'all' : scope
  downloadBlob(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${exportStamp(`tai-chinh-${suffix}`)}.xlsx`,
  )
}

export async function downloadPdfExport(state: FinanceState, scope: ExportScope = 'all') {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const autoTable = autoTableMod.default
  const tables = listExportTables(state, scope)
  if (!tables.length) throw new Error('Không có dữ liệu để xuất')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const stamp = new Date().toLocaleString('vi-VN')

  doc.setFontSize(16)
  doc.text('Báo cáo tài chính cá nhân', 40, 40)
  doc.setFontSize(10)
  doc.text(`Xuất lúc: ${stamp}`, 40, 58)
  doc.text(countLabel(state), 40, 72)

  const assetsTotal = state.assets.reduce((s, a) => s + (a.current_value_vnd || 0), 0)
  const debtsTotal = state.debts.reduce((s, d) => s + (d.balance_vnd || 0), 0)
  doc.text(
    `Tài sản: ${formatVnd(assetsTotal)} · Nợ: ${formatVnd(debtsTotal)} · Ròng: ${formatVnd(assetsTotal - debtsTotal)}`,
    40,
    86,
  )

  let startY = 110
  for (const t of tables) {
    if (startY > 500) {
      doc.addPage()
      startY = 40
    }
    doc.setFontSize(12)
    doc.text(`${t.title} (${t.rows.length})`, 40, startY)
    startY += 8

    const displayHeaders = t.headers.filter((h) => h !== 'id' && !h.endsWith('_at'))
    autoTable(doc, {
      startY: startY + 4,
      head: [displayHeaders],
      body: t.rows.map((row) => displayHeaders.map((h) => String(row[h] ?? ''))),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [45, 140, 140] },
      margin: { left: 40, right: 40 },
    })
    const finalY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY
    startY = finalY + 28
  }

  const suffix = scope === 'all' ? 'all' : scope
  doc.save(`${exportStamp(`tai-chinh-${suffix}`)}.pdf`)
}
