import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { NewRuleButton } from './NewRuleButton'

export default async function RouterPage() {
  const db = createAdminClient()

  // Fetch routing rules
  const { data: rules } = await db
    .from('routing_rules')
    .select('*, merchant_providers(provider, merchants(name))')
    .order('priority', { ascending: true })

  // Group by merchant for UI display
  const merchants = Array.from(new Set((rules as any[] || []).map(r => r.merchant_id)))

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
           <h3>Smart Router Rules</h3>
           <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              Define logic-based payment routing (Cost-based, volume-based, or fallback)
           </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <NewRuleButton />
        </div>
      </div>

      <div className="tk-table-wrapper" style={{ marginTop: '20px' }}>
        <table className="tk-sleek-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Rule Name</th>
              <th>Conditions</th>
              <th>Target Provider</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rules ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  No active routing rules configured. Traffic will fall back to default providers.
                </td>
              </tr>
            ) : (
              (rules ?? []).map((rule: any) => (
                <tr key={rule.id}>
                  <td style={{ color: 'var(--brand)', fontWeight: 900 }}>
                    #{rule.priority}
                  </td>
                  <td style={{ fontWeight: 600, color: 'white' }}>
                    {rule.name}
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {rule.merchant_providers?.merchants?.name}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {rule.condition_currency && (
                        <span className="badge bg-info">Curr: {rule.condition_currency}</span>
                      )}
                      {rule.condition_min_amount && (
                        <span className="badge bg-warning">&gt; â‚¹{(rule.condition_min_amount / 100).toFixed(2)}</span>
                      )}
                      {rule.condition_max_amount && (
                        <span className="badge bg-warning">&lt; â‚¹{(rule.condition_max_amount / 100).toFixed(2)}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="var(--brand)"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'white' }}>
                        {rule.merchant_providers?.provider}
                      </span>
                    </div>
                  </td>
                  <td>
                    {rule.is_active ? (
                      <span className="badge bg-success">Active</span>
                    ) : (
                      <span className="badge bg-danger">Disabled</span>
                    )}
                  </td>
                  <td>
                    <button className="flat-pill" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', padding: '4px 12px' }}>
                      Edit
                    </button>
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

