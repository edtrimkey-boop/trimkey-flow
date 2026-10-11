'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function magicLinkAction(email: string, redirectTo: string): Promise<{ error?: string; success?: boolean }> {
  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function logoutAction(): Promise<{ error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    await supabase.auth.signOut().catch(() => {})
    const allCookies = cookieStore.getAll()
    for (const c of allCookies) {
      if (
        c.name.startsWith('sb-') ||
        c.name.includes('auth') ||
        c.name.includes('token') ||
        c.name.includes('supabase')
      ) {
        cookieStore.delete(c.name)
      }
    }
    return {}
  } catch (err: any) {
    return { error: err?.message || 'Failed to sign out' }
  }
}
