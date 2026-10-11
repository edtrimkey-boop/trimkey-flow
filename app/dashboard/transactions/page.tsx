import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link';
import ExportButton from './ExportButton';
import CreatePaymentModal from './CreatePaymentModal';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: 'bg-success',
    FAILED: 'bg-danger',
    PENDING: 'bg-warning',
    PROCESSING: 'bg-info',
    REFUNDED: 'bg-purple',
    PARTIALLY_REFUNDED: 'bg-warning',
  }

  const cls = styles[status] || 'bg-info'

  return (
    <span className={`badge ${cls}`}>
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

  const [paymentsRes, appsRes, merchantsRes] = await Promise.all([
    query,
    db.from('applications').select('id, name').order('name', { ascending: true }),
    db.from('merchants').select('id, name, status').eq('status', 'active').order('name', { ascending: true }),
  ])

  const payments = paymentsRes.data
  const count = paymentsRes.count
  const applications = appsRes.data || []
  const merchants = merchantsRes.data || []

  const statuses = ['SUCCESS', 'FAILED', 'PENDING', 'PROCESSING', 'REFUNDED', 'PARTIALLY_REFUNDED']

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
           <h3>Transactions Ledger</h3>
           <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              Real-time audit log of all payment authorizations and settlement records ({count ?? 0} total)
           </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
           <CreatePaymentModal applications={applications} merchants={merchants} />
           <ExportButton data={payments || []} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '25px' }}>
        <Link
          href="/dashboard/transactions"
          className={!params.status ? "flat-pill bg-info" : "flat-pill"}
          style={!params.status ? {} : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          All
        </Link>
        {statuses.map((s) => {
          const isActive = params.status === s;
          return (
             <Link
               key={s}
               href={`/dashboard/transactions?status=${s}`}
               className={isActive ? "flat-pill bg-info" : "flat-pill"}
               style={isActive ? {} : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}
             >
               {s}
             </Link>
          )
        })}
      </div>

      <div className="tk-table-wrapper">
        <table className="tk-sleek-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Application</th>
              <th>Merchant</th>
              <th>Provider</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  No transactions match the selected criteria.
                </td>
              </tr>
            ) : (
              (payments ?? []).map((p: any) => (
                <tr key={p.payment_number}>
                  <td style={{ fontFamily: 'monospace' }}>
                    <Link
                      href={`/checkout/${p.payment_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Checkout Page"
                      style={{
                        color: 'var(--brand)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                      }}
                    >
                      <span>{p.payment_number}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.65 }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </Link>
                  </td>
                  <td>
                    {p.applications?.name ?? '—'}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {p.merchants?.name ?? '—'}
                  </td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                    {p.merchant_providers?.provider ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: 'white' }}>
₹{(Number(p.amount) / 100).toFixed(2)}
                  </td>
                  <td style={{ textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {p.payment_method ?? '—'}
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(p.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(count ?? 0) > limit && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          {page > 1 && (
            <Link
              href={`/dashboard/transactions?page=${page - 1}${params.status ? `&status=${params.status}` : ''}`}
              className="btn-outline" style={{ padding: '8px 16px', fontSize: '11px', textDecoration: 'none' }}
            >
              Previous
            </Link>
          )}
          {offset + limit < (count ?? 0) && (
            <Link
              href={`/dashboard/transactions?page=${page + 1}${params.status ? `&status=${params.status}` : ''}`}
              className="btn-outline" style={{ padding: '8px 16px', fontSize: '11px', textDecoration: 'none' }}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}




