'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'

const pathTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/transactions': 'Transactions Ledger',
  '/dashboard/payments': 'Payments',
  '/dashboard/merchants': 'Merchants & Providers',
  '/dashboard/applications': 'Applications',
  '/dashboard/api-keys': 'API Keys Management',
  '/dashboard/domains': 'Allowed Domains',
  '/dashboard/webhooks': 'Webhook Deliveries',
  '/dashboard/docs': 'API Documentation',
  '/dashboard/settings': 'System Settings',
}

export function Header({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const title = pathTitles[pathname] ?? 'Command Center'

  const userInitial = (userEmail ? userEmail.charAt(0) : 'T').toUpperCase()

  return (
    <header className="h-[72px] sticky top-0 z-40 flex items-center justify-between px-8 bg-[#0B111E]/70 backdrop-blur-xl border-b border-white/[0.06]">
      {/* Left: Glass Title Pill */}
      <div className="glass-title-pill">
        <div className="w-[32px] h-[32px] rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
          <img
            src="https://wjvoetdkkggyhtcoqqcj.supabase.co/storage/v1/object/public/Ed%20Trim%20Key/TRIM%20KEY%20FAVICON.png"
            alt="Trim Key"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-white/90">
          Trim Key Flow
        </span>
        <div className="w-[1px] h-4 bg-white/20" />
        <span className="text-xs font-semibold text-[#26C3EA]">
          {title}
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Live Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ECC71] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2ECC71]"></span>
          </span>
          <span className="text-white/80">Flow Gateway v1.0</span>
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all cursor-default">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#26C3EA] to-[#8B5CF6] flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0">
            {userInitial}
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-white/80 max-w-[180px] truncate">
            {userEmail || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  )
}
