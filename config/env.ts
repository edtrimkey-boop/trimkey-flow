// ============================================================
// Trim Key Flow — Environment Configuration
// Validates all required server-side secrets at startup.
// Fails fast with a clear message if anything is missing.
// NEVER use NEXT_PUBLIC_* for server secrets.
// ============================================================

import { z } from 'zod'

const serverEnvSchema = z.object({
  // ── Supabase (server-only) ──
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // ── Trim Key Flow ──
  FLOW_ENCRYPTION_KEY: z
    .string()
    .min(32, 'FLOW_ENCRYPTION_KEY must be at least 32 chars (base64 of 32 bytes)'),

  // ── Razorpay ──
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required'),

  // ── URLs ──
  FLOW_API_BASE_URL: z.string().url().default('https://flow.trimkey.in'),
})

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
})

// Validate on first import (server-side only)
function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    throw new Error(
      `\n[Trim Key Flow] Missing or invalid environment variables:\n${errors.join('\n')}\n\nSee .env.example for required variables.\n`,
    )
  }
  return result.data
}

// Lazy singleton — validates once, cached
let _serverEnv: ReturnType<typeof validateServerEnv> | null = null

export function getServerEnv() {
  if (!_serverEnv) {
    _serverEnv = validateServerEnv()
  }
  return _serverEnv
}

// Public env (safe for client components — validated at build time)
export const publicEnv = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
}
