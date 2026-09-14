import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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

  const statCards = [
    { label: "Today's Payments", value: stats.todayCount.toString(), sub: formatAmount(stats.todayVolume), color: 'indigo' },
    { label: 'This Month Volume', value: formatAmount(stats.monthVolume), sub: 'All statuses', color: 'blue' },
    { label: 'Successful', value: stats.successCount.toString(), sub: 'This month', color: 'green' },
    { label: 'Failed', value: stats.failedCount.toString(), sub: 'This month', color: 'red' },
    { label: 'Processing', value: stats.processingCount.toString(), sub: 'In progress', color: 'yellow' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Payment activity summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">{card.label}</p>
            <p className="text-white text-2xl font-semibold">{card.value}</p>
            <p className="text-gray-500 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Payments */}
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-white font-medium text-sm">Recent Payments</h2>
      </div>
      <div className="divide-y divide-gray-800">
        {(payments ?? []).length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No payments yet</p>
        ) : (
          (payments ?? []).map((p: Record<string, unknown>) => (
            <div key={p.payment_number as string} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-mono">{p.payment_number as string}</p>
                <p className="text-gray-500 text-xs">{(p.merchants as { name: string } | null)?.name ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">₹{(Number(p.amount) / 100).toFixed(2)}</p>
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
  const colors: Record<string, string> = {
    SUCCESS: 'text-green-400 bg-green-950',
    FAILED: 'text-red-400 bg-red-950',
    PENDING: 'text-yellow-400 bg-yellow-950',
    PROCESSING: 'text-blue-400 bg-blue-950',
    REFUNDED: 'text-purple-400 bg-purple-950',
    PARTIALLY_REFUNDED: 'text-orange-400 bg-orange-950',
  }
  const cls = colors[status] ?? 'text-gray-400 bg-gray-800'
  return (
    <span className={`inline-flex text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>
      {status}
    </span>
  )
}
