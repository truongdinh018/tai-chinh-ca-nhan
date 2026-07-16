import { Button, Title } from 'animal-island-ui'
import { useEffect, useMemo, useState } from 'react'
import {
  api,
  formatVnd,
  type Account,
  type Category,
  type Tag,
  type Transaction,
} from '../api/client'
import { EntityModal, type EntityModalMode } from '../components/EntityModal'
import { RowActions } from '../components/RowActions'
import { TablePager } from '../components/TablePager'
import {
  applyTxFilters,
  EMPTY_TX_FILTER,
  TxFilters,
  type TxFilterState,
} from '../components/TxFilters'
import { usePagination } from '../hooks/usePagination'
import { useI18n } from '../i18n/I18nContext'
import { notifyError, notifySuccess } from '../notify'
import type { TxDirection } from '../store/types'

type TxForm = {
  date: string
  amount_vnd: number
  category: string
  direction: TxDirection
  note: string
  account_id: number | null
  to_account_id: number | null
  tag_ids: number[]
}

const empty: TxForm = {
  date: new Date().toISOString().slice(0, 10),
  amount_vnd: 0,
  category: '',
  direction: 'out',
  note: '',
  account_id: null,
  to_account_id: null,
  tag_ids: [],
}

function fromTx(t: Transaction): TxForm {
  return {
    date: t.date,
    amount_vnd: t.amount_vnd,
    category: t.category,
    direction: t.direction,
    note: t.note,
    account_id: t.account_id,
    to_account_id: t.to_account_id,
    tag_ids: [...t.tag_ids],
  }
}

