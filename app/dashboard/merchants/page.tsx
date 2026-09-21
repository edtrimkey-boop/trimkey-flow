// @ts-nocheck
import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { OnboardModal } from './OnboardModal'
import { ManageMerchant } from './ManageMerchant'

export const dynamic = 'force-dynamic'

export default async function MerchantsPage() {
  const db = createAdminClient()
  
  const { data: merchants } = await db
    .from('merchants')
    .select(`
      id,
      name,
      status,
      merchant_providers (
        provider,
        is_active
      )
    `)
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="panel-header">
          <div>
             <h3>Merchants & Providers</h3>
             <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                Manage onboarded merchants and sub-accounts routing through your gateway.
             </p>
          </div>
          <OnboardModal />
        </div>

        <div className="tk-table-wrapper" style={{ marginTop: '20px' }}>
          <table className="tk-sleek-table">
            <thead>
              <tr>
                <th>Merchant Name</th>
                <th>Status</th>
                <th>Provider Mode</th>
                <th>Gateway Setup</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {merchants?.map(merchant => (
                <tr key={merchant.id}>
                  <td style={{ fontWeight: 600 }}>{merchant.name}</td>
                  <td>
                    <span className={`badge ${merchant.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                      {merchant.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {merchant.merchant_providers && merchant.merchant_providers.length > 1 
                      ? 'Smart Routed' 
                      : 'Direct Processing'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {merchant.merchant_providers?.map((p: any, i: number) => (
                         <span key={i} className="badge bg-purple" style={{ textTransform: 'capitalize' }}>
                           {p.provider}
                         </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <ManageMerchant merchantId={merchant.id} currentStatus={merchant.status} />
                  </td>
                </tr>
              ))}
              {(!merchants || merchants.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>No merchants found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

