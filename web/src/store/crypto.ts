/**
 * WebCrypto passphrase lock for the IndexedDB finance blob.
 * PBKDF2 (SHA-256) key derivation + AES-GCM authenticated encryption.
 * Everything runs client-side; the passphrase is never stored.
 */

const PBKDF2_ITERATIONS = 210_000

export type EncryptedBlob = {
  v: 1
  /** base64 PBKDF2 salt */
  salt: string
  /** base64 AES-GCM iv */
  iv: string
  /** base64 ciphertext */
  data: string
}

function toBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin)
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Derive a fresh key from a passphrase, returning the salt used. */
export async function deriveFromPassphrase(
  passphrase: string,
  saltInput?: Uint8Array,
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const salt = saltInput ?? crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(passphrase, salt)
  return { key, salt }
}

export async function encryptJson(
  value: unknown,
  key: CryptoKey,
  salt: Uint8Array,
): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const plaintext = enc.encode(JSON.stringify(value))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    plaintext as unknown as BufferSource,
  )
  return {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  }
}

export async function decryptJson<T>(blob: EncryptedBlob, key: CryptoKey): Promise<T> {
  const iv = fromBase64(blob.iv)
  const data = fromBase64(blob.data)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    data as unknown as BufferSource,
  )
  const dec = new TextDecoder()
  return JSON.parse(dec.decode(plain)) as T
}

export function blobSalt(blob: EncryptedBlob): Uint8Array {
  return fromBase64(blob.salt)
}
