import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    { label: "Today's Payments", value: stats.todayCount.toString(), sub: formatAmount(stats.todayVolume) },
    { label: 'This Month Volume', value: formatAmount(stats.monthVolume), sub: 'All transaction statuses' },
    { label: 'Successful', value: stats.successCount.toString(), sub: 'This month completed' },
    { label: 'Failed', value: stats.failedCount.toString(), sub: 'Requires review' },
    { label: 'Processing', value: stats.processingCount.toString(), sub: 'In-flight orders' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Payment orchestration performance and volume summaries</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                {card.label}
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground mt-1">
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
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
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Recent Payments</CardTitle>
        <CardDescription>Latest transactions dispatched through Trim Key Flow</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {(payments ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No payments yet</p>
          ) : (
            (payments ?? []).map((p: Record<string, unknown>) => (
              <div key={p.payment_number as string} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-foreground text-sm font-mono font-medium">{p.payment_number as string}</p>
                  <p className="text-muted-foreground text-xs">{(p.merchants as { name: string } | null)?.name ?? '—'}</p>
                </div>
                <div className="text-right space-y-1.5">
                  <p className="text-foreground text-sm font-semibold">₹{(Number(p.amount) / 100).toFixed(2)}</p>
                  <StatusBadge status={p.status as string} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">{status}</Badge>
  }
  if (status === 'FAILED') {
    return <Badge variant="destructive">{status}</Badge>
  }
  if (status === 'PENDING') {
    return <Badge variant="outline" className="text-amber-400 border-amber-400/40 bg-amber-400/10">{status}</Badge>
  }
  if (status === 'PROCESSING') {
    return <Badge variant="secondary" className="text-blue-400 bg-blue-500/10 border-blue-500/20">{status}</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}
