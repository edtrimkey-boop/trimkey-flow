import { createAdminClient } from '@/lib/supabase/admin'

export default async function ApiKeysPage() {
  const db = createAdminClient()
  const { data: keys } = await db
    .from('api_keys')
    .select('id, name, key_prefix, environment, status, permissions, last_used_at, expires_at, revoked_at, created_at, applications(name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">API Keys</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage API keys for client applications. Secrets are shown only once at creation.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Application</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Key</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Environment</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Last Used</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(keys ?? []).length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-12">No API keys yet. Create one via the API or CLI.</td></tr>
            ) : (
              (keys ?? []).map((k: Record<string, unknown>) => (
                <tr key={k.id as string} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-white">{k.name as string}</td>
                  <td className="px-4 py-3 text-gray-300">{(k.applications as { name: string } | null)?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-indigo-400 text-xs">
                      {k.key_prefix as string}••••••••
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${k.environment === 'live' ? 'text-green-400 bg-green-950' : 'text-yellow-400 bg-yellow-950'}`}>
                      {k.environment as string}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${k.status === 'active' ? 'text-green-400 bg-green-950' : 'text-red-400 bg-red-950'}`}>
                      {k.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {k.last_used_at ? new Date(k.last_used_at as string).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(k.created_at as string).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-indigo-950 border border-indigo-900 rounded-xl p-4 text-sm">
        <p className="text-indigo-300 font-medium mb-1">Create an API key via the API</p>
        <pre className="text-indigo-200 text-xs overflow-x-auto">{`curl -X POST https://flow.trimkey.in/api/v1 \\
  -H "Authorization: Bearer tk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"api_key.create","data":{"name":"Ed-Trim Key Production","environment":"live"}}'`}</pre>
        <p className="text-indigo-400 text-xs mt-2">The full secret is returned once and cannot be retrieved again.</p>
      </div>
    </div>
  )
}
