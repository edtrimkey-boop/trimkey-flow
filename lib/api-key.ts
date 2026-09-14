// ============================================================
// Trim Key Flow — API Key Authentication
// Bearer tk_live_xxxxx → ApiKeyContext
//
// Flow:
//   Authorization header
//     → Extract key
//     → Validate format
//     → Hash with SHA-256
//     → Lookup api_keys by key_prefix + secret_hash
//     → Check status (active / revoked / expired)
//     → Resolve application → organization → permissions
// ============================================================

import { createHash, randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import type { ApiKeyContext } from '@/types/api'
import type { ApiKey, Application } from '@/types/database'

const KEY_PREFIX_LIVE = 'tk_live_'
const KEY_PREFIX_TEST = 'tk_test_'
const KEY_SECRET_LENGTH = 32 // bytes → 64 hex chars

// ── Key Generation ────────────────────────────────────────────

export interface GeneratedApiKey {
  fullSecret: string    // shown ONCE to user: tk_live_<64hex>
  keyPrefix: string     // stored: tk_live_xxxx (first 12 chars of secret part)
  secretHash: string    // stored: SHA-256 of fullSecret
}

/**
 * Generate a new API key.
 * The full secret is NEVER stored — only the hash.
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): GeneratedApiKey {
  const secretPart = randomBytes(KEY_SECRET_LENGTH).toString('hex') // 64 chars
  const prefix = environment === 'live' ? KEY_PREFIX_LIVE : KEY_PREFIX_TEST
  const fullSecret = `${prefix}${secretPart}`
  const keyPrefix = fullSecret.substring(0, 16) // e.g. tk_live_xxxxxxxx
  const secretHash = hashSecret(fullSecret)

  return { fullSecret, keyPrefix, secretHash }
}

/**
 * SHA-256 hash of the full secret key.
 */
export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

// ── Header Parsing ────────────────────────────────────────────

/**
 * Extract the Bearer token from Authorization header.
 */
export function extractBearerToken(headers: Headers): string | null {
  const auth = headers.get('authorization')
  if (!auth) return null
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

/**
 * Validate the format of an API key.
 */
export function isValidKeyFormat(key: string): boolean {
  return (
    (key.startsWith(KEY_PREFIX_LIVE) || key.startsWith(KEY_PREFIX_TEST)) &&
    key.length >= KEY_PREFIX_LIVE.length + 20
  )
}

// ── Authentication ────────────────────────────────────────────

/**
 * Full API key authentication pipeline.
 * Throws FlowError on any failure.
 */
export async function authenticateApiKey(headers: Headers): Promise<ApiKeyContext> {
  const token = extractBearerToken(headers)
  if (!token) {
    throw new FlowError(ErrorCode.UNAUTHORIZED, 'Missing Authorization header', 401)
  }

  if (!isValidKeyFormat(token)) {
    throw new FlowError(ErrorCode.UNAUTHORIZED, 'Invalid API key format', 401)
  }

  const keyPrefix = token.substring(0, 16)
  const secretHash = hashSecret(token)

  const db = createAdminClient()

  // 1. Look up the API key
  const { data: apiKey, error } = await db
    .from('api_keys')
    .select('*, applications(id, organization_id, status, environment, webhook_url, name)')
    .eq('key_prefix', keyPrefix)
    .eq('secret_hash', secretHash)
    .single<ApiKey & { applications: Application }>()

  if (error || !apiKey) {
    throw new FlowError(ErrorCode.UNAUTHORIZED, 'Invalid API key', 401)
  }

  // 2. Check status
  if (apiKey.status === 'revoked') {
    throw new FlowError(ErrorCode.API_KEY_REVOKED, 'API key has been revoked', 401)
  }

  if (apiKey.status === 'expired' || (apiKey.expires_at && new Date(apiKey.expires_at) < new Date())) {
    throw new FlowError(ErrorCode.API_KEY_EXPIRED, 'API key has expired', 401)
  }

  // 3. Check application is active
  if (!apiKey.applications || apiKey.applications.status !== 'active') {
    throw new FlowError(ErrorCode.FORBIDDEN, 'Application is not active', 403)
  }

  // 4. Update last_used_at (fire and forget — don't block the request)
  void Promise.resolve(
    db.from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)
  ).catch(() => {})

  return {
    api_key_id: apiKey.id,
    application_id: apiKey.application_id,
    organization_id: apiKey.applications.organization_id,
    environment: apiKey.environment,
    permissions: (apiKey.permissions as string[]) ?? [],
  }
}
