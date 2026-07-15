type Props = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export function TablePager({ page, totalPages, total, pageSize, onChange }: Props) {
  if (total === 0) {
    return <p className="table-pager muted">Chưa có dữ liệu.</p>
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="table-pager" role="navigation" aria-label="Phân trang">
      <span className="table-pager-meta">
        {from}–{to} / {total}
      </span>
      <div className="table-pager-btns">
        <button
          type="button"
          className="pager-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <span className="table-pager-page">
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          className="pager-btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  )
}
