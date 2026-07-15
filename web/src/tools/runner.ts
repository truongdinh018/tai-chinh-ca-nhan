/** Tool catalog + hardened Pyodide runner for all tools. */

import { TOOL_SAMPLES } from './samples'

export type ToolInfo = {
  id: string
  title: string
  category: string
  status: string
}

export const TOOL_CATALOG: ToolInfo[] = [
  { id: 'luong_gross_net', title: 'Tính Lương Gross ↔ Net (2 chiều)', category: 'Lương - Bảo Hiểm - Thuế', status: 'live' },
  { id: 'quyet_toan_tncn', title: 'Quyết Toán Thuế TNCN', category: 'Lương - Bảo Hiểm - Thuế', status: 'live' },
  { id: 'bao_hiem_that_nghiep', title: 'Bảo Hiểm Thất Nghiệp', category: 'Lương - Bảo Hiểm - Thuế', status: 'live' },
  { id: 'bao_hiem_huu_tri', title: 'Bảo Hiểm Hưu Trí (ước lượng)', category: 'Lương - Bảo Hiểm - Thuế', status: 'live' },
  { id: 'gia_vang_loi_lo', title: 'Giá Vàng/Bạc — Lãi/Lỗ Holding', category: 'Đầu Tư - Tiết Kiệm', status: 'live' },
  { id: 'dca', title: 'Đầu Tư Định Kỳ DCA vs Lump Sum', category: 'Đầu Tư - Tiết Kiệm', status: 'live' },
  { id: 'quy_du_phong', title: 'Quỹ Dự Phòng Khẩn Cấp', category: 'Đầu Tư - Tiết Kiệm', status: 'live' },
  { id: 'ty_gia', title: 'Quy Đổi Tỷ Giá Ngoại Tệ', category: 'Đầu Tư - Tiết Kiệm', status: 'live' },
  { id: 'so_sanh_dau_tu_vs_tiet_kiem', title: 'So Sánh Đầu Tư vs Tiết Kiệm', category: 'Đầu Tư - Tiết Kiệm', status: 'live' },
  { id: 'tiet_kiem_vs_lam_phat', title: 'Tiết Kiệm vs Lạm Phát', category: 'Đầu Tư - Tiết Kiệm', status: 'live' },
  { id: 'diem_suc_khoe', title: 'Điểm Sức Khỏe Tài Chính', category: 'Bảo Vệ - Rủi Ro', status: 'live' },
  { id: 'rui_ro_tai_chinh', title: 'Đánh Giá Rủi Ro Tài Chính Cá Nhân', category: 'Bảo Vệ - Rủi Ro', status: 'live' },
  { id: 'fire', title: 'FIRE Calculator', category: 'FIRE - Nghỉ Hưu', status: 'live' },
  { id: 'barista_fire', title: 'Barista FIRE', category: 'FIRE - Nghỉ Hưu', status: 'live' },
  { id: 'mua_vs_thue_nha', title: 'So Sánh Mua Nhà vs Thuê Nhà', category: 'Vay - Nhà - Xe', status: 'live' },
  { id: 'ty_le_no_dti', title: 'Tỷ Lệ Nợ An Toàn (DTI)', category: 'Vay - Nhà - Xe', status: 'live' },
  { id: 'snowball_avalanche', title: 'Trả Nợ Snowball vs Avalanche', category: 'Vay - Nhà - Xe', status: 'live' },
  { id: 'vay_mua_xe', title: 'Tính Tiền Vay Mua Xe', category: 'Vay - Nhà - Xe', status: 'live' },
  { id: 'so_sanh_khoan_vay', title: 'So Sánh Các Khoản Vay', category: 'Vay - Nhà - Xe', status: 'live' },
  { id: 'lai_the_tin_dung', title: 'Tính Lãi Thẻ Tín Dụng', category: 'Vay - Nhà - Xe', status: 'live' },
  { id: 'appreciation_bds', title: 'Appreciation & Depreciation BĐS', category: 'Vay - Nhà - Xe', status: 'live' },
  { id: 'chi_phi_nuoi_con', title: 'Chi Phí Nuôi Con (0–18)', category: 'Gia Đình - Giáo Dục', status: 'live' },
]

type PyodideInterface = {
  FS: {
    mkdirTree: (path: string) => void
    writeFile: (path: string, data: string | Uint8Array) => void
  }
  runPythonAsync: (code: string) => Promise<unknown>
}

