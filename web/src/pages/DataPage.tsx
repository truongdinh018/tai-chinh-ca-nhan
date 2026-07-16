import { Button, Card, CodeBlock, Title } from 'animal-island-ui'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/I18nContext'
import { notifyError, notifySuccess } from '../notify'
import { APPS_SCRIPT_SOURCE } from '../sheets/appsScriptTemplate'
import {
  downloadCsvExport,
  downloadExcelExport,
  downloadJsonExport,
  downloadPdfExport,
} from '../export/formats'
import { countLabel, type ExportScope } from '../export/tables'
import type { FinanceState, SheetsSettings } from '../store/types'

const SCOPES: { value: ExportScope; labelKey: string }[] = [
  { value: 'all', labelKey: 'export.scope.all' },
  { value: 'assets', labelKey: 'export.scope.assets' },
  { value: 'transactions', labelKey: 'export.scope.tx' },
  { value: 'salary', labelKey: 'export.scope.salary' },
  { value: 'debts', labelKey: 'export.scope.debts' },
]

export function DataPage({ onLockChange }: { onLockChange?: (enabled: boolean) => void }) {
  const { t } = useI18n()
  return (
    <div className="page">
      <Title size="middle">{t('tab.data')}</Title>
      <p className="muted">{t('data.intro')}</p>
      <ExportSection />
      <CsvImportSection />
      <SyncSection />
      <LockSection onLockChange={onLockChange} />
    </div>
  )
}

/* -------------------------------- Export --------------------------------- */

