'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">TK</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Trim Key Flow</p>
            <p className="text-gray-500 text-xs">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-indigo-950 text-indigo-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <span className="text-base w-4 text-center leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-800">
        <div className="px-3 py-2">
          <p className="text-gray-400 text-xs truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
