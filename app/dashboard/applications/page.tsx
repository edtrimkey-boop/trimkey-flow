import { createAdminClient } from '@/lib/supabase/admin'

export default async function ApplicationsPage() {
  const db = createAdminClient()
  const { data: apps } = await db
    .from('applications')
    .select('*, organizations(name), api_keys(count), application_domains(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Applications</h1>
        <p className="text-gray-400 text-sm mt-1">Client applications connected to Trim Key Flow</p>
      </div>

      <div className="space-y-3">
        {(apps ?? []).length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">No applications configured</div>
        ) : (
          (apps ?? []).map((app: Record<string, unknown>) => (
            <div key={app.id as string} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-medium">{app.name as string}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{app.slug as string}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${app.status === 'active' ? 'text-green-400 bg-green-950' : 'text-gray-400 bg-gray-800'}`}>
                  {app.status as string}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div><span className="text-gray-500">Organization</span><p className="text-gray-300">{(app.organizations as { name: string } | null)?.name ?? '—'}</p></div>
                <div><span className="text-gray-500">Environment</span><p className="text-gray-300">{(app.environment as string) ?? '—'}</p></div>
                <div><span className="text-gray-500">Webhook URL</span><p className="text-gray-300 truncate">{(app.webhook_url as string) ?? 'Not configured'}</p></div>
              </div>
              {Boolean(app.description) && (
                <p className="text-gray-500 text-xs mt-2">{String(app.description)}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
