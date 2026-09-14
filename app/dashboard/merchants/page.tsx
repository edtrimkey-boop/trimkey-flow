import { createAdminClient } from '@/lib/supabase/admin'

export default async function MerchantsPage() {
  const db = createAdminClient()
  const { data: merchants } = await db
    .from('merchants')
    .select('*, organizations(name), merchant_providers(provider, is_active, is_default, account_identifier, connected_at)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Merchants</h1>
        <p className="text-gray-400 text-sm mt-1">{(merchants ?? []).length} merchants</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Merchant</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Organization</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Currency</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Provider</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Credentials</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(merchants ?? []).length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-12">No merchants configured</td></tr>
            ) : (
              (merchants ?? []).map((m: Record<string, unknown>) => {
                const providers = (m.merchant_providers as Array<Record<string, unknown>>) ?? []
                const defaultProvider = providers.find((p) => p.is_default) ?? providers[0]
                const org = m.organizations as { name: string } | null
                return (
                  <tr key={m.id as string} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white">{m.display_name as string || m.name as string}</p>
                      <p className="text-gray-500 text-xs">{m.name as string}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{org?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{m.currency_code as string}</td>
                    <td className="px-4 py-3 text-gray-300 capitalize">{defaultProvider?.provider as string ?? '—'}</td>
                    <td className="px-4 py-3">
                      {defaultProvider ? (
                        <span className="text-green-400 text-xs bg-green-950 px-2 py-0.5 rounded">Connected</span>
                      ) : (
                        <span className="text-gray-500 text-xs">Not configured</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${m.status === 'active' ? 'text-green-400 bg-green-950' : 'text-gray-400 bg-gray-800'}`}>
                        {m.status as string}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-gray-600 text-xs mt-3">
        Provider credentials are encrypted and never displayed. The &quot;Connected&quot; badge confirms the provider is active.
      </p>
    </div>
  )
}