let pyodide: PyodideInterface | null = null
let pyReady = false

function pyBase(): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return new URL('py/tools/', window.location.origin + normalized).href
}

async function loadScript(src: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Không tải được ${src}`))
    document.head.appendChild(s)
  })
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Thiếu file tool: ${path}`)
  return res.text()
}

async function mountToolsPackage(py: PyodideInterface): Promise<void> {
  const base = pyBase()
  const files = [
    '__init__.py',
    'common.py',
    'tax_vn_2026.py',
    ...TOOL_CATALOG.map((t) => `${t.id}.py`),
  ]
  py.FS.mkdirTree('/py/tools')
  for (const f of [...new Set(files)]) {
    const text = await fetchText(`${base}${f}`)
    py.FS.writeFile(`/py/tools/${f}`, text)
  }
}

async function ensurePyodide(): Promise<PyodideInterface> {
  if (pyodide && pyReady) return pyodide
  const indexURL = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/'
  if (!(window as unknown as { loadPyodide?: unknown }).loadPyodide) {
    await loadScript(`${indexURL}pyodide.js`)
  }
  const loadPyodide = (
    window as unknown as {
      loadPyodide: (o: { indexURL: string }) => Promise<PyodideInterface>
    }
  ).loadPyodide
  pyodide = await loadPyodide({ indexURL })
  await mountToolsPackage(pyodide)
  await pyodide.runPythonAsync(`
import sys
if '/py' not in sys.path:
    sys.path.insert(0, '/py')
`)
  pyReady = true
  return pyodide
}

function humanizePythonError(toolId: string, err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err)
  const sample = TOOL_SAMPLES[toolId]
  const sampleHint = sample
    ? `\nParams mẫu:\n${JSON.stringify(sample, null, 2)}`
    : ''
  if (raw.includes('unexpected keyword argument')) {
    const m = raw.match(/unexpected keyword argument '([^']+)'/)
    const bad = m?.[1] ?? '?'
    return new Error(
      `Tham số "${bad}" không thuộc tool "${toolId}". Bấm "Reset mẫu" hoặc đổi tool để nạp JSON đúng.${sampleHint}`,
    )
  }
  if (raw.includes('required positional argument') || raw.includes('missing')) {
    return new Error(`Thiếu tham số bắt buộc cho "${toolId}".${sampleHint}\n\nChi tiết: ${raw}`)
  }
  return new Error(raw)
}

export async function runPythonTool(
  toolId: string,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!TOOL_CATALOG.find((t) => t.id === toolId)) {
    throw new Error(`Không có tool \`${toolId}\``)
  }
  const py = await ensurePyodide()
  // Refresh tool file + shared deps (picks up local edits in dev)
  const base = pyBase()
  for (const f of ['__init__.py', 'common.py', 'tax_vn_2026.py', `${toolId}.py`]) {
    py.FS.writeFile(`/py/tools/${f}`, await fetchText(`${base}${f}`))
  }

  const paramsJson = JSON.stringify(params)
  const code = `
import importlib, inspect, json, sys

# Drop cached modules so remounted files are used
for _name in list(sys.modules):
    if _name == "tools" or _name.startswith("tools."):
        del sys.modules[_name]

from tools.${toolId} import calculate
_params = json.loads(${JSON.stringify(paramsJson)})
_sig = inspect.signature(calculate)
_allowed = set(_sig.parameters)
_unknown = sorted(set(_params) - _allowed)
_filtered = {k: v for k, v in _params.items() if k in _allowed}
_missing = [
    p.name for p in _sig.parameters.values()
    if p.default is inspect.Parameter.empty
    and p.kind in (inspect.Parameter.POSITIONAL_OR_KEYWORD, inspect.Parameter.KEYWORD_ONLY)
    and p.name not in _filtered
]
if _missing:
    raise TypeError("missing required arguments: " + ", ".join(_missing))
_result = calculate(**_filtered)
if not isinstance(_result, dict):
    _result = {"result": _result}
if _unknown:
    _result = {**_result, "_dropped_params": _unknown, "_note": "Các key không thuộc tool đã bỏ qua"}
json.dumps(_result, ensure_ascii=False, default=str)
`
  try {
    const raw = await py.runPythonAsync(code)
    return JSON.parse(String(raw)) as Record<string, unknown>
  } catch (err) {
    throw humanizePythonError(toolId, err)
  }
}
