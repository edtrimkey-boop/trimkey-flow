'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { loginAction, magicLinkAction } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-base shadow-sm">
              TK
            </div>
            <span className="text-foreground font-semibold text-2xl tracking-tight">Trim Key Flow</span>
          </div>
          <p className="text-muted-foreground text-sm">Payment Infrastructure & Orchestration</p>
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {magicSent ? (
              <div className="text-center py-6 space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-lg font-bold">
                  ✓
                </div>
                <h3 className="text-base font-medium text-foreground">Magic link sent</h3>
                <p className="text-muted-foreground text-sm">Check your email for a sign-in link.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@trimkey.in"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="bg-background"
                  />
                </div>

                {error && (
                  <div className="bg-destructive/15 border border-destructive/30 rounded-md p-3 text-destructive text-sm font-medium">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="w-full"
                >
                  Send magic link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
