// ============================================================
// Trim Key Flow — Supabase Server Client
// Used in Server Components, Route Handlers, Server Actions
// Reads/writes cookies for Supabase Auth session
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any),
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
            // The middleware will refresh the session
          }
        },
      },
    },
  )
}
