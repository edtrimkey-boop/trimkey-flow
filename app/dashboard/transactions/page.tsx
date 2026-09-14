import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

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
  return <span className={`inline-flex text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{status}</span>
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const db = createAdminClient()
  const page = Number(params.page ?? 1)
  const limit = 25
  const offset = (page - 1) * limit

  let query = db
    .from('payments')
    .select('payment_number, amount, currency_code, status, payment_method, created_at, paid_at, merchants(name), applications(name), merchant_providers(provider)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq('status', params.status)

  const { data: payments, count } = await query

  const statuses = ['SUCCESS', 'FAILED', 'PENDING', 'PROCESSING', 'REFUNDED', 'PARTIALLY_REFUNDED']

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Transactions</h1>
        <p className="text-gray-400 text-sm mt-1">{count ?? 0} total</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/dashboard/transactions" className={`px-3 py-1.5 rounded-lg text-sm ${!params.status ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/dashboard/transactions?status=${s}`} className={`px-3 py-1.5 rounded-lg text-sm ${params.status === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>
            {s}
          </Link>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Payment ID</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Application</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Merchant</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Provider</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Method</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(payments ?? []).length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-12">No transactions found</td></tr>
            ) : (
              (payments ?? []).map((p: Record<string, unknown>) => (
                <tr key={p.payment_number as string} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-indigo-400 text-xs">{p.payment_number as string}</td>
                  <td className="px-4 py-3 text-gray-300">{(p.applications as { name: string } | null)?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{(p.merchants as { name: string } | null)?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{(p.merchant_providers as { provider: string } | null)?.provider ?? '—'}</td>
                  <td className="px-4 py-3 text-white text-right">₹{(Number(p.amount) / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{(p.payment_method as string) ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status as string} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.created_at as string).toLocaleDateString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(count ?? 0) > limit && (
        <div className="flex gap-2 mt-4 justify-end">
          {page > 1 && (
            <Link href={`/dashboard/transactions?page=${page - 1}${params.status ? `&status=${params.status}` : ''}`} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">
              Previous
            </Link>
          )}
          {offset + limit < (count ?? 0) && (
            <Link href={`/dashboard/transactions?page=${page + 1}${params.status ? `&status=${params.status}` : ''}`} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
