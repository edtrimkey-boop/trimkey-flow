import { createAdminClient } from '@/lib/supabase/admin'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { SUCCESS: 'text-green-400 bg-green-950', FAILED: 'text-red-400 bg-red-950', PENDING: 'text-yellow-400 bg-yellow-950', PROCESSING: 'text-blue-400 bg-blue-950', REFUNDED: 'text-purple-400 bg-purple-950', PARTIALLY_REFUNDED: 'text-orange-400 bg-orange-950' }
  const cls = colors[status] ?? 'text-gray-400 bg-gray-800'
  return <span className={`inline-flex text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{status}</span>
}

export default async function PaymentsPage() {
  const db = createAdminClient()
  const { data: payments } = await db
    .from('payments')
    .select('*, orders(order_number, purpose, customer_name, customer_email, provider_order_id), merchants(name), merchant_providers(provider), applications(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Payments</h1>
        <p className="text-gray-400 text-sm mt-1">All payment records</p>
      </div>

      <div className="space-y-3">
        {(payments ?? []).length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">No payments yet</div>
        ) : (
          (payments ?? []).map((p: Record<string, unknown>) => {
            const order = p.orders as Record<string, unknown> | null
            const merchant = p.merchants as { name: string } | null
            const provider = p.merchant_providers as { provider: string } | null
            return (
              <div key={p.id as string} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-mono text-sm">{p.payment_number as string}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Order: {order?.order_number as string ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">₹{(Number(p.amount) / 100).toFixed(2)}</p>
                    <StatusBadge status={p.status as string} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-gray-500">Merchant</span><p className="text-gray-300">{merchant?.name ?? '—'}</p></div>
                  <div><span className="text-gray-500">Provider</span><p className="text-gray-300 capitalize">{provider?.provider ?? '—'}</p></div>
                  <div><span className="text-gray-500">Purpose</span><p className="text-gray-300">{order?.purpose as string ?? '—'}</p></div>
                  <div><span className="text-gray-500">Customer</span><p className="text-gray-300">{order?.customer_name as string ?? '—'}</p></div>
                  <div><span className="text-gray-500">Provider Payment</span><p className="text-gray-300 font-mono">{(p.provider_payment_id as string) ?? '—'}</p></div>
                  <div><span className="text-gray-500">Provider Order</span><p className="text-gray-300 font-mono">{order?.provider_order_id as string ?? '—'}</p></div>
                  <div><span className="text-gray-500">Method</span><p className="text-gray-300 capitalize">{(p.payment_method as string) ?? '—'}</p></div>
                  <div><span className="text-gray-500">Created</span><p className="text-gray-300">{new Date(p.created_at as string).toLocaleString('en-IN')}</p></div>
                </div>
                {(p.failure_reason as string) && (
                  <div className="mt-2 text-xs text-red-400 bg-red-950 px-3 py-1.5 rounded">
                    {p.failure_reason as string}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