function ExportSection() {
  const { t } = useI18n()
  const [state, setState] = useState<FinanceState | null>(null)
  const [scope, setScope] = useState<ExportScope>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function refresh() {
    setState(await api.exportSnapshot())
  }

  useEffect(() => {
    void refresh().catch((e) => setError(String(e)))
  }, [])

  async function run(kind: 'json' | 'csv' | 'excel' | 'pdf') {
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
    <Card color="purple" pattern="default" className="form-card data-section">
      <Title size="small">{t('export.title')}</Title>
      <p className="muted">{t('export.intro')}</p>
      {state ? <p className="muted">{countLabel(state)}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="export-scope" role="radiogroup" aria-label={t('export.scopeTitle')}>
        {SCOPES.map((s) => (
          <label
            key={s.value}
            className={`export-scope-chip${scope === s.value ? ' is-active' : ''}`}
          >
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

      <div className="row-actions" style={{ marginTop: '0.75rem' }}>
        <Button type="primary" disabled={busy != null} onClick={() => void run('json')}>
          {busy === 'json' ? t('export.working') : t('export.downloadJson')}
        </Button>
        <Button disabled={busy != null} onClick={() => void run('excel')}>
          {busy === 'excel' ? t('export.working') : t('export.downloadExcel')}
        </Button>
        <Button disabled={busy != null} onClick={() => void run('csv')}>
          {busy === 'csv' ? t('export.working') : t('export.downloadCsv')}
        </Button>
        <Button disabled={busy != null} onClick={() => void run('pdf')}>
          {busy === 'pdf' ? t('export.working') : t('export.downloadPdf')}
        </Button>
      </div>
    </Card>
  )
}

/* ------------------------------ CSV import ------------------------------- */

function CsvImportSection() {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [hint, setHint] = useState('')
  const [mode, setMode] = useState<'append' | 'replace'>('append')
  const [busy, setBusy] = useState(false)

  async function onPick(file: File | null) {
    if (!file) return
    setBusy(true)
    try {
      const text = await file.text()
      const counts = await api.importCsvText(text, hint || file.name, mode)
      notifySuccess(
        t('data.csv.done'),
        t('dash.importJson.doneDetail', {
          a: counts.assets,
          t: counts.transactions,
          s: counts.salary,
          d: counts.debts,
        }),
      )
    } catch (err) {
      notifyError(t('data.csv.fail'), err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Card color="app-green" pattern="app-green" className="form-card data-section">
      <Title size="small">{t('data.csv.title')}</Title>
      <p className="muted">{t('data.csv.lead')}</p>
      <div className="grid-form">
        <label>
          {t('data.csv.hint')}
          <select value={hint} onChange={(e) => setHint(e.target.value)}>
            <option value="">{t('data.csv.autoDetect')}</option>
            <option value="assets">{t('export.scope.assets')}</option>
            <option value="transactions">{t('export.scope.tx')}</option>
            <option value="salary">{t('export.scope.salary')}</option>
            <option value="debts">{t('export.scope.debts')}</option>
          </select>
        </label>
        <label>
          {t('dash.importJson.mode')}
          <select value={mode} onChange={(e) => setMode(e.target.value as 'append' | 'replace')}>
            <option value="append">{t('dash.importJson.modeAppend')}</option>
            <option value="replace">{t('dash.importJson.modeReplace')}</option>
          </select>
        </label>
      </div>
      <div className="row-actions" style={{ marginTop: '0.75rem' }}>
        <Button type="primary" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? t('export.working') : t('data.csv.pick')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />
      </div>
    </Card>
  )
}

/* --------------------------------- Sync ---------------------------------- */

function SyncSection() {
  const { t } = useI18n()
  const [settings, setSettings] = useState<SheetsSettings>({
    importUrl: '',
    webhookUrl: '',
    webhookToken: '',
  })
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [showTemplate, setShowTemplate] = useState(false)

  useEffect(() => {
    void api
      .getSheetsSettings()
      .then(setSettings)
      .catch((e) => setError(String(e)))
  }, [])

  async function save() {
    setBusy('save')
    setError('')
    setMsg('')
    try {
      await api.saveSheetsSettings(settings)
      notifySuccess(t('data.sync.saved'))
    } catch (err) {
      notifyError(t('data.sync.saveFail'), err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  async function act(kind: 'import' | 'push' | 'pull' | 'ping') {
    setBusy(kind)
    setError('')
    setMsg('')
    try {
      if (kind === 'import') {
        const c = await api.importGoogleSheet(settings.importUrl, 'replace')
        setMsg(t('dash.importJson.doneDetail', { a: c.assets, t: c.transactions, s: c.salary, d: c.debts }))
      } else if (kind === 'push') {
        const r = await api.pushAllToSheet()
        setMsg(r.message || t('data.sync.pushed'))
      } else if (kind === 'pull') {
        const c = await api.pullViaWebhook('replace')
        setMsg(t('dash.importJson.doneDetail', { a: c.assets, t: c.transactions, s: c.salary, d: c.debts }))
      } else {
        const r = await api.pingWebhook()
        setMsg(r.message || 'pong')
      }
      notifySuccess(t('data.sync.ok'))
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err)
      setError(m)
      notifyError(t('data.sync.fail'), m)
    } finally {
      setBusy(null)
    }
  }

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SOURCE)
      notifySuccess(t('data.sync.copied'))
    } catch {
      setShowTemplate(true)
    }
  }

  return (
    <Card color="app-blue" pattern="app-blue" className="form-card data-section">
      <Title size="small">{t('data.sync.title')}</Title>
      <p className="muted">{t('data.sync.lead')}</p>
      {error ? <p className="error">{error}</p> : null}
      {msg ? <p className="ok">{msg}</p> : null}

      <div className="grid-form">
        <label className="span-2">
          {t('data.sync.importUrl')}
          <input
            value={settings.importUrl}
            onChange={(e) => setSettings({ ...settings, importUrl: e.target.value })}
            placeholder="https://docs.google.com/spreadsheets/d/…"
          />
        </label>
        <label className="span-2">
          {t('data.sync.webhookUrl')}
          <input
            value={settings.webhookUrl}
            onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
            placeholder="https://script.google.com/macros/s/…/exec"
          />
        </label>
        <label className="span-2">
          {t('data.sync.token')}
          <input
            value={settings.webhookToken}
            onChange={(e) => setSettings({ ...settings, webhookToken: e.target.value })}
          />
        </label>
      </div>

      <div className="row-actions" style={{ marginTop: '0.75rem' }}>
        <Button type="primary" disabled={busy != null} onClick={() => void save()}>
          {busy === 'save' ? t('export.working') : t('common.save')}
        </Button>
        <Button disabled={busy != null || !settings.importUrl} onClick={() => void act('import')}>
          {busy === 'import' ? t('export.working') : t('data.sync.import')}
        </Button>
        <Button disabled={busy != null || !settings.webhookUrl} onClick={() => void act('push')}>
          {busy === 'push' ? t('export.working') : t('data.sync.push')}
        </Button>
        <Button disabled={busy != null || !settings.webhookUrl} onClick={() => void act('pull')}>
          {busy === 'pull' ? t('export.working') : t('data.sync.pull')}
        </Button>
        <Button disabled={busy != null || !settings.webhookUrl} onClick={() => void act('ping')}>
          {busy === 'ping' ? t('export.working') : t('data.sync.ping')}
        </Button>
      </div>

      <div className="row-actions" style={{ marginTop: '0.75rem' }}>
        <Button size="small" onClick={() => void copyTemplate()}>
          {t('data.sync.copyTemplate')}
        </Button>
        <button type="button" className="linkish" onClick={() => setShowTemplate((v) => !v)}>
          {showTemplate ? t('data.sync.hideTemplate') : t('data.sync.showTemplate')}
        </button>
      </div>
      {showTemplate ? (
        <CodeBlock code={APPS_SCRIPT_SOURCE} style={{ maxHeight: '20rem', marginTop: '0.5rem' }} />
      ) : null}
    </Card>
  )
}

/* --------------------------------- Lock ---------------------------------- */

function LockSection({ onLockChange }: { onLockChange?: (enabled: boolean) => void }) {
  const { t } = useI18n()
  const [locked, setLocked] = useState(false)
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void api
      .lockStatus()
      .then((s) => {
        setLocked(s.locked)
        onLockChange?.(s.locked)
      })
      .catch(() => undefined)
  }, [onLockChange])

  async function enable() {
    setError('')
    if (pass.length < 6) {
      setError(t('data.lock.tooShort'))
      return
    }
    if (pass !== pass2) {
      setError(t('data.lock.mismatch'))
      return
    }
    setBusy(true)
    try {
      await api.enableLock(pass)
      setLocked(true)
      onLockChange?.(true)
      setPass('')
      setPass2('')
      notifySuccess(t('data.lock.enabled'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    setError('')
    try {
      await api.disableLock()
      setLocked(false)
      onLockChange?.(false)
      notifySuccess(t('data.lock.disabled'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card color="app-orange" pattern="app-orange" className="form-card data-section">
      <Title size="small">{t('data.lock.title')}</Title>
      <p className="muted">{t('data.lock.lead')}</p>
      {error ? <p className="error">{error}</p> : null}
      {locked ? (
        <>
          <p className="ok">{t('data.lock.isOn')}</p>
          <div className="row-actions">
            <Button type="primary" disabled={busy} onClick={() => void disable()}>
              {t('data.lock.disable')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid-form">
            <label>
              {t('data.lock.pass')}
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
            </label>
            <label>
              {t('data.lock.pass2')}
              <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} />
            </label>
          </div>
          <div className="row-actions" style={{ marginTop: '0.75rem' }}>
            <Button type="primary" disabled={busy} onClick={() => void enable()}>
              {t('data.lock.enable')}
            </Button>
          </div>
          <p className="muted">{t('data.lock.warn')}</p>
        </>
      )}
    </Card>
  )
}
