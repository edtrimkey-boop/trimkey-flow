export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { createAdminClient } from '@/lib/supabase/admin'
import { WebhookConfig } from './WebhookConfig'

export default async function WebhooksPage() {
  const db = createAdminClient()
  const { data: deliveries } = await db
    .from('webhook_deliveries')
    .select('*, webhook_events(event_type, provider), applications(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: apps } = await db.from('applications').select('id, name, webhook_url').order('created_at', { ascending: false })

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
           <h3>Webhook Deliveries</h3>
           <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              Real-time audit of all external provider callbacks
           </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <WebhookConfig applications={apps || []} />
        </div>
      </div>

      <div className="tk-table-wrapper">
        <table className="tk-sleek-table">
          <thead>
            <tr>
              <th>Application</th>
              <th>Provider / Event</th>
              <th>Endpoint URL</th>
              <th>Status</th>
              <th>Attempt</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {(deliveries ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  No webhook deliveries found.
                </td>
              </tr>
            ) : (
              (deliveries ?? []).map((delivery: any) => (
                <tr key={delivery.id}>
                  <td style={{ fontWeight: 600, color: 'white' }}>
                    {delivery.applications?.name ?? '—'}
                  </td>
                  <td>
                    <div style={{ textTransform: 'uppercase', fontSize: '10px', color: 'var(--brand)', fontWeight: 900 }}>
                      {delivery.webhook_events?.provider}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {delivery.webhook_events?.event_type}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>
                    {delivery.endpoint_url}
                  </td>
                  <td>
                    {delivery.status === 'success' ? (
                      <span className="badge bg-success">{delivery.status}</span>
                    ) : delivery.status === 'failed' ? (
                      <span className="badge bg-danger">{delivery.status}</span>
                    ) : (
                      <span className="badge bg-warning">{delivery.status}</span>
                    )}
                  </td>
                  <td style={{ color: 'white', fontWeight: 900 }}>
                    {delivery.attempt_count}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(delivery.created_at).toLocaleString('en-IN')}
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



