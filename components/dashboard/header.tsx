'use client'

import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'

const pathTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
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
    <>
      <div className="header-scrim"></div>
      <div className="top-bar glass-surface">
          <div className="brandRow">
              <div className="glass-title-pill">
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'white', padding: '2px' }}>
                     <Logo glow={false} />
                  </div>
                  <span className="brand" style={{ fontSize: '13px' }}>Trim Key Flow</span>
                  <div className="title-separator"></div>
                  <span className="brand" style={{ color: 'var(--brand)', fontWeight: 900, fontSize: '13px' }}>
                     {title}
                  </span>
              </div>
          </div>
          <div>
             <div className="user-profile-container">
                <div className="avatar-circle">{userInitial}</div>
                <div style={{ textAlign: 'left', marginRight: '5px' }} className="hidden md:block">
                    <p style={{ fontSize: '13px', fontWeight: 800, color: 'white', margin: 0 }}>Administrator</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>System Admin</p>
                </div>
             </div>
          </div>
      </div>
    </>
  )
}
