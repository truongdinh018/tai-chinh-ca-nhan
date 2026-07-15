import { Button, Title } from 'animal-island-ui'
import { useEffect, useState } from 'react'
import { api, formatVnd, type Transaction } from '../api/client'
import { EntityModal, type EntityModalMode } from '../components/EntityModal'
import { RowActions } from '../components/RowActions'
import { TablePager } from '../components/TablePager'
import { usePagination } from '../hooks/usePagination'
import { notifyError, notifySuccess } from '../notify'

type TxForm = {
  date: string
  amount_vnd: number
  category: string
  direction: 'in' | 'out'
  note: string
  asset_id: number | null
}

const empty: TxForm = {
  date: new Date().toISOString().slice(0, 10),
  amount_vnd: 0,
  category: '',
  direction: 'out',
  note: '',
  asset_id: null,
}

function fromTx(t: Transaction): TxForm {
  return {
    date: t.date,
    amount_vnd: t.amount_vnd,
    category: t.category,
    direction: t.direction,
    note: t.note,
    asset_id: t.asset_id,
  }
}

export function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<EntityModalMode | null>(null)
  const [active, setActive] = useState<Transaction | null>(null)
  const [form, setForm] = useState(empty)
  const { page, setPage, pageSize, total, totalPages, slice } = usePagination(items, 8)

  async function load() {
    setItems(await api.listTransactions())
  }

  useEffect(() => {
    void load().catch((e) => setError(String(e)))
  }, [])

  function openCreate() {
    setActive(null)
    setForm({ ...empty, date: new Date().toISOString().slice(0, 10) })
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
      if (mode === 'create') {
        await api.createTransaction(form)
        notifySuccess('Đã thêm giao dịch')
      } else if (mode === 'edit' && active) {
        await api.updateTransaction(active.id, form)
        notifySuccess('Đã cập nhật giao dịch')
      }
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError('Không lưu được giao dịch', msg)
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
      notifySuccess('Đã xóa giao dịch', active.date)
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError('Không xóa được giao dịch', msg)
    } finally {
      setBusy(false)
    }
  }

  const modalTitle =
    mode === 'create'
      ? 'Thêm giao dịch'
      : mode === 'view'
        ? 'Xem giao dịch'
        : mode === 'edit'
          ? 'Sửa giao dịch'
          : 'Xóa giao dịch'

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">Giao dịch</Title>
        <Button type="primary" onClick={openCreate}>
          Thêm
        </Button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Chiều</th>
              <th>Số tiền</th>
              <th>Danh mục</th>
              <th className="table-actions-col" aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {slice.map((t) => (
              <tr
                key={t.id}
                className="table-row-click"
                onClick={() => openModal('view', t)}
              >
                <td>{t.date}</td>
                <td>{t.direction === 'in' ? 'Thu' : 'Chi'}</td>
                <td>{formatVnd(t.amount_vnd)}</td>
                <td>{t.category || t.note}</td>
                <td
                  className="table-actions-col"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <RowActions
                    onView={() => openModal('view', t)}
                    onEdit={() => openModal('edit', t)}
                    onDelete={() => openModal('delete', t)}
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
            Xóa giao dịch ngày <strong>{active.date}</strong> ({formatVnd(active.amount_vnd)})?
          </p>
        ) : null}
        {mode === 'view' && active ? <TxDetail item={active} /> : null}
        {mode === 'create' || mode === 'edit' ? (
          <div className="grid-form modal-form">
            <TxFields form={form} setForm={setForm} />
          </div>
        ) : null}
      </EntityModal>
    </div>
  )
}

function TxFields({ form, setForm }: { form: TxForm; setForm: (f: TxForm) => void }) {
  return (
    <>
      <label>
        Ngày
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
      </label>
      <label>
        Số tiền
        <input
          type="number"
          value={form.amount_vnd}
          onChange={(e) => setForm({ ...form, amount_vnd: Number(e.target.value) })}
          required
        />
      </label>
      <label>
        Chiều
        <select
          value={form.direction}
          onChange={(e) => setForm({ ...form, direction: e.target.value as 'in' | 'out' })}
        >
          <option value="in">Thu</option>
          <option value="out">Chi</option>
        </select>
      </label>
      <label>
        Danh mục
        <input
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </label>
      <label className="span-2">
        Ghi chú
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>
    </>
  )
}

function TxDetail({ item }: { item: Transaction }) {
  return (
    <dl className="detail-list">
      <div>
        <dt>Ngày</dt>
        <dd>{item.date}</dd>
      </div>
      <div>
        <dt>Chiều</dt>
        <dd>{item.direction === 'in' ? 'Thu' : 'Chi'}</dd>
      </div>
      <div>
        <dt>Số tiền</dt>
        <dd>{formatVnd(item.amount_vnd)}</dd>
      </div>
      <div>
        <dt>Danh mục</dt>
        <dd>{item.category || '—'}</dd>
      </div>
      <div className="span-2">
        <dt>Ghi chú</dt>
        <dd>{item.note || '—'}</dd>
      </div>
    </dl>
  )
}
