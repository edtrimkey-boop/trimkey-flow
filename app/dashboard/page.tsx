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

  const kpis = [
    { label: "Today's Payments", value: stats.todayCount.toString(), sub: formatAmount(stats.todayVolume), borderClass: 'b-brand' },
    { label: 'Month Volume', value: formatAmount(stats.monthVolume), sub: 'All transactions', borderClass: 'b-info' },
    { label: 'Successful', value: stats.successCount.toString(), sub: 'Captured successfully', borderClass: 'b-success' },
    { label: 'Failed', value: stats.failedCount.toString(), sub: 'Requires inspection', borderClass: 'b-danger' },
    { label: 'Processing', value: stats.processingCount.toString(), sub: 'Awaiting webhook', borderClass: 'b-accent' },
  ]

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase">
            Overview & Telemetry
          </h1>
          <p className="text-xs md:text-sm font-medium text-[#94A3B8] mt-1">
            Real-time transaction volumes and gateway health indicators
          </p>
        </div>

        <Link
          href="/dashboard/transactions"
          className="btn-brand inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold shadow-sm w-fit"
        >
          <span>View All Transactions</span>
          <span>→</span>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`kpi-card ${kpi.borderClass}`}>
            <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#94A3B8] mb-2">
              {kpi.label}
            </h4>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 text-white">
              {kpi.value}
            </h2>
            <p className="text-[11px] font-semibold text-[#94A3B8] opacity-80">
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Payments Panel */}
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
    <div className="bg-[#141E30] rounded-2xl border border-white/[0.08] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm font-extrabold tracking-wider uppercase text-[#26C3EA]">
            Recent Transactions
          </h3>
          <p className="text-[11px] font-medium text-[#94A3B8] mt-0.5">
            Latest payments processed through Flow Orchestration
          </p>
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[#94A3B8]">
          Live Ledger
        </span>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {(payments ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#94A3B8] text-sm font-semibold">No transactions recorded yet.</p>
            <p className="text-xs text-[#94A3B8]/60 mt-1">Dispatched API calls will show here in real-time.</p>
          </div>
        ) : (
          (payments ?? []).map((p: Record<string, unknown>) => (
            <div
              key={p.payment_number as string}
              className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-1">
                <p className="font-mono text-xs font-bold text-white tracking-wide">
                  {p.payment_number as string}
                </p>
                <p className="text-[11px] font-medium text-[#94A3B8]">
                  {(p.merchants as { name: string } | null)?.name ?? 'Default Merchant'}
                </p>
              </div>

              <div className="text-right space-y-1.5">
                <p className="font-bold text-sm text-white">
                  ₹{(Number(p.amount) / 100).toFixed(2)}
                </p>
                <StatusBadge status={p.status as string} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/30',
    FAILED: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    PENDING: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
    PROCESSING: 'bg-[#26C3EA]/15 text-[#26C3EA] border-[#26C3EA]/30',
    REFUNDED: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
  }

  const cls = styles[status] ?? 'bg-white/10 text-white/80 border-white/20'

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  )
}
