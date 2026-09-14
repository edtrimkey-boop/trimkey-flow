'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '◈' },
  { href: '/dashboard/transactions', label: 'Transactions', icon: '⇄' },
  { href: '/dashboard/payments', label: 'Payments', icon: '₹' },
  { href: '/dashboard/merchants', label: 'Merchants', icon: '🏪' },
  { href: '/dashboard/applications', label: 'Applications', icon: '⬡' },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: '⌘' },
  { href: '/dashboard/domains', label: 'Domains', icon: '◎' },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: '⟳' },
  { href: '/dashboard/docs', label: 'Documentation', icon: '📖' },
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
    <aside className="w-[260px] bg-[#080D17] border-r border-white/[0.06] flex flex-col h-full select-none flex-shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] overflow-hidden p-1 bg-[#141E30] border border-white/10 shadow-[0_0_15px_rgba(38,195,234,0.4)] flex-shrink-0">
            <img
              src="https://wjvoetdkkggyhtcoqqcj.supabase.co/storage/v1/object/public/Ed%20Trim%20Key/TRIM%20KEY%20FAVICON.png"
              alt="Trim Key"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-sm tracking-wider text-white">
              TRIM KEY FLOW
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#26C3EA]">
              Command Center
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-6 py-3.5 text-xs font-semibold tracking-wide transition-all border-l-4 ${
                active
                  ? 'text-[#26C3EA] border-[#26C3EA] bg-gradient-to-r from-[#26C3EA]/15 to-transparent [text-shadow:0_0_10px_rgba(38,195,234,0.4)] font-bold'
                  : 'text-[#94A3B8] border-transparent hover:text-white hover:bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <span className="text-base w-4 text-center leading-none opacity-80">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-4 border-t border-white/[0.06] space-y-2">
        <div className="px-2 py-1">
          <p className="text-[11px] font-mono text-[#94A3B8] truncate">{userEmail || 'admin@trimkey.in'}</p>
          <span className="text-[9px] font-extrabold uppercase text-[#2ECC71] tracking-wider bg-[#2ECC71]/10 px-2 py-0.5 rounded mt-1 inline-block">
            Authorized
          </span>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full mt-2 py-2.5 px-3 rounded-lg text-xs font-bold text-[#EF4444] bg-[#EF4444]/10 hover:bg-gradient-to-r hover:from-[#EF4444] hover:to-[#B91C1C] hover:text-white border border-[#EF4444]/20 hover:border-transparent transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>⎋</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
