import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

async function clearAllAuthCookies(response?: NextResponse) {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  for (const cookie of allCookies) {
    if (
      cookie.name.startsWith('sb-') ||
      cookie.name.includes('auth') ||
      cookie.name.includes('token') ||
      cookie.name.includes('supabase')
    ) {
      // Delete on server cookieStore
      cookieStore.delete(cookie.name)

      // Also set explicit expired headers on response if provided
      if (response) {
        response.cookies.set({
          name: cookie.name,
          value: '',
          path: '/',
          maxAge: 0,
          expires: new Date(0),
        })
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut().catch(() => {})
  } catch (e) {
    console.error('Server signout error:', e)
  }

  const response = NextResponse.json({ success: true })
  await clearAllAuthCookies(response)
  return response
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut().catch(() => {})
  } catch (e) {
    console.error('Server signout error:', e)
  }

  const loginUrl = new URL('/login', request.url)
  const response = NextResponse.redirect(loginUrl)
  await clearAllAuthCookies(response)
  return response
}
