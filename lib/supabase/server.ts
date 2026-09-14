// ============================================================
// Trim Key Flow — Supabase Server Client
// Used in Server Components, Route Handlers, Server Actions
// Reads/writes cookies for Supabase Auth session
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEFAULT_SUPABASE_URL = 'https://jaspyjriophxwkxexfcj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphc3B5anJpb3BoeHdreGV4ZmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNTk0MzIsImV4cCI6MjEwNDkzNTQzMn0.bAGce-PHx9wl9QglhPPyszB9LjBhG-qAYghz23442XA'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

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
