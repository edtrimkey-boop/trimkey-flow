import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import React from 'react'

async function getDashboardStats(organizationId: string) {
  const db = createAdminClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [todayPayments, monthPayments, successCount, failedCount, processingCount, activeRules, activeApps] =
    await Promise.all([
      db.from('payments').select('amount', { count: 'exact' }).gte('created_at', todayStart),
      db.from('payments').select('amount', { count: 'exact' }).gte('created_at', monthStart),
      db.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'SUCCESS').gte('created_at', monthStart),
      db.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'FAILED').gte('created_at', monthStart),
      db.from('payments').select('*', { count: 'exact', head: true }).in('status', ['PENDING', 'PROCESSING']),
      db.from('routing_rules').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ])

  const todayVolume = (todayPayments.data ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)
  const monthVolume = (monthPayments.data ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)

  return {
    todayVolume,
    monthVolume,
    successCount: successCount.count ?? 0,
    failedCount: failedCount.count ?? 0,
    processingCount: processingCount.count ?? 0,
    todayCount: todayPayments.count ?? 0,
    activeRules: activeRules.count ?? 0,
    activeApps: activeApps.count ?? 0,
  }
}

function formatAmount(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createAdminClient()
  const { data: member } = await db
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .maybeSingle<{ organization_id: string }>()

  const stats = member
    ? await getDashboardStats(member.organization_id)
    : { todayVolume: 0, monthVolume: 0, successCount: 0, failedCount: 0, processingCount: 0, todayCount: 0, activeRules: 0, activeApps: 0 }

  return (
    <div className="space-y-6">
      <div style={{ marginBottom: '5px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>Welcome back to Trim Key Flow</h2>
      </div>
      
      {/* 4 KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          
          <div className="glass-box nav-pill-box" style={{ padding: '20px', borderTop: '2px solid var(--brand)' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '5px', letterSpacing: '1px' }}>Today's Revenue</h4>
              <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '15px' }}>{formatAmount(stats.todayVolume)}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(38,195,234,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(38,195,234,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  <span style={{ fontSize: '10px', color: 'var(--brand)', fontWeight: 800, textTransform: 'uppercase' }}>{stats.todayCount} payments today</span>
              </div>
          </div>
          
          <div className="glass-box nav-pill-box" style={{ padding: '20px', borderTop: '2px solid var(--success)' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '5px', letterSpacing: '1px' }}>Month Volume</h4>
              <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '15px' }}>{formatAmount(stats.monthVolume)}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(46,204,113,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(46,204,113,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>
                  <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase' }}>All Transactions</span>
              </div>
          </div>

          <div className="glass-box nav-pill-box" style={{ padding: '20px', borderTop: '2px solid var(--info)' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '5px', letterSpacing: '1px' }}>Successful Payments</h4>
              <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '15px' }}>{stats.successCount}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(41,128,185,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(41,128,185,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span style={{ fontSize: '10px', color: 'var(--info)', fontWeight: 800, textTransform: 'uppercase' }}>Secure processing</span>
              </div>
          </div>

          <div className="glass-box nav-pill-box" style={{ padding: '20px', borderTop: '2px solid var(--warning)' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '5px', letterSpacing: '1px' }}>Active Rules & Apps</h4>
              <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '15px' }}>{stats.activeRules} / {stats.activeApps}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(243,156,18,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(243,156,18,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <span style={{ fontSize: '10px', color: 'var(--warning)', fontWeight: 800, textTransform: 'uppercase' }}>Routing Active</span>
              </div>
          </div>
      </div>

      {/* Quick Access Actions */}
      <div className="panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
              <Link href="/dashboard/merchants" className="btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px', textAlign: 'center', textDecoration: 'none' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'white' }}>Connect Merchant</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Stripe, Razorpay, etc.</div>
                  </div>
              </Link>
              
              <Link href="/dashboard/applications" className="btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px', textAlign: 'center', textDecoration: 'none' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'white' }}>Create Application</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Setup a new integration</div>
                  </div>
              </Link>

              <Link href="/dashboard/api-keys" className="btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px', textAlign: 'center', textDecoration: 'none' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                  <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'white' }}>Generate API Key</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>For backend access</div>
                  </div>
              </Link>

              <Link href="/dashboard/router" className="btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px', textAlign: 'center', textDecoration: 'none' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                  <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'white' }}>Smart Router</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Configure routing rules</div>
                  </div>
              </Link>
          </div>
      </div>

      <RecentPayments />
    </div>
  )
}

async function RecentPayments() {
  const db = createAdminClient()
  const { data: payments } = await db
    .from('payments')
    .select('payment_number, amount, currency_code, status, created_at, merchants(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="panel" style={{ borderLeft: '4px solid var(--success)' }}>
       <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: 'none', marginBottom: '10px', paddingBottom: 0 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Transaction Ledger
          </h3>
          <span className="flat-pill bg-info">Live Ledger</span>
       </div>
       
       <div className="tk-table-wrapper" style={{ overflowX: 'auto', background: 'var(--card-light)', borderRadius: 'var(--radius-lg)', padding: '2px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}>
          <table className="tk-sleek-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
             <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                   <th style={{ padding: '15px 20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Payment ID</th>
                   <th style={{ padding: '15px 20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Merchant</th>
                   <th style={{ padding: '15px 20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Amount</th>
                   <th style={{ padding: '15px 20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Status</th>
                   <th style={{ padding: '15px 20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Time</th>
                </tr>
             </thead>
             <tbody>
                {(!payments || payments.length === 0) ? (
                   <tr>
                      <td colSpan={5} style={{ padding: '20px', textAlign: 'center', opacity: 0.5, color: 'white' }}>No transactions found</td>
                   </tr>
                ) : (
                   payments.map((p: any) => (
                      <tr key={p.payment_number} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: '0.2s ease' }}>
                         <td style={{ padding: '15px 20px', fontFamily: 'monospace', color: 'var(--brand)', fontSize: '13px' }}>{p.payment_number}</td>
                         <td style={{ padding: '15px 20px', color: 'white', fontWeight: 600, fontSize: '13px' }}>{p.merchants?.name || 'Default Merchant'}</td>
                         <td style={{ padding: '15px 20px', fontWeight: 900, color: 'white', fontSize: '14px' }}>₹{(p.amount / 100).toFixed(2)}</td>
                         <td style={{ padding: '15px 20px' }}><StatusBadge status={p.status} /></td>
                         <td style={{ padding: '15px 20px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(p.created_at).toLocaleString()}
                         </td>
                      </tr>
                   ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: 'bg-success',
    FAILED: 'bg-danger',
    PENDING: 'bg-warning',
    PROCESSING: 'bg-info',
    REFUNDED: 'bg-purple',
  }
  
  const cls = styles[status] || 'bg-info'
  return <span className={`badge ${cls}`} style={{ padding: '6px 12px', borderRadius: '50px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{status}</span>
}
