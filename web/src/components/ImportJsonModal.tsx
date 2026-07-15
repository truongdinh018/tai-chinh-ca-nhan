import { Button, CodeBlock } from 'animal-island-ui'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { financeSampleText } from '../data/financeSample'
import { parseImportJson } from '../data/importJson'
import { useI18n } from '../i18n/I18nContext'
import { notifyError, notifySuccess } from '../notify'
import { EntityModal } from './EntityModal'

type Props = {
  open: boolean
  onClose: () => void
  onApplied?: () => void
}

export function ImportJsonModal({ open, onClose, onApplied }: Props) {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'replace' | 'append'>('replace')
  const [busy, setBusy] = useState(false)
  const [parseError, setParseError] = useState('')

  useEffect(() => {
    if (!open) return
    setText(financeSampleText())
    setMode('replace')
    setParseError('')
    setBusy(false)
  }, [open])

  function loadSample() {
    setText(financeSampleText())
    setParseError('')
  }

  function onPickFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const raw = String(reader.result ?? '')
      setText(raw)
      try {
        parseImportJson(raw)
        setParseError('')
      } catch (err) {
        setParseError(err instanceof Error ? err.message : String(err))
      }
    }
    reader.onerror = () => setParseError(t('dash.importJson.readFail'))
    reader.readAsText(file, 'utf-8')
  }

  async function apply() {
    setBusy(true)
    setParseError('')
    try {
      parseImportJson(text)
      const counts = await api.importJson(text, mode)
      notifySuccess(
        t('dash.importJson.done'),
        t('dash.importJson.doneDetail', {
          a: counts.assets,
          t: counts.transactions,
          s: counts.salary,
          d: counts.debts,
        }),
      )
      onApplied?.()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setParseError(msg)
      notifyError(t('dash.importJson.fail'), msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <EntityModal
      open={open}
      mode="edit"
      title={t('dash.importJson.title')}
      busy={busy}
      saveLabel={t('dash.importJson.apply')}
      width={720}
      onClose={() => {
        if (!busy) onClose()
      }}
      onSave={apply}
    >
      <div className="import-json-modal">
        <p className="muted">{t('dash.importJson.lead')}</p>

        <div className="row-actions">
          <Button
            htmlType="button"
            size="small"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {t('dash.importJson.upload')}
          </Button>
          <Button htmlType="button" size="small" disabled={busy} onClick={loadSample}>
            {t('dash.importJson.useSample')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <label>
          {t('dash.importJson.mode')}
          <select
            value={mode}
            disabled={busy}
            onChange={(e) => setMode(e.target.value as 'replace' | 'append')}
          >
            <option value="replace">{t('dash.importJson.modeReplace')}</option>
            <option value="append">{t('dash.importJson.modeAppend')}</option>
          </select>
        </label>

        <div className="import-json-editor">
          <span className="import-json-editor-label">{t('dash.importJson.editor')}</span>
          <IslandCodeEditor
            value={text}
            disabled={busy}
            onChange={(next) => {
              setText(next)
              setParseError('')
            }}
          />
        </div>

        {parseError ? <p className="error">{parseError}</p> : null}
      </div>
    </EntityModal>
  )
}

/** Editable JSON with animal-island `CodeBlock` highlight underneath. */
function IslandCodeEditor({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}) {
  const previewRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function syncScroll() {
    const preview = previewRef.current
    const input = inputRef.current
    if (!preview || !input) return
    preview.scrollTop = input.scrollTop
    preview.scrollLeft = input.scrollLeft
  }

  // Trailing newline keeps last line visible while typing
  const display = value.endsWith('\n') ? value : `${value}\n`

  return (
    <div className={`island-code-editor${disabled ? ' is-disabled' : ''}`}>
      <div className="island-code-editor-preview" ref={previewRef} aria-hidden>
        <CodeBlock
          code={display || ' '}
          className="island-code-editor-block"
          style={{
            margin: 0,
            maxHeight: 'none',
            overflow: 'visible',
            whiteSpace: 'pre',
            wordBreak: 'normal',
          }}
        />
      </div>
      <textarea
        ref={inputRef}
        className="island-code-editor-input"
        value={value}
        disabled={disabled}
        spellCheck={false}
        aria-label="JSON"
        onScroll={syncScroll}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
