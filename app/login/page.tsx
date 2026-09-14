'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { loginAction, magicLinkAction } from './actions'
import { Logo } from '@/components/ui/logo'

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loginBox">
         <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px' }}><Logo glow={true} /></div>
            </div>
            <h2 className="brand" style={{ justifyContent: 'center', fontSize: '24px' }}>Trim Key Flow</h2>
            <p style={{ color: 'var(--brand)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '5px' }}>
               Command Center
            </p>
         </div>

         {magicSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
               <h3 style={{ color: 'var(--success)', marginBottom: '10px' }}>Magic Link Sent!</h3>
               <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Check your inbox to sign in.</p>
            </div>
         ) : (
            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
               <label className="label-text" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Email Address</label>
               <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
               
               <label className="label-text" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginTop: '10px' }}>Password</label>
               <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />

               {error && <div style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 700, marginBottom: '15px' }}>{error}</div>}

               <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                  {loading ? 'Authenticating...' : 'Sign In Securely'}
               </button>

               <div style={{ textAlign: 'center', margin: '20px 0', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                  — OR —
               </div>

               <button type="button" onClick={handleMagicLink} disabled={loading} className="btn-outline" style={{ width: '100%' }}>
                  Send Magic Link
               </button>
            </form>
         )}
      </div>
    </div>
  )
}
