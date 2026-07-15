import { Button, Card, Title } from 'animal-island-ui'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { api, type ToolInfo } from '../api/client'
import { HintInButton, HintLabel } from '../components/Hint'
import { useI18n } from '../i18n/I18nContext'
import { explainTool, type Explanation } from '../tools/explain'
import { TOOL_FIELDS, type FieldDef } from '../tools/fields'
import { getToolMeta } from '../tools/meta'
import { prefillFromContext } from '../tools/prefill'
import { TOOL_SAMPLES } from '../tools/samples'

function cloneSample(toolId: string): Record<string, unknown> {
  return structuredClone(TOOL_SAMPLES[toolId] ?? {})
}

function formatMoneyInput(n: unknown): string {
  if (n === null || n === undefined || n === '') return ''
  const x = Number(n)
  if (!Number.isFinite(x)) return String(n)
  return new Intl.NumberFormat('vi-VN').format(x)
}

function parseMoneyInput(raw: string): number | '' {
  const cleaned = raw.replace(/[^\d.-]/g, '')
  if (!cleaned) return ''
  const x = Number(cleaned)
  return Number.isFinite(x) ? x : ''
}

function fieldValueToDisplay(field: FieldDef, value: unknown): string {
  if (value === null || value === undefined) return ''
  if (field.type === 'money') return formatMoneyInput(value)
  if (field.type === 'percent') return String(value)
  if (field.type === 'json') return JSON.stringify(value, null, 2)
  if (field.type === 'bool') return value ? 'true' : 'false'
  return String(value)
}

function applyFieldChange(
  field: FieldDef,
  raw: string | boolean,
  prev: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...prev }
  if (field.type === 'bool') {
    next[field.key] = Boolean(raw)
    return next
  }
  if (typeof raw !== 'string') return next

  if (field.type === 'money') {
    const v = parseMoneyInput(raw)
    if (v === '') delete next[field.key]
    else next[field.key] = v
    return next
  }
  if (field.type === 'number' || field.type === 'percent') {
    if (raw.trim() === '') {
      delete next[field.key]
      return next
    }
    const v = Number(raw)
    if (Number.isFinite(v)) next[field.key] = v
    return next
  }
  if (field.type === 'json') {
    next[`__raw_${field.key}`] = raw
    try {
      next[field.key] = JSON.parse(raw)
    } catch {
      /* keep previous parsed value until JSON becomes valid */
    }
    return next
  }
  next[field.key] = raw
  return next
}

function buildParams(values: Record<string, unknown>, fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    const rawKey = `__raw_${f.key}`
    if (f.type === 'json' && typeof values[rawKey] === 'string') {
      out[f.key] = JSON.parse(values[rawKey] as string)
      continue
    }
    if (values[f.key] !== undefined && values[f.key] !== '') {
      out[f.key] = values[f.key]
    }
  }
  // Keep any sample keys not in schema (forward-compat)
  for (const [k, v] of Object.entries(values)) {
    if (k.startsWith('__raw_')) continue
    if (!(k in out) && v !== undefined && v !== '') out[k] = v
  }
  return out
}

function highlightMetrics(output: unknown): { label: string; value: string }[] {
  if (!output || typeof output !== 'object' || Array.isArray(output)) return []
  const o = output as Record<string, unknown>
  const moneyKeys = [
    'net',
    'gross',
    'thue_tncn',
    'gia_tri_cuoi',
    'so_fire',
    'fire_number',
    'muc_tieu',
    'thieu',
    'tra_thang',
    'monthly',
    'tong_lai',
    'luong_huu_thang',
    'muc_huong_thang',
    'vnd',
    'so_tien_vnd',
  ]
  const items: { label: string; value: string }[] = []
  for (const k of moneyKeys) {
    if (typeof o[k] === 'number') {
      items.push({
        label: k,
        value: new Intl.NumberFormat('vi-VN').format(Math.round(o[k] as number)) + ' ₫',
      })
    }
  }
  if (typeof o.dti === 'number') {
    items.push({ label: 'DTI', value: `${((o.dti as number) * 100).toFixed(1)}%` })
  }
  if (typeof o.diem === 'number') {
    items.push({ label: 'Điểm', value: String(o.diem) })
  }
  return items.slice(0, 6)
}

type ToolsPageProps = {
  focusToolId?: string | null
  onToolNavigate?: (toolId: string) => void
}

