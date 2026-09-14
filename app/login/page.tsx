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
    <div className="min-h-screen flex items-center justify-center bg-[#0B111E] px-4 select-none relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#26C3EA]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[430px] z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#141E30] border border-white/10 p-2 shadow-[0_0_25px_rgba(38,195,234,0.4)] mb-4">
            <img
              src="https://wjvoetdkkggyhtcoqqcj.supabase.co/storage/v1/object/public/Ed%20Trim%20Key/TRIM%20KEY%20FAVICON.png"
              alt="Trim Key"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-heading font-extrabold text-2xl tracking-wider text-white uppercase">
            Trim Key Flow
          </h1>
          <p className="text-xs font-semibold text-[#26C3EA] tracking-widest uppercase mt-1">
            Payment Infrastructure Platform
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-gradient-to-br from-[#141E30] to-[#0B111E] border border-white/[0.1] rounded-2xl p-8 sm:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <div className="border-b border-white/[0.08] pb-4 mb-6">
            <h2 className="font-heading font-extrabold text-base uppercase tracking-wider text-white">
              Sign In to Command Center
            </h2>
            <p className="text-xs text-[#94A3B8] font-medium mt-1">
              Authorized admin access only
            </p>
          </div>

          {magicSent ? (
            <div className="text-center py-6 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2ECC71]/15 text-[#2ECC71] text-xl font-bold border border-[#2ECC71]/30">
                ✓
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Magic Link Dispatched</h3>
              <p className="text-xs text-[#94A3B8] font-medium">
                Check your inbox for a direct sign-in link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@trimkey.in"
                  className="w-full bg-[#1D2C46] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-[#26C3EA] focus:ring-2 focus:ring-[#26C3EA]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#1D2C46] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-[#26C3EA] focus:ring-2 focus:ring-[#26C3EA]/20 transition-all"
                />
              </div>

              {error && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3 text-[#EF4444] text-xs font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-[#000] bg-gradient-to-r from-[#26C3EA] to-[#1A9CBF] hover:shadow-[0_8px_25px_rgba(38,195,234,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating…' : 'Sign In'}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#94A3B8]">
                  <span className="bg-[#141E30] px-3">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#26C3EA] bg-transparent hover:bg-[#26C3EA]/10 border border-[#26C3EA]/40 transition-all cursor-pointer"
              >
                Send Magic Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
