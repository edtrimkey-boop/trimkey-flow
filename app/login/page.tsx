'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { loginAction, magicLinkAction } from './actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    try {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch (err) {
      // In Next.js, redirect() throws a NEXT_REDIRECT error which is caught by Next.js router
      // If it's a redirect, let it bubble up
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('NEXT_REDIRECT')) {
        return
      }
      setError(message || 'An unexpected error occurred during sign in.')
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Enter your email first')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const redirectTo = `${window.location.origin}/dashboard`
      const result = await magicLinkAction(email, redirectTo)
      if (result.error) {
        setError(result.error)
      } else {
        setMagicSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
