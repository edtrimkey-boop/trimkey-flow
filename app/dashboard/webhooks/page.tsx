import { createAdminClient } from '@/lib/supabase/admin'

export default async function WebhooksPage() {
  const db = createAdminClient()
  const { data: deliveries } = await db
    .from('webhook_deliveries')
    .select('*, webhook_events(event_type, provider), applications(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Webhook Deliveries</h1>
        <p className="text-gray-400 text-sm mt-1">Application webhook delivery history</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Application</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Event</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Endpoint</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Attempt</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">HTTP</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(deliveries ?? []).length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-12">No webhook deliveries yet</td></tr>
            ) : (
              (deliveries ?? []).map((d: Record<string, unknown>) => {
                const we = d.webhook_events as { event_type: string } | null
                const app = d.applications as { name: string } | null
                const status = d.status as string
                const statusColor = status === 'SUCCESS' ? 'text-green-400 bg-green-950' : status === 'RETRYING' ? 'text-yellow-400 bg-yellow-950' : 'text-red-400 bg-red-950'
                return (
                  <tr key={d.id as string} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300">{app?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs font-mono">{we?.event_type ?? d.event_type as string}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-40">{d.endpoint_url as string}</td>
                    <td className="px-4 py-3 text-gray-400 text-center">{d.attempt_number as number}</td>
                    <td className="px-4 py-3 text-gray-400 text-center">{(d.http_status as number) ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>{status}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(d.created_at as string).toLocaleString('en-IN')}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
