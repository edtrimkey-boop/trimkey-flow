import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import React from 'react'

async function getDashboardStats(organizationId: string) {
  const db = createAdminClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [todayPayments, monthPayments, successCount, failedCount, processingCount] =
    await Promise.all([
      db.from('payments').select('amount', { count: 'exact' }).gte('created_at', todayStart),
      db.from('payments').select('amount', { count: 'exact' }).gte('created_at', monthStart),
      db.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'SUCCESS').gte('created_at', monthStart),
      db.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'FAILED').gte('created_at', monthStart),
      db.from('payments').select('*', { count: 'exact', head: true }).in('status', ['PENDING', 'PROCESSING']),
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
    : { todayVolume: 0, monthVolume: 0, successCount: 0, failedCount: 0, processingCount: 0, todayCount: 0 }

  return (
    <>
      <div id="panelOverview" className="panel active">
          
          <div className="premium-sticky-header">
              <h2>Dashboard Overview</h2>
          </div>
          
          <div className="grid-3" style={{ marginBottom: '25px' }}>
              <div className="glass-box nav-pill-box" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div className="glass-circle-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                  </div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '5px', letterSpacing: '1px' }}>Today's Revenue</h4>
                  <h2 id="uiTodayRevenueCard" style={{ fontSize: '36px', fontWeight: 900, marginBottom: '15px' }}>{formatAmount(stats.todayVolume)}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(46,204,113,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(46,204,113,0.2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                      <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase' }}>{stats.todayCount} payments today</span>
                  </div>
              </div>
              
              <div className="glass-box nav-pill-box" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div className="glass-circle-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg></div>
                  </div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '5px', letterSpacing: '1px' }}>Month Volume</h4>
                  <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '15px', color: 'var(--brand)' }}>{formatAmount(stats.monthVolume)}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,251,166,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(0,251,166,0.2)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--brand)', fontWeight: 800, textTransform: 'uppercase' }}>All Transactions</span>
                  </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--success)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="var(--success)"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '5px', letterSpacing: '1px' }}>Successful Payments</h4>
                  <h2 id="uiTotalEarnedCard" style={{ color: 'var(--success)', fontSize: '36px', fontWeight: 900, marginBottom: '15px', textShadow: '0 0 20px rgba(46, 204, 113, 0.4)' }}>{stats.successCount}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(46,204,113,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(46,204,113,0.2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase' }}>Auto-Payout Active</span>
                  </div>
              </div>
          </div>
          
      </div>

      <RecentPayments />
    </>
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

