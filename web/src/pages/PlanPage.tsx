import { Button, Card, Title } from 'animal-island-ui'
import { useEffect, useMemo, useState } from 'react'
import {
  api,
  formatVnd,
  type Account,
  type Budget,
  type Category,
  type Recurring,
} from '../api/client'
import { EntityModal, type EntityModalMode } from '../components/EntityModal'
import { RowActions } from '../components/RowActions'
import { useI18n } from '../i18n/I18nContext'
import { notifyError, notifySuccess } from '../notify'
import type { BudgetProgress } from '../store/queries'
import type { TxDirection } from '../store/types'

function thisYm(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function PlanPage() {
  const { t } = useI18n()
  const [ym, setYm] = useState(thisYm())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [progress, setProgress] = useState<BudgetProgress[]>([])
  const [recurring, setRecurring] = useState<Recurring[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')

  async function load() {
    const [b, p, r, acc, cat] = await Promise.all([
      api.listBudgets(),
      api.budgetProgress(ym),
      api.listRecurring(),
      api.listAccounts(),
      api.listCategories(),
    ])
    setBudgets(b)
    setProgress(p)
    setRecurring(r)
    setAccounts(acc)
    setCategories(cat)
  }

  useEffect(() => {
    void load().catch((e) => setError(String(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym])

  const progressById = useMemo(() => {
    const m = new Map<number, BudgetProgress>()
    for (const p of progress) m.set(p.id, p)
    return m
  }, [progress])

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">{t('tab.plan')}</Title>
        <label className="inline-month">
          {t('plan.month')}
          <input type="month" value={ym} onChange={(e) => setYm(e.target.value || thisYm())} />
        </label>
      </div>
      {error && <p className="error">{error}</p>}

      <BudgetSection
        budgets={budgets}
        progressById={progressById}
        categories={categories}
        onReload={load}
      />

      <RecurringSection
        recurring={recurring}
        accounts={accounts}
        categories={categories}
        ym={ym}
        onReload={load}
      />
    </div>
  )
}

/* ------------------------------- Budgets --------------------------------- */

type BudgetForm = { category: string; amount_vnd: number; note: string }
const emptyBudget: BudgetForm = { category: '', amount_vnd: 0, note: '' }

function BudgetSection({
  budgets,
  progressById,
  categories,
  onReload,
}: {
  budgets: Budget[]
  progressById: Map<number, BudgetProgress>
  categories: Category[]
  onReload: () => Promise<void>
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState<EntityModalMode | null>(null)
  const [active, setActive] = useState<Budget | null>(null)
  const [form, setForm] = useState(emptyBudget)
  const [busy, setBusy] = useState(false)

  function openCreate() {
    setActive(null)
    setForm(emptyBudget)
    setMode('create')
  }
  function openEdit(b: Budget) {
    setActive(b)
    setForm({ category: b.category, amount_vnd: b.amount_vnd, note: b.note })
    setMode('edit')
  }
  function openDelete(b: Budget) {
    setActive(b)
    setMode('delete')
  }

  async function onSave() {
    setBusy(true)
    try {
      if (mode === 'create') await api.createBudget(form)
      else if (mode === 'edit' && active) await api.updateBudget(active.id, form)
      notifySuccess(t('plan.budget.saved'))
      setMode(null)
      await onReload()
    } catch (err) {
      notifyError(t('plan.budget.saveFail'), err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }
  async function onConfirmDelete() {
    if (!active) return
    setBusy(true)
    try {
      await api.deleteBudget(active.id)
      notifySuccess(t('plan.budget.deleted'))
      setMode(null)
      await onReload()
    } catch (err) {
      notifyError(t('plan.budget.deleteFail'), err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const outCats = categories.filter((c) => c.kind === 'out')

  return (
    <Card color="app-teal" pattern="app-teal" className="form-card plan-section">
      <div className="page-toolbar">
        <Title size="small">{t('plan.budgets')}</Title>
        <Button size="small" type="primary" onClick={openCreate}>
          {t('common.add')}
        </Button>
      </div>
      {budgets.length === 0 ? (
        <p className="muted">{t('plan.budget.empty')}</p>
      ) : (
        <div className="budget-list">
          {budgets.map((b) => {
            const p = progressById.get(b.id)
            const ratio = p ? p.ratio : 0
            const spent = p ? p.spent_vnd : 0
            const over = ratio > 1
            return (
              <div key={b.id} className="budget-item">
                <div className="budget-item-head">
                  <span className="budget-cat">{b.category || '—'}</span>
                  <span className="budget-actions">
                    <RowActions
                      onView={() => openEdit(b)}
                      onEdit={() => openEdit(b)}
                      onDelete={() => openDelete(b)}
                    />
                  </span>
                </div>
                <div className="budget-bar">
                  <span
                    className={`budget-bar-fill${over ? ' is-over' : ''}`}
                    style={{ width: `${Math.min(100, ratio * 100)}%` }}
                  />
                </div>
                <div className="budget-item-meta muted">
                  {formatVnd(spent)} / {formatVnd(b.amount_vnd)} ({Math.round(ratio * 100)}%)
                  {over ? ` · ${t('plan.budget.over')}` : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <EntityModal
        open={mode != null}
        mode={mode}
        title={mode === 'create' ? t('plan.budget.add') : mode === 'edit' ? t('plan.budget.edit') : t('plan.budget.delete')}
        busy={busy}
        onClose={() => !busy && setMode(null)}
        onSave={onSave}
        onConfirmDelete={onConfirmDelete}
      >
        {mode === 'delete' && active ? (
          <p>{t('plan.budget.deleteConfirm', { name: active.category })}</p>
        ) : null}
        {mode === 'create' || mode === 'edit' ? (
          <div className="grid-form modal-form">
            <label className="span-2">
              {t('tx.category')}
              <input
                list="budget-cat-list"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="budget-cat-list">
                {outCats.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </label>
            <label className="span-2">
              {t('plan.budget.amount')}
              <input
                type="number"
                value={form.amount_vnd}
                onChange={(e) => setForm({ ...form, amount_vnd: Number(e.target.value) })}
              />
            </label>
            <label className="span-2">
              {t('common.note')}
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>
        ) : null}
      </EntityModal>
    </Card>
  )
}

/* ------------------------------ Recurring -------------------------------- */

type RecForm = {
  name: string
  amount_vnd: number
  category: string
  direction: TxDirection
  account_id: number | null
  to_account_id: number | null
  day_of_month: number
  note: string
  active: boolean
}

const emptyRec: RecForm = {
  name: '',
  amount_vnd: 0,
  category: '',
  direction: 'out',
  account_id: null,
  to_account_id: null,
  day_of_month: 1,
  note: '',
  active: true,
}

function RecurringSection({
  recurring,
  accounts,
  categories,
  ym,
  onReload,
}: {
  recurring: Recurring[]
  accounts: Account[]
  categories: Category[]
  ym: string
  onReload: () => Promise<void>
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState<EntityModalMode | null>(null)
  const [active, setActive] = useState<Recurring | null>(null)
  const [form, setForm] = useState(emptyRec)
  const [busy, setBusy] = useState(false)
  const [genBusy, setGenBusy] = useState(false)

  function openCreate() {
    setActive(null)
    setForm({ ...emptyRec, account_id: accounts[0]?.id ?? null })
    setMode('create')
  }
  function openEdit(r: Recurring) {
    setActive(r)
    setForm({
      name: r.name,
      amount_vnd: r.amount_vnd,
      category: r.category,
      direction: r.direction,
      account_id: r.account_id,
      to_account_id: r.to_account_id,
      day_of_month: r.day_of_month,
      note: r.note,
      active: r.active,
    })
    setMode('edit')
  }
  function openDelete(r: Recurring) {
    setActive(r)
    setMode('delete')
  }

  async function onSave() {
    setBusy(true)
    try {
      const payload = {
        ...form,
        to_account_id: form.direction === 'transfer' ? form.to_account_id : null,
        tag_ids: active?.tag_ids ?? [],
      }
      if (mode === 'create') await api.createRecurring(payload)
      else if (mode === 'edit' && active) await api.updateRecurring(active.id, payload)
      notifySuccess(t('plan.rec.saved'))
      setMode(null)
      await onReload()
    } catch (err) {
      notifyError(t('plan.rec.saveFail'), err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }
  async function onConfirmDelete() {
    if (!active) return
    setBusy(true)
    try {
      await api.deleteRecurring(active.id)
      notifySuccess(t('plan.rec.deleted'))
      setMode(null)
      await onReload()
    } catch (err) {
      notifyError(t('plan.rec.deleteFail'), err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function generate() {
    setGenBusy(true)
    try {
      const n = await api.generateRecurringForMonth(ym)
      notifySuccess(t('plan.rec.generated', { n, ym }))
      await onReload()
    } catch (err) {
      notifyError(t('plan.rec.generateFail'), err instanceof Error ? err.message : String(err))
    } finally {
      setGenBusy(false)
    }
  }

  const acctName = (id: number | null) => accounts.find((a) => a.id === id)?.name ?? '—'

  return (
    <Card color="app-orange" pattern="app-orange" className="form-card plan-section">
      <div className="page-toolbar">
        <Title size="small">{t('plan.recurring')}</Title>
        <div className="row-actions">
          <Button size="small" disabled={genBusy || recurring.length === 0} onClick={() => void generate()}>
            {genBusy ? t('plan.rec.generating') : t('plan.rec.generate')}
          </Button>
          <Button size="small" type="primary" onClick={openCreate}>
            {t('common.add')}
          </Button>
        </div>
      </div>
      {recurring.length === 0 ? (
        <p className="muted">{t('plan.rec.empty')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('plan.rec.name')}</th>
                <th>{t('tx.amount')}</th>
                <th>{t('plan.rec.day')}</th>
                <th>{t('plan.rec.active')}</th>
                <th className="table-actions-col" />
              </tr>
            </thead>
            <tbody>
              {recurring.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.name}
                    <div className="muted">
                      {r.direction === 'transfer'
                        ? `${acctName(r.account_id)} → ${acctName(r.to_account_id)}`
                        : `${r.category || '—'} · ${acctName(r.account_id)}`}
                    </div>
                  </td>
                  <td>{formatVnd(r.amount_vnd)}</td>
                  <td>{r.day_of_month}</td>
                  <td>{r.active ? t('common.yes') : t('common.no')}</td>
                  <td className="table-actions-col">
                    <RowActions
                      onView={() => openEdit(r)}
                      onEdit={() => openEdit(r)}
                      onDelete={() => openDelete(r)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EntityModal
        open={mode != null}
        mode={mode}
        title={mode === 'create' ? t('plan.rec.add') : mode === 'edit' ? t('plan.rec.edit') : t('plan.rec.delete')}
        busy={busy}
        onClose={() => !busy && setMode(null)}
        onSave={onSave}
        onConfirmDelete={onConfirmDelete}
      >
        {mode === 'delete' && active ? (
          <p>{t('plan.rec.deleteConfirm', { name: active.name })}</p>
        ) : null}
        {mode === 'create' || mode === 'edit' ? (
          <div className="grid-form modal-form">
            <label className="span-2">
              {t('plan.rec.name')}
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  list="rec-cat-list"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <datalist id="rec-cat-list">
                  {categories
                    .filter((c) => c.kind === (form.direction === 'in' ? 'in' : 'out'))
                    .map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                </datalist>
              </label>
            )}
            <label>
              {t('plan.rec.day')}
              <input
                type="number"
                min={1}
                max={31}
                value={form.day_of_month}
                onChange={(e) => setForm({ ...form, day_of_month: Number(e.target.value) })}
              />
            </label>
            <label className="bool-field">
              {t('plan.rec.active')}
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
            </label>
            <label className="span-2">
              {t('common.note')}
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>
        ) : null}
      </EntityModal>
    </Card>
  )
}
