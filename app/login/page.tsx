'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleMagicLink() {
    if (!email) { setError('Enter your email first'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } })
    setLoading(false)
    if (error) setError(error.message)
    else setMagicSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TK</span>
            </div>
            <span className="text-white font-semibold text-xl">Trim Key Flow</span>
          </div>
          <p className="text-gray-400 text-sm">Payment Infrastructure Platform</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h1 className="text-white font-semibold text-lg mb-6">Sign in to your account</h1>

          {magicSent ? (
            <div className="text-center py-4">
              <div className="text-green-400 text-sm mb-2">✓ Magic link sent</div>
              <p className="text-gray-400 text-sm">Check your email for a sign-in link.</p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-500">
                  <span className="bg-gray-900 px-2">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="w-full border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg py-2 text-sm transition-colors"
              >
                Send magic link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
