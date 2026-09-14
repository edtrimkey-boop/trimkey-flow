import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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
      <div className="panel" style={{ paddingBottom: '10px' }}>
         <div className="panel-header">
            <h3>Overview & Telemetry</h3>
            <Link href="/dashboard/transactions" className="liquid-glass" style={{ padding: '10px 20px', fontSize: '11px', fontWeight: 800 }}>
                View All Transactions
            </Link>
         </div>
         <div className="grid-kpis">
            <div className="kpi-card b-brand">
               <h4>Today's Payments</h4>
               <h2>{stats.todayCount}</h2>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Vol: {formatAmount(stats.todayVolume)}</p>
            </div>
            <div className="kpi-card b-info">
               <h4>Month Volume</h4>
               <h2>{formatAmount(stats.monthVolume)}</h2>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>All transactions</p>
            </div>
            <div className="kpi-card b-success">
               <h4>Successful</h4>
               <h2>{stats.successCount}</h2>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Captured successfully</p>
            </div>
            <div className="kpi-card b-danger">
               <h4>Failed</h4>
               <h2>{stats.failedCount}</h2>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Requires inspection</p>
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
    <div className="panel">
       <div className="panel-header">
          <h3>Recent Transactions</h3>
          <span className="flat-pill bg-info">Live Ledger</span>
       </div>
       
       <div className="tk-table-wrapper">
          <table className="tk-sleek-table">
             <thead>
                <tr>
                   <th>Payment ID</th>
                   <th>Merchant</th>
                   <th>Amount</th>
                   <th>Status</th>
                   <th>Time</th>
                </tr>
             </thead>
             <tbody>
                {(!payments || payments.length === 0) ? (
                   <tr>
                      <td colSpan={5} style={{ textAlign: 'center', opacity: 0.5 }}>No transactions found</td>
                   </tr>
                ) : (
                   payments.map((p: any) => (
                      <tr key={p.payment_number}>
                         <td style={{ fontFamily: 'monospace', color: 'var(--brand)' }}>{p.payment_number}</td>
                         <td>{p.merchants?.name || 'Default Merchant'}</td>
                         <td style={{ fontWeight: 900 }}>₹{(p.amount / 100).toFixed(2)}</td>
                         <td><StatusBadge status={p.status} /></td>
                         <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
  return <span className={`badge ${cls}`}>{status}</span>
}
