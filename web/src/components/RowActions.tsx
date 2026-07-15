import { Button } from 'animal-island-ui'

type Props = {
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function RowActions({ onView, onEdit, onDelete }: Props) {
  return (
    <div className="table-actions">
      <Button size="small" type="text" onClick={onView}>
        Xem
      </Button>
      <Button size="small" type="text" onClick={onEdit}>
        Sửa
      </Button>
      <Button size="small" type="text" onClick={onDelete}>
        Xóa
      </Button>
    </div>
  )
}
