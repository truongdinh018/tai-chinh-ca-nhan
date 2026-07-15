import { get, set } from 'idb-keyval'
import { emptyState, type FinanceState } from './types'

const STORE_KEY = 'finance-browser-v1'

let cache: FinanceState | null = null
let loading: Promise<FinanceState> | null = null

export async function loadState(): Promise<FinanceState> {
  if (cache) return cache
  if (loading) return loading
  loading = (async () => {
    const raw = await get(STORE_KEY)
    if (raw && typeof raw === 'object' && (raw as FinanceState).version === 1) {
      cache = { ...emptyState(), ...(raw as FinanceState), version: 1 }
    } else {
      cache = emptyState()
      await set(STORE_KEY, cache)
    }
    return cache
  })()
  try {
    return await loading
  } finally {
    loading = null
  }
}

export async function saveState(state: FinanceState): Promise<void> {
  cache = state
  await set(STORE_KEY, state)
}

export async function updateState(
  mutator: (state: FinanceState) => void | FinanceState,
): Promise<FinanceState> {
  const state = structuredClone(await loadState())
  const maybe = mutator(state)
  const next = maybe ?? state
  await saveState(next)
  return next
}

export async function clearState(): Promise<FinanceState> {
  const next = emptyState()
  await saveState(next)
  return next
}

export function peekState(): FinanceState | null {
  return cache
}
