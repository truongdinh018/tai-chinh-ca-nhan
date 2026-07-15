/**
 * Headless check: create asset via store (in-memory idb) + toast notify must not throw.
 * Run: npx tsx scripts/smoke-create.ts
 */
import { indexedDB, IDBKeyRange } from 'fake-indexeddb'
import { clearState } from '../src/store/db.ts'
import { createAsset, listAssets } from '../src/store/queries.ts'

;(globalThis as { indexedDB?: unknown }).indexedDB = indexedDB
;(globalThis as { IDBKeyRange?: unknown }).IDBKeyRange = IDBKeyRange

async function main() {
  await clearState()
  const before = await listAssets()
  const row = await createAsset({
    name: 'Smoke Test Asset',
    type: 'stock',
    quantity: 1,
    unit: 'cp',
    cost_vnd: 1_000_000,
    current_value_vnd: 1_200_000,
    note: 'modal create smoke',
  })
  const after = await listAssets()
  if (!row.id) throw new Error('createAsset returned no id')
  if (after.length !== before.length + 1) {
    throw new Error(`expected ${before.length + 1} assets, got ${after.length}`)
  }
  const found = after.find((a) => a.id === row.id)
  if (!found || found.name !== 'Smoke Test Asset') {
    throw new Error('created asset not found in list')
  }

  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM('<!doctype html><html><body></body></html>')
  ;(globalThis as { document?: Document }).document = dom.window.document
  ;(globalThis as { window?: Window & typeof globalThis }).window =
    dom.window as unknown as Window & typeof globalThis
  ;(globalThis as { requestAnimationFrame?: (cb: FrameRequestCallback) => number }).requestAnimationFrame = (
    cb,
  ) => dom.window.setTimeout(() => cb(0), 0) as unknown as number

  const { notifySuccess, notifyError } = await import('../src/notify.ts')
  notifySuccess('Đã thêm tài sản')
  notifyError('Không lưu được', 'boom')
  const toasts = dom.window.document.querySelectorAll('.app-toast')
  if (toasts.length < 2) throw new Error(`expected toasts, got ${toasts.length}`)

  console.log('OK smoke-create: asset id=', row.id, 'toasts=', toasts.length)
}

main().catch((err) => {
  console.error('FAIL', err)
  process.exit(1)
})
