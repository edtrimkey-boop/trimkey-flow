// ============================================================
// Trim Key Flow — Idempotency
// Prevents duplicate payment orders for the same request.
// Key: (application_id, idempotency_key) → unique constraint in DB
// Header: Idempotency-Key: <client-provided-key>
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import type { Order } from '@/types/database'

const IDEMPOTENCY_HEADER = 'idempotency-key'
const MAX_KEY_LENGTH = 255

/**
 * Extract idempotency key from request headers.
 */
export function extractIdempotencyKey(headers: Headers): string | null {
  const key = headers.get(IDEMPOTENCY_HEADER)
  if (!key) return null
  if (key.length > MAX_KEY_LENGTH) return null
  // Allow alphanumeric, hyphen, underscore
  if (!/^[\w\-]+$/.test(key)) return null
  return key
}

/**
 * Check if an order already exists for this (application_id, idempotency_key) pair.
 * Returns the existing order if found, null if this is a new request.
 */
export async function findExistingOrder(
  applicationId: string,
  idempotencyKey: string,
): Promise<Order | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('orders')
    .select('*')
    .eq('application_id', applicationId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle<Order>()

  if (error || !data) return null
  return data
}
