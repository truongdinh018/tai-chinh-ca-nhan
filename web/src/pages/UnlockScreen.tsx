import { Button, Card, Icon, Title } from 'animal-island-ui'
import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/I18nContext'

type Props = {
  onUnlocked: () => void
}

export function UnlockScreen({ onUnlocked }: Props) {
  const { t } = useI18n()
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const ok = await api.unlock(pass)
      if (ok) onUnlocked()
      else setError(t('lock.wrong'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="unlock-wrap">
      <Card color="app-teal" pattern="app-teal" className="unlock-card">
        <div className="brand-mark">
          <Icon name="icon-shopping" size={28} />
          <span>{t('app.title')}</span>
        </div>
        <Title size="small">{t('lock.title')}</Title>
        <p className="muted">{t('lock.lead')}</p>
        <form className="unlock-form" onSubmit={submit}>
          <label>
            {t('data.lock.pass')}
            <input
              type="password"
              value={pass}
              autoFocus
              onChange={(e) => setPass(e.target.value)}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <Button type="primary" htmlType="submit" disabled={busy}>
            {busy ? t('lock.unlocking') : t('lock.unlock')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
