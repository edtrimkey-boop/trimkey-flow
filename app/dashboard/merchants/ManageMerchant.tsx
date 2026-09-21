'use client'

import React, { useState } from 'react'
import { updateMerchantStatusAction } from './actions'

export function ManageMerchant({ merchantId, currentStatus }: { merchantId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(status: 'active' | 'suspended' | 'inactive') {
    if (status === 'inactive' && !confirm('Are you sure you want to permanently revoke this merchant? This blocks all API access.')) return
    
    setLoading(true)
    try {
      await updateMerchantStatusAction(merchantId, status)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {currentStatus === 'active' ? (
        <button 
          disabled={loading}
          onClick={() => handleStatusChange('suspended')}
          style={{ padding: '4px 8px', fontSize: '10px', background: '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Pause
        </button>
      ) : (
        <button 
          disabled={loading}
          onClick={() => handleStatusChange('active')}
          style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--brand)', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
        >
          Resume
        </button>
      )}
      
      <button 
        disabled={loading || currentStatus === 'inactive'}
        onClick={() => handleStatusChange('inactive')}
        style={{ padding: '4px 8px', fontSize: '10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: currentStatus === 'inactive' ? 'not-allowed' : 'pointer', opacity: currentStatus === 'inactive' ? 0.5 : 1 }}
      >
        Revoke
      </button>
    </div>
  )
}