export function ToolsPage({ focusToolId, onToolNavigate }: ToolsPageProps) {
  const { t } = useI18n()
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [toolId, setToolId] = useState(focusToolId || 'luong_gross_net')
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    cloneSample(focusToolId || 'luong_gross_net'),
  )
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [rawOutput, setRawOutput] = useState<unknown>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const [lastRun, setLastRun] = useState<{
    tool_id: string
    input: Record<string, unknown>
    output: Record<string, unknown>
    created_at: string
  } | null>(null)

  const fields = useMemo(() => TOOL_FIELDS[toolId] ?? [], [toolId])

  useEffect(() => {
    if (!focusToolId || focusToolId === toolId) return
    setToolId(focusToolId)
    setValues(cloneSample(focusToolId))
    setExplanation(null)
    setRawOutput(null)
    setLastRun(null)
    setError('')
    setInfo('')
    setShowAdvanced(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to external focus
  }, [focusToolId])

  useEffect(() => {
    void api
      .listTools()
      .then((list) => {
        setTools(list)
        if (list.length && !list.find((t) => t.id === toolId)) {
          const first = list[0]!.id
          setToolId(first)
          setValues(cloneSample(first))
        }
      })
      .catch((e) => setError(String(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onToolChange(nextId: string) {
    setToolId(nextId)
    setValues(cloneSample(nextId))
    setExplanation(null)
    setRawOutput(null)
    setLastRun(null)
    setError('')
    setInfo('')
    setShowAdvanced(false)
    onToolNavigate?.(nextId)
  }

  function resetSample() {
    setValues(cloneSample(toolId))
    setExplanation(null)
    setRawOutput(null)
    setLastRun(null)
    setError('')
    setInfo('')
  }

  async function useBrowserData() {
    setError('')
    setInfo('')
    try {
      const ctx = await api.toolContext()
      const { values: next, note } = prefillFromContext(toolId, cloneSample(toolId), ctx)
      setValues(next)
      setInfo(note)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function pushResultToSheet() {
    if (!lastRun) return
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const r = await api.pushToolResultToSheet(lastRun)
      setInfo(r.message || 'Đã ghi kết quả lên Google Sheet (tab tool_results).')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!calculating && !explanation) return
    const id = window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [calculating, explanation])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setExplanation(null)
    setRawOutput(null)
    setLastRun(null)
    setBusy(true)
    setCalculating(true)
    try {
      const params = buildParams(values, fields.length ? fields : Object.keys(values).map((key) => ({
        key,
        label: key,
        type: 'text' as const,
      })))
      const out = await api.runTool(toolId, params)
      setRawOutput(out.output)
      setExplanation(explainTool(toolId, params, out.output))
      setLastRun({
        tool_id: out.tool_id,
        input: out.input,
        output: out.output,
        created_at: out.created_at,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setCalculating(false)
    }
  }

  const categories = [...new Set(tools.map((t) => getToolMeta(t.id)?.categoryKey ?? t.category))]
  const currentTitle = t(`tool.${toolId}`)
  const metrics = highlightMetrics(rawOutput)

  return (
    <div className="page">
      <Title size="middle">{t('tools.title')}</Title>
      <p className="muted page-lead">{t('tools.lead')}</p>
      {error && (
        <pre className="error" style={{ whiteSpace: 'pre-wrap' }}>
          {error}
        </pre>
      )}
      {info && <p className="ok">{info}</p>}
      <Card color="purple" pattern="default" className="form-card">
        <form className="tool-form" onSubmit={onSubmit}>
          <label>
            <HintLabel label={t('tools.pick')} tip={t(`tip.tool.${toolId}`)} />
            <select value={toolId} onChange={(e) => onToolChange(e.target.value)}>
              {categories.map((cat) => (
                <optgroup key={cat} label={cat.startsWith('cat.') ? t(cat) : cat}>
                  {tools
                    .filter((x) => (getToolMeta(x.id)?.categoryKey ?? x.category) === cat)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {getToolMeta(x.id)?.icon ?? '🛠️'} {t(`tool.${x.id}`)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <p className="muted">
            {t('tools.using')} <strong>{currentTitle}</strong>
          </p>

          {fields.length > 0 ? (
            <div className="tool-fields">
              {fields.map((field) => (
                <label key={field.key} className={field.type === 'json' ? 'field-span-2' : undefined}>
                  <HintLabel label={field.label} tip={field.help} />
                  {field.type === 'select' ? (
                    <select
                      value={String(values[field.key] ?? '')}
                      onChange={(e) => setValues((v) => applyFieldChange(field, e.target.value, v))}
                    >
                      {(field.options ?? []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'bool' ? (
                    <span className="bool-row">
                      <input
                        type="checkbox"
                        checked={Boolean(values[field.key])}
                        onChange={(e) => setValues((v) => applyFieldChange(field, e.target.checked, v))}
                      />
                      <span>{values[field.key] ? 'Có' : 'Không'}</span>
                    </span>
                  ) : field.type === 'json' ? (
                    <textarea
                      rows={6}
                      value={
                        typeof values[`__raw_${field.key}`] === 'string'
                          ? String(values[`__raw_${field.key}`])
                          : fieldValueToDisplay(field, values[field.key])
                      }
                      onChange={(e) => setValues((v) => applyFieldChange(field, e.target.value, v))}
                      spellCheck={false}
                    />
                  ) : (
                    <input
                      type="text"
                      inputMode={
                        field.type === 'money' || field.type === 'number' || field.type === 'percent'
                          ? 'decimal'
                          : undefined
                      }
                      value={fieldValueToDisplay(field, values[field.key])}
                      onChange={(e) => setValues((v) => applyFieldChange(field, e.target.value, v))}
                      placeholder={field.optional ? 'Tuỳ chọn' : undefined}
                    />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <p className="muted">{t('tools.noForm')}</p>
          )}

          <details
            className="advanced-json"
            open={showAdvanced || fields.length === 0}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          >
            <summary>
              <HintLabel label={t('tools.advanced')} tip={t('tip.tools.advanced')} />
            </summary>
            <textarea
              rows={8}
              value={JSON.stringify(
                Object.fromEntries(Object.entries(values).filter(([k]) => !k.startsWith('__raw_'))),
                null,
                2,
              )}
              onChange={(e) => {
                try {
                  setValues(JSON.parse(e.target.value) as Record<string, unknown>)
                  setError('')
                } catch {
                  /* ignore while typing */
                }
              }}
              spellCheck={false}
            />
          </details>

          <div className="row-actions">
            <Button htmlType="button" onClick={() => void useBrowserData()}>
              <span className="btn-with-hint">
                {t('tools.useSaved')}
                <HintInButton title={t('tip.tools.useSaved')} />
              </span>
            </Button>
            <Button htmlType="button" onClick={resetSample}>
              {t('tools.reset')}
            </Button>
            <Button htmlType="submit" type="primary" disabled={busy}>
              {busy ? t('tools.running') : t('tools.run')}
            </Button>
          </div>
          <p className="muted">{t('tools.pyodideHint')}</p>
        </form>
      </Card>

      {(calculating || explanation) && (
        <div ref={resultRef} className="result-anchor">
          <Card color="app-teal" pattern="app-teal" className="result-card">
            <Title size="small">{t('tools.result')}</Title>

            {calculating ? (
              <div className="result-loading" role="status" aria-live="polite">
                <span className="result-loading-spin" aria-hidden />
                <p className="result-loading-text">{t('tools.running')}</p>
              </div>
            ) : explanation ? (
              <>
                <p className="result-summary">{explanation.summary}</p>

                {metrics.length > 0 && (
                  <div className="metric-chips">
                    {metrics.map((m) => (
                      <div key={m.label} className="metric-chip">
                        <span className="metric-label">{m.label}</span>
                        <span className="metric-value">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <ol className="explain-steps">
                  {explanation.steps.map((step, i) => (
                    <li key={i}>
                      <div className="step-title">{step.title}</div>
                      <div className="step-detail">{step.detail}</div>
                      {step.value && <div className="step-value">{step.value}</div>}
                    </li>
                  ))}
                </ol>

                <div className="row-actions" style={{ marginTop: '0.75rem' }}>
                  <Button
                    htmlType="button"
                    disabled={busy || !lastRun}
                    onClick={() => void pushResultToSheet()}
                  >
                    <span className="btn-with-hint">
                      {t('tools.pushSheet')}
                      <HintInButton title={t('tip.tools.pushSheet')} />
                    </span>
                  </Button>
                </div>
                <p className="muted">{t('tools.sheetHint')}</p>

                <button type="button" className="linkish" onClick={() => setShowRawJson((v) => !v)}>
                  {showRawJson ? t('tools.hideJson') : t('tools.showJson')}
                </button>
                {showRawJson && <pre className="result-pre">{JSON.stringify(rawOutput, null, 2)}</pre>}
              </>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  )
}
