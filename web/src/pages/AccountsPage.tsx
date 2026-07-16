import { Button, Title } from 'animal-island-ui'
import { useEffect, useState } from 'react'
import { api, formatVnd, type AccountWithBalance } from '../api/client'
import { EntityModal, type EntityModalMode } from '../components/EntityModal'
import { RowActions } from '../components/RowActions'
import { useI18n } from '../i18n/I18nContext'
import { notifyError, notifySuccess } from '../notify'
import type { AccountKind } from '../store/types'

type AccountForm = {
  name: string
  kind: AccountKind
  opening_balance_vnd: number
  note: string
  archived: boolean
}

const empty: AccountForm = {
  name: '',
  kind: 'cash',
  opening_balance_vnd: 0,
  note: '',
  archived: false,
}

const KINDS: AccountKind[] = ['cash', 'bank', 'ewallet', 'credit', 'other']

export function AccountsPage() {
  const { t } = useI18n()
  const [items, setItems] = useState<AccountWithBalance[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<EntityModalMode | null>(null)
  const [active, setActive] = useState<AccountWithBalance | null>(null)
  const [form, setForm] = useState(empty)

  async function load() {
    setItems(await api.listAccountsWithBalance())
  }

  useEffect(() => {
    void load().catch((e) => setError(String(e)))
  }, [])

  function openCreate() {
    setActive(null)
    setForm(empty)
    setMode('create')
  }

  function openModal(next: EntityModalMode, item: AccountWithBalance) {
    setActive(item)
    setMode(next)
    if (next === 'edit') {
      setForm({
        name: item.name,
        kind: item.kind,
        opening_balance_vnd: item.opening_balance_vnd,
        note: item.note,
        archived: item.archived,
      })
    }
  }

  function closeModal() {
    if (busy) return
    setMode(null)
    setActive(null)
  }

  async function onSave() {
    setBusy(true)
    setError('')
    try {
      if (mode === 'create') {
        await api.createAccount(form)
        notifySuccess(t('acc.saved'))
      } else if (mode === 'edit' && active) {
        await api.updateAccount(active.id, form)
        notifySuccess(t('acc.updated'))
      }
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError(t('acc.saveFail'), msg)
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmDelete() {
    if (!active) return
    setBusy(true)
    setError('')
    try {
      await api.deleteAccount(active.id)
      notifySuccess(t('acc.deleted'), active.name)
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError(t('acc.deleteFail'), msg)
    } finally {
      setBusy(false)
    }
  }

  const modalTitle =
    mode === 'create'
      ? t('acc.add')
      : mode === 'view'
        ? t('acc.view')
        : mode === 'edit'
          ? t('acc.edit')
          : t('acc.delete')

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">{t('tab.accounts')}</Title>
        <Button type="primary" onClick={openCreate}>
          {t('common.add')}
        </Button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('acc.name')}</th>
              <th>{t('acc.kind')}</th>
              <th>{t('acc.balance')}</th>
              <th className="table-actions-col" aria-label={t('common.actions')} />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="table-row-click" onClick={() => openModal('view', a)}>
                <td>
                  {a.name}
                  {a.archived ? <span className="muted"> · {t('acc.archived')}</span> : null}
                  {a.note ? <div className="muted">{a.note}</div> : null}
                </td>
                <td>{t(`acc.kind.${a.kind}`)}</td>
                <td>{formatVnd(a.balance_vnd)}</td>
                <td
                  className="table-actions-col"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <RowActions
                    onView={() => openModal('view', a)}
                    onEdit={() => openModal('edit', a)}
                    onDelete={() => openModal('delete', a)}
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  {t('acc.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <EntityModal
        open={mode != null}
        mode={mode}
        title={modalTitle}
        busy={busy}
        onClose={closeModal}
        onSave={onSave}
        onConfirmDelete={onConfirmDelete}
      >
        {mode === 'delete' && active ? (
          <p>{t('acc.deleteConfirm', { name: active.name })}</p>
        ) : null}
        {mode === 'view' && active ? (
          <dl className="detail-list">
            <div>
              <dt>{t('acc.name')}</dt>
              <dd>{active.name}</dd>
            </div>
            <div>
              <dt>{t('acc.kind')}</dt>
              <dd>{t(`acc.kind.${active.kind}`)}</dd>
            </div>
            <div>
              <dt>{t('acc.opening')}</dt>
              <dd>{formatVnd(active.opening_balance_vnd)}</dd>
            </div>
            <div>
              <dt>{t('acc.balance')}</dt>
              <dd>{formatVnd(active.balance_vnd)}</dd>
            </div>
            <div className="span-2">
              <dt>{t('common.note')}</dt>
              <dd>{active.note || '—'}</dd>
            </div>
          </dl>
        ) : null}
        {mode === 'create' || mode === 'edit' ? (
          <div className="grid-form modal-form">
            <label>
              {t('acc.name')}
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              {t('acc.kind')}
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as AccountKind })}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`acc.kind.${k}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('acc.opening')}
              <input
                type="number"
                value={form.opening_balance_vnd}
                onChange={(e) => setForm({ ...form, opening_balance_vnd: Number(e.target.value) })}
              />
            </label>
            <label className="bool-field">
              {t('acc.archived')}
              <input
                type="checkbox"
                checked={form.archived}
                onChange={(e) => setForm({ ...form, archived: e.target.checked })}
              />
            </label>
            <label className="span-2">
              {t('common.note')}
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>
        ) : null}
      </EntityModal>
    </div>
  )
}
