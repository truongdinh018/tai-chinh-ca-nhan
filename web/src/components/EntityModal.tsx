import { Button, Modal } from 'animal-island-ui'
import type { ReactNode } from 'react'

export type EntityModalMode = 'create' | 'view' | 'edit' | 'delete'

type Props = {
  open: boolean
  mode: EntityModalMode | null
  title: string
  busy?: boolean
  onClose: () => void
  onSave?: () => void
  onConfirmDelete?: () => void
  children: ReactNode
  deleteLabel?: string
  saveLabel?: string
  width?: number | string
}

export function EntityModal({
  open,
  mode,
  title,
  busy,
  onClose,
  onSave,
  onConfirmDelete,
  children,
  deleteLabel = 'Xóa',
  saveLabel,
  width,
}: Props) {
  let footer: ReactNode = (
    <Button type="primary" onClick={onClose}>
      Đóng
    </Button>
  )

  if (mode === 'create' || mode === 'edit') {
    const label = saveLabel ?? (mode === 'create' ? 'Thêm' : 'Lưu')
    footer = (
      <>
        <Button onClick={onClose} disabled={busy}>
          Hủy
        </Button>
        <Button type="primary" onClick={() => void onSave?.()} disabled={busy}>
          {busy ? 'Đang lưu…' : label}
        </Button>
      </>
    )
  } else if (mode === 'delete') {
    footer = (
      <>
        <Button onClick={onClose} disabled={busy}>
          Hủy
        </Button>
        <Button type="primary" onClick={() => void onConfirmDelete?.()} disabled={busy}>
          {busy ? 'Đang xóa…' : deleteLabel}
        </Button>
      </>
    )
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={footer}
      typewriter={false}
      maskClosable={!busy}
      width={width ?? (mode === 'delete' ? 420 : 560)}
    >
      {children}
    </Modal>
  )
}
