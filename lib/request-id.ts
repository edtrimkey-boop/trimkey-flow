// ============================================================
// Trim Key Flow — Request ID
// Every API request gets a unique, traceable request ID
// Format: req_<timestamp_base36><random>
// ============================================================

import { randomBytes } from 'crypto'

const REQUEST_ID_PREFIX = 'req_'
const REQUEST_ID_REGEX = /^req_[a-z0-9]{16,}$/

/**
 * Generate a new request ID.
 * Format: req_<8-char timestamp base36><8-char random hex>
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36).padStart(8, '0')
  const random = randomBytes(8).toString('hex')
  return `${REQUEST_ID_PREFIX}${timestamp}${random}`
}

/**
 * Validate an incoming request ID from client.
 * Must be prefixed with req_ and contain only safe chars.
 */
export function isValidRequestId(id: string): boolean {
  return REQUEST_ID_REGEX.test(id) && id.length <= 64
}

/**
 * Extract or generate a request ID from headers.
 * Prefers X-Request-ID header if valid, otherwise generates one.
 */
export function resolveRequestId(headers: Headers): string {
  const provided = headers.get('x-request-id')
  if (provided && isValidRequestId(provided)) {
    return provided
  }
  return generateRequestId()
}
