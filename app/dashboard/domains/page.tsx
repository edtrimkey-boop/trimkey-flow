import { createAdminClient } from '@/lib/supabase/admin'
import { AddDomainButton } from './AddDomain'
import { DomainActions } from './DomainActions'

export default async function DomainsPage() {
  const db = createAdminClient()
  const { data: domains } = await db
    .from('application_domains')
    .select('*, applications(name)')
    .order('created_at', { ascending: false })

  const { data: apps } = await db.from('applications').select('id, name').order('created_at', { ascending: false })

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
           <h3>Domains</h3>
           <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              Allowed origins for client applications
           </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <AddDomainButton applications={apps || []} />
        </div>
      </div>

      <div className="tk-table-wrapper">
        <table className="tk-sleek-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Application</th>
              <th>Verified</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(domains ?? []).length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No domains registered</td></tr>
            ) : (
              (domains as any[])!.map((d) => {
                const verified = Boolean(d.is_verified ?? d.verified)
                return (
                  <tr key={d.id}>
                    <td>
                      <span style={{ color: 'white', fontWeight: 800 }}>{d.domain}</span>
                    </td>
                    <td>{d.applications?.name || '—'}</td>
                    <td>
                      <span className={`badge ${verified ? 'bg-success' : 'bg-warning'}`}>
                        {verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(d.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <DomainActions
                        domainId={d.id}
                        domainName={d.domain}
                        isVerified={verified}
                      />
                    </td>
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
