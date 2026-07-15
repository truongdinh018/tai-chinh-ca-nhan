import { Button, Title } from 'animal-island-ui'
import { useEffect, useState } from 'react'
import { api, formatVnd, type Debt } from '../api/client'
import { EntityModal, type EntityModalMode } from '../components/EntityModal'
import { RowActions } from '../components/RowActions'
import { TablePager } from '../components/TablePager'
import { usePagination } from '../hooks/usePagination'
import { notifyError, notifySuccess } from '../notify'

type DebtForm = {
  name: string
  principal_vnd: number
  balance_vnd: number
  rate_year: number
  note: string
}

const empty: DebtForm = {
  name: '',
  principal_vnd: 0,
  balance_vnd: 0,
  rate_year: 0,
  note: '',
}

function fromDebt(d: Debt): DebtForm {
  return {
    name: d.name,
    principal_vnd: d.principal_vnd,
    balance_vnd: d.balance_vnd,
    rate_year: d.rate_year,
    note: d.note,
  }
}

export function DebtsPage() {
  const [items, setItems] = useState<Debt[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<EntityModalMode | null>(null)
  const [active, setActive] = useState<Debt | null>(null)
  const [form, setForm] = useState(empty)
  const { page, setPage, pageSize, total, totalPages, slice } = usePagination(items, 8)

  async function load() {
    setItems(await api.listDebts())
  }

  useEffect(() => {
    void load().catch((e) => setError(String(e)))
  }, [])

  function openCreate() {
    setActive(null)
    setForm(empty)
    setMode('create')
  }

  function openModal(next: EntityModalMode, item: Debt) {
    setActive(item)
    setMode(next)
    if (next === 'edit') setForm(fromDebt(item))
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
        await api.createDebt(form)
        notifySuccess('Đã thêm khoản nợ')
      } else if (mode === 'edit' && active) {
        await api.updateDebt(active.id, form)
        notifySuccess('Đã cập nhật khoản nợ')
      }
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError('Không lưu được nợ', msg)
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmDelete() {
    if (!active) return
    setBusy(true)
    setError('')
    try {
      await api.deleteDebt(active.id)
      notifySuccess('Đã xóa khoản nợ', active.name)
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError('Không xóa được nợ', msg)
    } finally {
      setBusy(false)
    }
  }

  const modalTitle =
    mode === 'create'
      ? 'Thêm nợ'
      : mode === 'view'
        ? 'Xem nợ'
        : mode === 'edit'
          ? 'Sửa nợ'
          : 'Xóa nợ'

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">Nợ</Title>
        <Button type="primary" onClick={openCreate}>
          Thêm
        </Button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Dư nợ</th>
              <th>Lãi</th>
              <th className="table-actions-col" aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {slice.map((d) => (
              <tr
                key={d.id}
                className="table-row-click"
                onClick={() => openModal('view', d)}
              >
                <td>{d.name}</td>
                <td>{formatVnd(d.balance_vnd)}</td>
                <td>{d.rate_year}%</td>
                <td
                  className="table-actions-col"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <RowActions
                    onView={() => openModal('view', d)}
                    onEdit={() => openModal('edit', d)}
                    onDelete={() => openModal('delete', d)}
                  />
                </td>
              </tr>
            ))}
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
          <p>
            Xóa khoản nợ <strong>{active.name}</strong>?
          </p>
        ) : null}
        {mode === 'view' && active ? <DebtDetail item={active} /> : null}
        {mode === 'create' || mode === 'edit' ? (
          <div className="grid-form modal-form">
            <DebtFields form={form} setForm={setForm} />
          </div>
        ) : null}
      </EntityModal>
    </div>
  )
}

function DebtFields({ form, setForm }: { form: DebtForm; setForm: (f: DebtForm) => void }) {
  return (
    <>
      <label>
        Tên
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </label>
      <label>
        Gốc
        <input
          type="number"
          value={form.principal_vnd}
          onChange={(e) => setForm({ ...form, principal_vnd: Number(e.target.value) })}
        />
      </label>
      <label>
        Dư nợ
        <input
          type="number"
          value={form.balance_vnd}
          onChange={(e) => setForm({ ...form, balance_vnd: Number(e.target.value) })}
        />
      </label>
      <label>
        Lãi (%/năm)
        <input
          type="number"
          step="any"
          value={form.rate_year}
          onChange={(e) => setForm({ ...form, rate_year: Number(e.target.value) })}
        />
      </label>
      <label className="span-2">
        Ghi chú
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>
    </>
  )
}

function DebtDetail({ item }: { item: Debt }) {
  return (
    <dl className="detail-list">
      <div>
        <dt>Tên</dt>
        <dd>{item.name}</dd>
      </div>
      <div>
        <dt>Lãi (%/năm)</dt>
        <dd>{item.rate_year}%</dd>
      </div>
      <div>
        <dt>Gốc</dt>
        <dd>{formatVnd(item.principal_vnd)}</dd>
      </div>
      <div>
        <dt>Dư nợ</dt>
        <dd>{formatVnd(item.balance_vnd)}</dd>
      </div>
      <div className="span-2">
        <dt>Ghi chú</dt>
        <dd>{item.note || '—'}</dd>
      </div>
    </dl>
  )
}
