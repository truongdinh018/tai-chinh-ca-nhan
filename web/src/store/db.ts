import { del, get, set } from 'idb-keyval'
import { emptyState, migrateState, type FinanceState } from './types'
import {
  blobSalt,
  decryptJson,
  deriveFromPassphrase,
  encryptJson,
  type EncryptedBlob,
} from './crypto'

const STORE_KEY = 'finance-browser-v1'
const LOCK_KEY = 'finance-lock-v1'

let cache: FinanceState | null = null
let loading: Promise<FinanceState> | null = null
/** In-memory AES key + salt held after unlock/enable; null when unlocked plain. */
let sessionKey: CryptoKey | null = null
let sessionSalt: Uint8Array | null = null

/** Thrown by loadState when a lock blob exists but no session key is set. */
export class LockedError extends Error {
  constructor() {
    super('LOCKED')
    this.name = 'LockedError'
  }
}

export async function isLocked(): Promise<boolean> {
  const blob = await get(LOCK_KEY)
  return !!blob
}

/** True when a lock blob exists AND we have not decrypted it yet. */
export async function needsUnlock(): Promise<boolean> {
  if (cache) return false
  return (await isLocked()) && !sessionKey
}

export async function loadState(): Promise<FinanceState> {
  if (cache) return cache
  if (loading) return loading
  loading = (async () => {
    const lockBlob = (await get(LOCK_KEY)) as EncryptedBlob | undefined
    if (lockBlob) {
      if (!sessionKey) throw new LockedError()
      const decrypted = await decryptJson<unknown>(lockBlob, sessionKey)
      cache = migrateState(decrypted)
      return cache
    }
    const raw = await get(STORE_KEY)
    cache = migrateState(raw)
    await set(STORE_KEY, cache)
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
  if (sessionKey && sessionSalt) {
    const blob = await encryptJson(state, sessionKey, sessionSalt)
    await set(LOCK_KEY, blob)
  } else {
    await set(STORE_KEY, state)
  }
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

/** Attempt to decrypt the lock blob with a passphrase. Returns true on success. */
export async function unlock(passphrase: string): Promise<boolean> {
  const lockBlob = (await get(LOCK_KEY)) as EncryptedBlob | undefined
  if (!lockBlob) return true
  const salt = blobSalt(lockBlob)
  const { key } = await deriveFromPassphrase(passphrase, salt)
  try {
    const decrypted = await decryptJson<unknown>(lockBlob, key)
    sessionKey = key
    sessionSalt = salt
    cache = migrateState(decrypted)
    return true
  } catch {
    return false
  }
}

/** Encrypt current data with a new passphrase and remove the plaintext blob. */
export async function enableLock(passphrase: string): Promise<void> {
  const state = await loadState()
  const { key, salt } = await deriveFromPassphrase(passphrase)
  sessionKey = key
  sessionSalt = salt
  const blob = await encryptJson(state, key, salt)
  await set(LOCK_KEY, blob)
  await del(STORE_KEY)
  cache = state
}

/** Decrypt permanently: write plaintext back and drop the lock blob. */
export async function disableLock(): Promise<void> {
  const state = await loadState()
  sessionKey = null
  sessionSalt = null
  await set(STORE_KEY, state)
  await del(LOCK_KEY)
  cache = state
}

/** Forget the in-memory key so the app returns to the unlock gate. */
export function lockSession(): void {
  sessionKey = null
  sessionSalt = null
  cache = null
}

export async function lockStatus(): Promise<{ locked: boolean; unlocked: boolean }> {
  const locked = await isLocked()
  return { locked, unlocked: locked ? !!sessionKey : true }
}
