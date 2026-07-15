import { useEffect, useMemo, useState } from 'react'

export function usePagination<T>(items: T[], pageSize = 8) {
  const [page, setPage] = useState(1)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const slice = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return { page, setPage, pageSize, total, totalPages, slice }
}
