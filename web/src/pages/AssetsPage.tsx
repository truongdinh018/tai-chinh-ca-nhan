import { Button, Title } from 'animal-island-ui'
import { useEffect, useState } from 'react'
import { api, formatVnd, type Asset } from '../api/client'
import { EntityModal, type EntityModalMode } from '../components/EntityModal'
import { RowActions } from '../components/RowActions'
import { TablePager } from '../components/TablePager'
import { usePagination } from '../hooks/usePagination'
import { notifyError, notifySuccess } from '../notify'

type AssetForm = {
  name: string
  type: string
  quantity: number
  unit: string
  cost_vnd: number
  current_value_vnd: number
  note: string
}

const empty: AssetForm = {
  name: '',
  type: 'other',
  quantity: 1,
  unit: '',
  cost_vnd: 0,
  current_value_vnd: 0,
  note: '',
}

function fromAsset(a: Asset): AssetForm {
  return {
    name: a.name,
    type: a.type,
    quantity: a.quantity,
    unit: a.unit,
    cost_vnd: a.cost_vnd,
    current_value_vnd: a.current_value_vnd,
    note: a.note,
  }
}

export function AssetsPage() {
  const [items, setItems] = useState<Asset[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<EntityModalMode | null>(null)
  const [active, setActive] = useState<Asset | null>(null)
  const [form, setForm] = useState(empty)
  const { page, setPage, pageSize, total, totalPages, slice } = usePagination(items, 8)

  async function load() {
    setItems(await api.listAssets())
  }

  useEffect(() => {
    void load().catch((e) => setError(String(e)))
  }, [])

  function openCreate() {
    setActive(null)
    setForm(empty)
    setMode('create')
  }

  function openModal(next: EntityModalMode, item: Asset) {
    setActive(item)
    setMode(next)
    if (next === 'edit') setForm(fromAsset(item))
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
        await api.createAsset(form)
        notifySuccess('Đã thêm tài sản')
      } else if (mode === 'edit' && active) {
        await api.updateAsset(active.id, form)
        notifySuccess('Đã cập nhật tài sản')
      }
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError('Không lưu được tài sản', msg)
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmDelete() {
    if (!active) return
    setBusy(true)
    setError('')
    try {
      await api.deleteAsset(active.id)
      notifySuccess('Đã xóa tài sản', active.name)
      setMode(null)
      setActive(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notifyError('Không xóa được tài sản', msg)
    } finally {
      setBusy(false)
    }
  }

  const modalTitle =
    mode === 'create'
      ? 'Thêm tài sản'
      : mode === 'view'
        ? 'Xem tài sản'
        : mode === 'edit'
          ? 'Sửa tài sản'
          : 'Xóa tài sản'

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">Tài sản</Title>
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
              <th>Loại</th>
              <th>Giá trị</th>
              <th className="table-actions-col" aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {slice.map((a) => (
              <tr
                key={a.id}
                className="table-row-click"
                onClick={() => openModal('view', a)}
              >
                <td>
                  {a.name}
                  {a.note ? <div className="muted">{a.note}</div> : null}
                </td>
                <td>{a.type}</td>
                <td>{formatVnd(a.current_value_vnd)}</td>
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
            Xóa tài sản <strong>{active.name}</strong>? Thao tác không hoàn tác.
          </p>
        ) : null}
        {mode === 'view' && active ? <AssetDetail item={active} /> : null}
        {mode === 'create' || mode === 'edit' ? (
          <div className="grid-form modal-form">
            <AssetFields form={form} setForm={setForm} />
          </div>
        ) : null}
      </EntityModal>
    </div>
  )
}

function AssetFields({
  form,
  setForm,
}: {
  form: AssetForm
  setForm: (f: AssetForm) => void
}) {
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
        Loại
        <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
      </label>
      <label>
        Số lượng
        <input
          type="number"
          step="any"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
        />
      </label>
      <label>
        Đơn vị
        <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
      </label>
      <label>
        Giá vốn
        <input
          type="number"
          value={form.cost_vnd}
          onChange={(e) => setForm({ ...form, cost_vnd: Number(e.target.value) })}
        />
      </label>
      <label>
        Giá hiện tại
        <input
          type="number"
          value={form.current_value_vnd}
          onChange={(e) => setForm({ ...form, current_value_vnd: Number(e.target.value) })}
        />
      </label>
      <label className="span-2">
        Ghi chú
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>
    </>
  )
}

function AssetDetail({ item }: { item: Asset }) {
  return (
    <dl className="detail-list">
      <div>
        <dt>Tên</dt>
        <dd>{item.name}</dd>
      </div>
      <div>
        <dt>Loại</dt>
        <dd>{item.type || '—'}</dd>
      </div>
      <div>
        <dt>Số lượng</dt>
        <dd>
          {item.quantity}
          {item.unit ? ` ${item.unit}` : ''}
        </dd>
      </div>
      <div>
        <dt>Giá vốn</dt>
        <dd>{formatVnd(item.cost_vnd)}</dd>
      </div>
      <div>
        <dt>Giá hiện tại</dt>
        <dd>{formatVnd(item.current_value_vnd)}</dd>
      </div>
      <div className="span-2">
        <dt>Ghi chú</dt>
        <dd>{item.note || '—'}</dd>
      </div>
    </dl>
  )
}