export function TransactionsPage() {
  const { t } = useI18n()
  const [items, setItems] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<EntityModalMode | null>(null)
  const [active, setActive] = useState<Transaction | null>(null)
  const [form, setForm] = useState(empty)
  const [filter, setFilter] = useState<TxFilterState>(EMPTY_TX_FILTER)

  const filtered = useMemo(() => applyTxFilters(items, filter), [items, filter])
  const { page, setPage, pageSize, total, totalPages, slice } = usePagination(filtered, 10)

  const accountName = useMemo(() => {
    const m = new Map<number, string>()
    for (const a of accounts) m.set(a.id, a.name)
    return (id: number | null) => (id == null ? '—' : (m.get(id) ?? `#${id}`))
  }, [accounts])
  const tagName = useMemo(() => {
    const m = new Map<number, string>()
    for (const g of tags) m.set(g.id, g.name)
    return m
  }, [tags])

  async function load() {
    const [tx, acc, cat, tg] = await Promise.all([
      api.listTransactions(),
      api.listAccounts(),
      api.listCategories(),
      api.listTags(),
    ])
    setItems(tx)
    setAccounts(acc)
    setCategories(cat)
    setTags(tg)
  }

  useEffect(() => {
    void load().catch((e) => setError(String(e)))
  }, [])

  function openCreate() {
    setActive(null)
    setForm({
      ...empty,
      date: new Date().toISOString().slice(0, 10),
      account_id: accounts[0]?.id ?? null,
    })
    setMode('create')
  }

  function openModal(next: EntityModalMode, item: Transaction) {
    setActive(item)
    setMode(next)
    if (next === 'edit') setForm(fromTx(item))
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
      const payload = {
        ...form,
        to_account_id: form.direction === 'transfer' ? form.to_account_id : null,
        asset_id: active?.asset_id ?? null,
        recurring_id: active?.recurring_id ?? null,
      }
      if (mode === 'create') {
        await api.createTransaction(payload)
        notifySuccess(t('tx.saved'))
      } else if (mode === 'edit' && active) {
        await api.updateTransaction(active.id, payload)
        notifySuccess(t('tx.updated'))
      }
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError(t('tx.saveFail'), msg)
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmDelete() {
    if (!active) return
    setBusy(true)
    setError('')
    try {
      await api.deleteTransaction(active.id)
      notifySuccess(t('tx.deleted'), active.date)
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError(t('tx.deleteFail'), msg)
    } finally {
      setBusy(false)
    }
  }

  const modalTitle =
    mode === 'create'
      ? t('tx.add')
      : mode === 'view'
        ? t('tx.view')
        : mode === 'edit'
          ? t('tx.edit')
          : t('tx.delete')

  function dirLabel(d: TxDirection) {
    return d === 'in' ? t('tx.in') : d === 'out' ? t('tx.out') : t('tx.transfer')
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">{t('tab.tx')}</Title>
        <Button type="primary" onClick={openCreate}>
          {t('common.add')}
        </Button>
      </div>
      {error && <p className="error">{error}</p>}

      <TxFilters
        filter={filter}
        onChange={setFilter}
        accounts={accounts}
        categories={categories}
        labels={{
          search: t('tx.filter.search'),
          all: t('common.all'),
          category: t('tx.category'),
          account: t('tx.account'),
          direction: t('tx.dir'),
          in: t('tx.in'),
          out: t('tx.out'),
          transfer: t('tx.transfer'),
          from: t('tx.filter.from'),
          to: t('tx.filter.to'),
          amountMin: t('tx.filter.amountMin'),
          amountMax: t('tx.filter.amountMax'),
          clear: t('tx.filter.clear'),
        }}
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('tx.date')}</th>
              <th>{t('tx.dir')}</th>
              <th>{t('tx.amount')}</th>
              <th>{t('tx.category')}</th>
              <th>{t('tx.account')}</th>
              <th className="table-actions-col" aria-label={t('common.actions')} />
            </tr>
          </thead>
          <tbody>
            {slice.map((tx) => (
              <tr key={tx.id} className="table-row-click" onClick={() => openModal('view', tx)}>
                <td>{tx.date}</td>
                <td>
                  <span className={`dir-badge dir-${tx.direction}`}>{dirLabel(tx.direction)}</span>
                </td>
                <td>{formatVnd(tx.amount_vnd)}</td>
                <td>
                  {tx.category || tx.note}
                  {tx.tag_ids.length ? (
                    <div className="tag-chips">
                      {tx.tag_ids.map((id) =>
                        tagName.has(id) ? (
                          <span key={id} className="tag-chip">
                            {tagName.get(id)}
                          </span>
                        ) : null,
                      )}
                    </div>
                  ) : null}
                </td>
                <td>
                  {tx.direction === 'transfer'
                    ? `${accountName(tx.account_id)} → ${accountName(tx.to_account_id)}`
                    : accountName(tx.account_id)}
                </td>
                <td
                  className="table-actions-col"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <RowActions
                    onView={() => openModal('view', tx)}
                    onEdit={() => openModal('edit', tx)}
                    onDelete={() => openModal('delete', tx)}
                  />
                </td>
              </tr>
            ))}
            {slice.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  {t('tx.noMatch')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <TablePager
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onChange={setPage}
      />

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
          <p>{t('tx.deleteConfirm', { date: active.date, amount: formatVnd(active.amount_vnd) })}</p>
        ) : null}
        {mode === 'view' && active ? (
          <dl className="detail-list">
            <div>
              <dt>{t('tx.date')}</dt>
              <dd>{active.date}</dd>
            </div>
            <div>
              <dt>{t('tx.dir')}</dt>
              <dd>{dirLabel(active.direction)}</dd>
            </div>
            <div>
              <dt>{t('tx.amount')}</dt>
              <dd>{formatVnd(active.amount_vnd)}</dd>
            </div>
            <div>
              <dt>{t('tx.category')}</dt>
              <dd>{active.category || '—'}</dd>
            </div>
            <div>
              <dt>{t('tx.account')}</dt>
              <dd>
                {active.direction === 'transfer'
                  ? `${accountName(active.account_id)} → ${accountName(active.to_account_id)}`
                  : accountName(active.account_id)}
              </dd>
            </div>
            <div>
              <dt>{t('tx.tags')}</dt>
              <dd>{active.tag_ids.map((id) => tagName.get(id)).filter(Boolean).join(', ') || '—'}</dd>
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
              {t('tx.date')}
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>
            <label>
              {t('tx.dir')}
              <select
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value as TxDirection })}
              >
                <option value="in">{t('tx.in')}</option>
                <option value="out">{t('tx.out')}</option>
                <option value="transfer">{t('tx.transfer')}</option>
              </select>
            </label>
            <label>
              {t('tx.amount')}
              <input
                type="number"
                value={form.amount_vnd}
                onChange={(e) => setForm({ ...form, amount_vnd: Number(e.target.value) })}
                required
              />
            </label>
            <label>
              {form.direction === 'transfer' ? t('tx.fromAccount') : t('tx.account')}
              <select
                value={form.account_id == null ? '' : String(form.account_id)}
                onChange={(e) =>
                  setForm({ ...form, account_id: e.target.value === '' ? null : Number(e.target.value) })
                }
              >
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            {form.direction === 'transfer' ? (
              <label>
                {t('tx.toAccount')}
                <select
                  value={form.to_account_id == null ? '' : String(form.to_account_id)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      to_account_id: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                >
                  <option value="">—</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                {t('tx.category')}
                <input
                  list="tx-category-list"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <datalist id="tx-category-list">
                  {categories
                    .filter((c) => c.kind === (form.direction === 'in' ? 'in' : 'out'))
                    .map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                </datalist>
              </label>
            )}
            {tags.length ? (
              <div className="span-2 tag-picker">
                <span className="tag-picker-label">{t('tx.tags')}</span>
                <div className="tag-picker-list">
                  {tags.map((g) => {
                    const on = form.tag_ids.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`tag-toggle${on ? ' is-on' : ''}`}
                        onClick={() =>
                          setForm({
                            ...form,
                            tag_ids: on
                              ? form.tag_ids.filter((x) => x !== g.id)
                              : [...form.tag_ids, g.id],
                          })
                        }
                      >
                        {g.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
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
