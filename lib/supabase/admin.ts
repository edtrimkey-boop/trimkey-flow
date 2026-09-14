// ============================================================
// Trim Key Flow — Supabase Admin Client
// Uses SERVICE_ROLE_KEY — bypasses Row Level Security
// Typed with the full Database schema for strong type inference.
// ONLY import this in trusted server-side service files.
// NEVER import in client components or browser code.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { getServerEnv } from '@/config/env'
import type { Database } from '@/types/supabase'

let _adminClient: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (_adminClient) return _adminClient

  const env = getServerEnv()

  _adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  return _adminClient
}
