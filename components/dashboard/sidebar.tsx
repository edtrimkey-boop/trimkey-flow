'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/dashboard/transactions', label: 'Payments', icon: '⇄' },
  { href: '/dashboard/merchants', label: 'Merchants', icon: '🏪' },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: '⌘' },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: '⟳' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
]

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="sidebar" id="sidebar">
      <div className="brandRow" style={{ padding: '0 30px', marginBottom: '40px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px' }}><Logo glow={true} /></div>
            <span className="brand" style={{ fontSize: '18px', fontWeight: 900 }}>Trim Key</span>
         </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {navItems.map((item) => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>

      <div style={{ padding: '20px 30px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
         <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '15px', wordBreak: 'break-all' }}>
            {userEmail || 'admin@trimkey.in'}
         </p>
         <button onClick={handleSignOut} className="logout-btn" style={{ width: '100%' }}>
            Sign Out
         </button>
      </div>
    </div>
  )
}
