import { createAdminClient } from '@/lib/supabase/admin'

export default async function DomainsPage() {
  const db = createAdminClient()
  const { data: domains } = await db
    .from('application_domains')
    .select('*, applications(name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Domains</h1>
        <p className="text-gray-400 text-sm mt-1">Allowed origins for client applications</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Domain</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Application</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Verified</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Verified At</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(domains ?? []).length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-500 py-12">No domains registered</td></tr>
            ) : (
              (domains ?? []).map((d: Record<string, unknown>) => (
                <tr key={d.id as string} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-sm">{d.domain as string}</td>
                  <td className="px-4 py-3 text-gray-300">{(d.applications as { name: string } | null)?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {d.is_verified ? (
                      <span className="text-green-400 text-xs bg-green-950 px-2 py-0.5 rounded">VERIFIED</span>
                    ) : (
                      <span className="text-yellow-400 text-xs bg-yellow-950 px-2 py-0.5 rounded">PENDING</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {d.verified_at ? new Date(d.verified_at as string).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(d.created_at as string).toLocaleDateString('en-IN')}
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
