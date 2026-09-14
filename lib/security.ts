// ============================================================
// Trim Key Flow — Security
// CORS, origin validation, basic rate limiting
// ============================================================

import { NextResponse } from 'next/server'

// ── CORS ──────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://flow.trimkey.in',
  'https://edtrimkey.in',
  'https://app.edtrimkey.in',
  'http://localhost:3000',
  'http://localhost:3001',
]

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, X-Request-ID',
    'Access-Control-Max-Age': '86400',
  }
}

export function handleCors(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) })
  }
  return null
}

// ── Rate Limiting (Supabase-backed, V1) ────────────────────────
// For V1, we log repeated failures but don't hard block at the
// application layer. Vercel Edge / WAF should handle volumetric
// attacks. A proper Redis-backed rate limiter can be added later.
//
// Document the limitation clearly per spec §45.

const RATE_LIMIT_WINDOW_MS = 60_000  // 1 minute
const RATE_LIMIT_MAX = 60            // 60 requests per minute per API key

// In-memory sliding window (resets on cold start — acceptable for V1 serverless)
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

/**
 * Simple in-memory rate limiter.
 * Note: resets on serverless cold starts — upgrade to Redis for production scale.
 */
export function checkRateLimit(apiKeyId: string): { allowed: boolean; remaining: number } {
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
