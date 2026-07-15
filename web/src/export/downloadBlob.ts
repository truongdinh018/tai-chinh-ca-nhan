/** Trigger a browser file download from a Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportStamp(prefix = 'tai-chinh'): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}`
}
