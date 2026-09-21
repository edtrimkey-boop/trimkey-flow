'use client'

import React, { useState } from 'react'
import { updateMerchantStatusAction } from './actions'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

export function ManageMerchant({ merchantId, currentStatus }: { merchantId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  async function handleStatusChange(status: 'active' | 'suspended' | 'inactive') {
    if (status === 'inactive') {
      const ok = await confirm('Are you sure you want to permanently revoke this merchant? This blocks all API access.')
      if (!ok) return
    }
    
    setLoading(true)
    try {
      await updateMerchantStatusAction(merchantId, status)
      showToast(`Merchant status updated to ${status}`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error')
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
          className="btn-warning"
          style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer', border: 'none', fontWeight: 800 }}
        >
          Pause
        </button>
      ) : (
        <button 
          disabled={loading}
          onClick={() => handleStatusChange('active')}
          className="btn-success"
          style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer', border: 'none', fontWeight: 800 }}
        >
          Resume
        </button>
      )}
      
      <button 
        disabled={loading || currentStatus === 'inactive'}
        onClick={() => handleStatusChange('inactive')}
        className="btn-danger"
        style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', cursor: currentStatus === 'inactive' ? 'not-allowed' : 'pointer', opacity: currentStatus === 'inactive' ? 0.5 : 1, border: 'none', fontWeight: 800 }}
      >
        Revoke
      </button>
    </div>
  )
}

