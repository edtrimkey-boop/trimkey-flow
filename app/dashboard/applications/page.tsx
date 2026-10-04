import { createAdminClient } from '@/lib/supabase/admin'
import { ManageAppButton } from './ManageAppButton'
import { NewAppButton } from './NewAppButton'

export default async function ApplicationsPage() {
  const db = createAdminClient()
  const { data: apps } = await db
    .from('applications')
    .select('*, organizations(name), api_keys(count), application_domains(count)')
    .order('created_at', { ascending: false })
    
  const { data: org } = await db.from('organizations').select('id').limit(1).single()

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
           <h3>Applications</h3>
           <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              Client applications connected to Trim Key Flow
           </p>
        </div>
        {org && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <NewAppButton orgId={org.id} />
          </div>
        )}
      </div>

      <div className="tk-table-wrapper">
        <table className="tk-sleek-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Environment</th>
              <th>Status</th>
              <th>API Keys</th>
              <th>Domains</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(apps ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  No applications configured.
                </td>
              </tr>
            ) : (
              (apps ?? []).map((app: any) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600, color: 'white' }}>
                    {app.name}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {app.organizations?.name ?? 'â€”'}
                  </td>
                  <td>
                    <span className={`badge ${app.environment === 'production' ? 'bg-danger' : 'bg-info'}`}>
                      {app.environment}
                    </span>
                  </td>
                  <td>
                    {app.status === 'active' ? (
                      <span className="badge bg-success">Active</span>
                    ) : (
                      <span className="badge bg-warning">{app.status}</span>
                    )}
                  </td>
                  <td style={{ color: 'white', fontWeight: 900 }}>
                    {app.api_keys?.[0]?.count ?? 0}
                  </td>
                  <td style={{ color: 'white', fontWeight: 900 }}>
                    {app.application_domains?.[0]?.count ?? 0}
                  </td>
                  <td>
                    <button className="flat-pill" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', padding: '4px 12px' }}>
                      Manage
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


