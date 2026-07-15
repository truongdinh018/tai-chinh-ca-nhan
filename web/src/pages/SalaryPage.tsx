import { Button, Title } from 'animal-island-ui'
import { useEffect, useState } from 'react'
import { api, formatVnd, type Salary } from '../api/client'
import { EntityModal, type EntityModalMode } from '../components/EntityModal'
import { RowActions } from '../components/RowActions'
import { TablePager } from '../components/TablePager'
import { usePagination } from '../hooks/usePagination'
import { notifyError, notifySuccess } from '../notify'

type SalaryForm = {
  period_ym: string
  gross: number
  net: number
  dependents: number
  note: string
}

const empty: SalaryForm = {
  period_ym: new Date().toISOString().slice(0, 7),
  gross: 0,
  net: 0,
  dependents: 0,
  note: '',
}

function fromSalary(s: Salary): SalaryForm {
  return {
    period_ym: s.period_ym,
    gross: s.gross,
    net: s.net,
    dependents: s.dependents,
    note: s.note,
  }
}

export function SalaryPage() {
  const [items, setItems] = useState<Salary[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<EntityModalMode | null>(null)
  const [active, setActive] = useState<Salary | null>(null)
  const [form, setForm] = useState(empty)
  const { page, setPage, pageSize, total, totalPages, slice } = usePagination(items, 8)

  async function load() {
    setItems(await api.listSalary())
  }

  useEffect(() => {
    void load().catch((e) => setError(String(e)))
  }, [])

  function openCreate() {
    setActive(null)
    setForm({ ...empty, period_ym: new Date().toISOString().slice(0, 7) })
    setMode('create')
  }

  function openModal(next: EntityModalMode, item: Salary) {
    setActive(item)
    setMode(next)
    if (next === 'edit') setForm(fromSalary(item))
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
        await api.createSalary(form)
        notifySuccess('Đã thêm kỳ lương')
      } else if (mode === 'edit' && active) {
        await api.updateSalary(active.id, form)
        notifySuccess('Đã cập nhật kỳ lương')
      }
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError('Không lưu được lương', msg)
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmDelete() {
    if (!active) return
    setBusy(true)
    setError('')
    try {
      await api.deleteSalary(active.id)
      notifySuccess('Đã xóa kỳ lương', active.period_ym)
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError('Không xóa được lương', msg)
    } finally {
      setBusy(false)
    }
  }

  const modalTitle =
    mode === 'create'
      ? 'Thêm lương'
      : mode === 'view'
        ? 'Xem lương'
        : mode === 'edit'
          ? 'Sửa lương'
          : 'Xóa lương'

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">Lương</Title>
        <Button type="primary" onClick={openCreate}>
          Thêm
        </Button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kỳ</th>
              <th>Gross</th>
              <th>Net</th>
              <th className="table-actions-col" aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {slice.map((s) => (
              <tr
                key={s.id}
                className="table-row-click"
                onClick={() => openModal('view', s)}
              >
                <td>{s.period_ym}</td>
                <td>{formatVnd(s.gross)}</td>
                <td>{formatVnd(s.net)}</td>
                <td
                  className="table-actions-col"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <RowActions
                    onView={() => openModal('view', s)}
                    onEdit={() => openModal('edit', s)}
                    onDelete={() => openModal('delete', s)}
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
            Xóa kỳ lương <strong>{active.period_ym}</strong>?
          </p>
        ) : null}
        {mode === 'view' && active ? <SalaryDetail item={active} /> : null}
        {mode === 'create' || mode === 'edit' ? (
          <div className="grid-form modal-form">
            <SalaryFields form={form} setForm={setForm} />
          </div>
        ) : null}
      </EntityModal>
    </div>
  )
}

function SalaryFields({
  form,
  setForm,
}: {
  form: SalaryForm
  setForm: (f: SalaryForm) => void
}) {
  return (
    <>
      <label>
        Kỳ (YYYY-MM)
        <input
          value={form.period_ym}
          onChange={(e) => setForm({ ...form, period_ym: e.target.value })}
          required
        />
      </label>
      <label>
        Gross
        <input
          type="number"
          value={form.gross}
          onChange={(e) => setForm({ ...form, gross: Number(e.target.value) })}
        />
      </label>
      <label>
        Net
        <input
          type="number"
          value={form.net}
          onChange={(e) => setForm({ ...form, net: Number(e.target.value) })}
        />
      </label>
      <label>
        Phụ thuộc
        <input
          type="number"
          value={form.dependents}
          onChange={(e) => setForm({ ...form, dependents: Number(e.target.value) })}
        />
      </label>
      <label className="span-2">
        Ghi chú
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>
    </>
  )
}

function SalaryDetail({ item }: { item: Salary }) {
  return (
    <dl className="detail-list">
      <div>
        <dt>Kỳ</dt>
        <dd>{item.period_ym}</dd>
      </div>
      <div>
        <dt>Phụ thuộc</dt>
        <dd>{item.dependents}</dd>
      </div>
      <div>
        <dt>Gross</dt>
        <dd>{formatVnd(item.gross)}</dd>
      </div>
      <div>
        <dt>Net</dt>
        <dd>{formatVnd(item.net)}</dd>
      </div>
      <div className="span-2">
        <dt>Ghi chú</dt>
        <dd>{item.note || '—'}</dd>
      </div>
    </dl>
  )
}
