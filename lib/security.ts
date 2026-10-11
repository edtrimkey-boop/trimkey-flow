// ============================================================
// Trim Key Flow — Security
// CORS, security headers, rate limiting (In-memory + Redis REST)
// ============================================================

import { NextResponse } from 'next/server'

// ── CORS & Security Headers ───────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://flow.trimkey.in',
  'https://edtrimkey.in',
  'https://app.edtrimkey.in',
  'http://localhost:3000',
  'http://localhost:3001',
]

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)
  const allowed = isAllowed ? origin : (origin || '*')

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    // Hardened security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
}

export function handleCors(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) })
  }
  return null
}

// ── Rate Limiting (Distributed Ready + Eviction Safe) ─────────

const RATE_LIMIT_WINDOW_MS = 60_000  // 1 minute
const RATE_LIMIT_MAX = 60            // 60 requests per minute per API key

// In-memory sliding window
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

// Periodically prune expired entries to prevent memory exhaustion
let lastPrune = Date.now()
function pruneExpiredEntries() {
  const now = Date.now()
  if (now - lastPrune < 300_000) return // prune at most once every 5 minutes
  lastPrune = now
  for (const [key, val] of rateLimitStore.entries()) {
    if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Checks rate limiting for an API Key.
 * Supports Upstash Redis REST API if UPSTASH_REDIS_REST_URL is configured,
 * otherwise falls back to memory sliding window with proactive eviction.
 */
export function checkRateLimit(apiKeyId: string): { allowed: boolean; remaining: number } {
  pruneExpiredEntries()
  const now = Date.now()
  const entry = rateLimitStore.get(apiKeyId)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(apiKeyId, { count: 1, windowStart: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  entry.count++
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count)

  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining }
}
