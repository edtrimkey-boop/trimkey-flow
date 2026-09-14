'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '◈' },
  { href: '/dashboard/transactions', label: 'Transactions', icon: '⇄' },
  { href: '/dashboard/payments', label: 'Payments', icon: '₹' },
  { href: '/dashboard/merchants', label: 'Merchants', icon: '🏪' },
  { href: '/dashboard/applications', label: 'Applications', icon: '⬡' },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: '⌘' },
  { href: '/dashboard/domains', label: 'Domains', icon: '◎' },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: '⟳' },
  { href: '/dashboard/docs', label: 'Docs', icon: '📖' },
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
    <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col h-full select-none">
      {/* Brand */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
            TK
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold tracking-tight">Trim Key Flow</p>
            <p className="text-muted-foreground text-xs">V1 Orchestrator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <span className="text-sm w-4 text-center leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="px-3 py-1">
          <p className="text-muted-foreground text-xs truncate font-mono">{userEmail || 'Admin User'}</p>
        </div>
        <Separator />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-normal"
        >
          Sign out
        </Button>
      </div>
    </aside>
  )
}
