'use client'

import React, { useState } from 'react'
import { deleteDomainAction, toggleDomainVerificationAction } from './actions'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

export function DomainActions({
  domainId,
  domainName,
  isVerified,
}: {
  domainId: string
  domainName: string
  isVerified: boolean
}) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const handleDelete = async () => {
    const ok = await confirm(
      `Are you sure you want to remove domain "${domainName}"? Applications making requests from this origin may be blocked by CORS.`
    )
    if (!ok) return

    setLoading(true)
    try {
      await deleteDomainAction(domainId)
      showToast('Domain removed successfully', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete domain', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVerification = async () => {
    setLoading(true)
    try {
      await toggleDomainVerificationAction(domainId, isVerified)
      showToast(
        `Domain marked as ${!isVerified ? 'Verified' : 'Unverified'}`,
        'success'
      )
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        disabled={loading}
        onClick={handleToggleVerification}
        className="flat-pill"
        style={{
          background: isVerified ? 'rgba(0, 251, 166, 0.08)' : 'rgba(243, 156, 18, 0.08)',
          color: isVerified ? 'var(--brand)' : 'var(--warning)',
          border: `1px solid ${isVerified ? 'rgba(0, 251, 166, 0.25)' : 'rgba(243, 156, 18, 0.25)'}`,
          padding: '4px 10px',
          fontSize: '10px',
          fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer',
        }}
        title="Toggle domain verification state"
      >
        {isVerified ? 'Revoke Status' : 'Verify'}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="liquid-glass"
        style={{
          padding: '4px 8px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--danger)',
          background: 'rgba(239, 68, 68, 0.08)',
          borderColor: 'rgba(239, 68, 68, 0.25)',
          cursor: loading ? 'wait' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title="Delete Domain"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Remove
      </button>
    </div>
  )
}
