import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/30',
    FAILED: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    PENDING: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
    PROCESSING: 'bg-[#26C3EA]/15 text-[#26C3EA] border-[#26C3EA]/30',
    REFUNDED: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
    PARTIALLY_REFUNDED: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  }

  const cls = styles[status] ?? 'bg-white/10 text-white/80 border-white/20'

  return (
    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  )
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase">
            Transactions Ledger
          </h1>
          <p className="text-xs md:text-sm font-medium text-[#94A3B8] mt-1">
            Real-time audit log of all payment authorizations and settlement records ({count ?? 0} total)
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        <Link
          href="/dashboard/transactions"
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
            !params.status
              ? 'bg-[#26C3EA] text-[#080D17] border-[#26C3EA] shadow-[0_0_15px_rgba(38,195,234,0.4)]'
              : 'bg-white/[0.03] text-[#94A3B8] border-white/[0.08] hover:text-white hover:border-white/20'
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/dashboard/transactions?status=${s}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
              params.status === s
                ? 'bg-[#26C3EA] text-[#080D17] border-[#26C3EA] shadow-[0_0_15px_rgba(38,195,234,0.4)]'
                : 'bg-white/[0.03] text-[#94A3B8] border-white/[0.08] hover:text-white hover:border-white/20'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Sleek Data Grid */}
      <div className="bg-[#141E30] border border-white/[0.08] rounded-2xl p-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Payment ID</th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Application</th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Merchant</th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Provider</th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] text-right">Amount</th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Method</th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(payments ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[#94A3B8] py-16 text-sm font-semibold">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                (payments ?? []).map((p: Record<string, unknown>) => (
                  <tr
                    key={p.payment_number as string}
                    className="hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-bold text-[#26C3EA]">
                      {p.payment_number as string}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-white">
                      {(p.applications as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-white/80">
                      {(p.merchants as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-[#94A3B8] capitalize">
                      {(p.merchant_providers as { provider: string } | null)?.provider ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-white text-right">
                      ₹{(Number(p.amount) / 100).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-[#94A3B8] capitalize">
                      {(p.payment_method as string) ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status as string} />
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-[#94A3B8]">
                      {new Date(p.created_at as string).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {(count ?? 0) > limit && (
        <div className="flex gap-2 justify-end pt-2">
          {page > 1 && (
            <Link
              href={`/dashboard/transactions?page=${page - 1}${params.status ? `&status=${params.status}` : ''}`}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white transition-all"
            >
              Previous
            </Link>
          )}
          {offset + limit < (count ?? 0) && (
            <Link
              href={`/dashboard/transactions?page=${page + 1}${params.status ? `&status=${params.status}` : ''}`}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white transition-all"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
