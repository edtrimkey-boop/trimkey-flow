// ============================================================
// Trim Key Flow — AES-GCM Encryption
// For encrypting merchant provider credentials at rest.
// Key: FLOW_ENCRYPTION_KEY (base64 encoded 32 bytes)
// Algorithm: AES-256-GCM (authenticated encryption)
// NEVER call from client components.
// ============================================================

import { getServerEnv } from '@/config/env'

interface EncryptedPayload {
  iv: string          // base64 encoded 12-byte IV
  ciphertext: string  // base64 encoded ciphertext
  tag: string         // base64 encoded 16-byte auth tag
}

/**
 * Import the FLOW_ENCRYPTION_KEY as a CryptoKey for AES-GCM.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const env = getServerEnv()
  const keyBytes = Buffer.from(env.FLOW_ENCRYPTION_KEY, 'base64')

  if (keyBytes.length !== 32) {
    throw new Error(
      `FLOW_ENCRYPTION_KEY must be exactly 32 bytes when base64-decoded. Got ${keyBytes.length}.`,
    )
  }

  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ])
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns a JSON-serializable EncryptedPayload.
 */
export async function encrypt(plaintext: string): Promise<EncryptedPayload> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)

  // GCM appends the 16-byte auth tag to the ciphertext
  const fullBuffer = new Uint8Array(encrypted)
  const ciphertext = fullBuffer.slice(0, fullBuffer.length - 16)
  const tag = fullBuffer.slice(fullBuffer.length - 16)

  return {
    iv: Buffer.from(iv).toString('base64'),
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    tag: Buffer.from(tag).toString('base64'),
  }
}

/**
 * Decrypt an EncryptedPayload back to plaintext.
 * Throws if the auth tag doesn't match (tampered data).
 */
export async function decrypt(payload: EncryptedPayload): Promise<string> {
  const key = await getEncryptionKey()
  const iv = Buffer.from(payload.iv, 'base64')
  const ciphertext = Buffer.from(payload.ciphertext, 'base64')
  const tag = Buffer.from(payload.tag, 'base64')

  // GCM expects ciphertext + tag concatenated
  const combined = new Uint8Array(ciphertext.length + tag.length)
  combined.set(ciphertext)
  combined.set(tag, ciphertext.length)

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined)

  return new TextDecoder().decode(decrypted)
}

/**
 * Encrypt a JavaScript object as JSON.
 */
export async function encryptObject<T>(obj: T): Promise<EncryptedPayload> {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypt an EncryptedPayload back to a typed object.
 */
export async function decryptObject<T>(payload: EncryptedPayload): Promise<T> {
  const json = await decrypt(payload)
  return JSON.parse(json) as T
}
