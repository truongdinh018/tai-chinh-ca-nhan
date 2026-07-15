import { Button, Card, Title } from 'animal-island-ui'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import {
  downloadCsvExport,
  downloadExcelExport,
  downloadJsonExport,
  downloadPdfExport,
} from '../export/formats'
import { countLabel, type ExportScope } from '../export/tables'
import { useI18n } from '../i18n/I18nContext'
import { notifyError, notifySuccess } from '../notify'
import type { FinanceState } from '../store/types'

const SCOPES: { value: ExportScope; labelKey: string }[] = [
  { value: 'all', labelKey: 'export.scope.all' },
  { value: 'assets', labelKey: 'export.scope.assets' },
  { value: 'transactions', labelKey: 'export.scope.tx' },
  { value: 'salary', labelKey: 'export.scope.salary' },
  { value: 'debts', labelKey: 'export.scope.debts' },
]

export function ExportPage() {
  const { t } = useI18n()
  const [state, setState] = useState<FinanceState | null>(null)
  const [scope, setScope] = useState<ExportScope>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function refresh() {
    const snap = await api.exportSnapshot()
    setState(snap)
  }

  useEffect(() => {
    void refresh().catch((e) => setError(String(e)))
  }, [])

  async function run(kind: 'json' | 'csv' | 'excel' | 'pdf') {
    if (!state) return
    setBusy(kind)
    setError('')
    try {
      const snap = await api.exportSnapshot()
      setState(snap)
      if (kind === 'json') await downloadJsonExport(snap, scope)
      else if (kind === 'csv') await downloadCsvExport(snap, scope)
      else if (kind === 'excel') await downloadExcelExport(snap, scope)
      else await downloadPdfExport(snap, scope)
      notifySuccess(t('export.done'), t(`export.format.${kind}`))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError(t('export.fail'), msg)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">{t('export.title')}</Title>
        <Button disabled={busy != null} onClick={() => void refresh()}>
          {t('export.refresh')}
        </Button>
      </div>
      <p className="muted">{t('export.intro')}</p>
      {state ? <p className="muted">{countLabel(state)}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <Card color="purple" pattern="default" className="form-card">
        <Title size="small">{t('export.scopeTitle')}</Title>
        <div className="export-scope" role="radiogroup" aria-label={t('export.scopeTitle')}>
          {SCOPES.map((s) => (
            <label key={s.value} className={`export-scope-chip${scope === s.value ? ' is-active' : ''}`}>
              <input
                type="radio"
                name="export-scope"
                value={s.value}
                checked={scope === s.value}
                onChange={() => setScope(s.value)}
              />
              {t(s.labelKey)}
            </label>
          ))}
        </div>
      </Card>

      <div className="export-grid">
        <Card color="app-teal" pattern="app-teal" className="form-card export-card">
          <Title size="small">{t('export.format.json')}</Title>
          <p className="muted">{t('export.desc.json')}</p>
          <Button type="primary" disabled={busy != null} onClick={() => void run('json')}>
            {busy === 'json' ? t('export.working') : t('export.downloadJson')}
          </Button>
        </Card>

        <Card color="app-orange" pattern="app-orange" className="form-card export-card">
          <Title size="small">{t('export.format.excel')}</Title>
          <p className="muted">{t('export.desc.excel')}</p>
          <Button type="primary" disabled={busy != null} onClick={() => void run('excel')}>
            {busy === 'excel' ? t('export.working') : t('export.downloadExcel')}
          </Button>
        </Card>

        <Card color="purple" pattern="default" className="form-card export-card">
          <Title size="small">{t('export.format.csv')}</Title>
          <p className="muted">{t('export.desc.csv')}</p>
          <Button type="primary" disabled={busy != null} onClick={() => void run('csv')}>
            {busy === 'csv' ? t('export.working') : t('export.downloadCsv')}
          </Button>
        </Card>

        <Card color="app-blue" pattern="app-blue" className="form-card export-card">
          <Title size="small">{t('export.format.pdf')}</Title>
          <p className="muted">{t('export.desc.pdf')}</p>
          <Button type="primary" disabled={busy != null} onClick={() => void run('pdf')}>
            {busy === 'pdf' ? t('export.working') : t('export.downloadPdf')}
          </Button>
        </Card>
      </div>
    </div>
  )
}
