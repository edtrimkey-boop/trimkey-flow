// ============================================================
// Trim Key Flow — Supabase Browser Client
// Used in client components (no server secrets)
// ============================================================

import { createBrowserClient } from '@supabase/ssr'

const DEFAULT_SUPABASE_URL = 'https://jaspyjriophxwkxexfcj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphc3B5anJpb3BoeHdreGV4ZmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNTk0MzIsImV4cCI6MjEwNDkzNTQzMn0.bAGce-PHx9wl9QglhPPyszB9LjBhG-qAYghz23442XA'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  return createBrowserClient(url, key)
}
