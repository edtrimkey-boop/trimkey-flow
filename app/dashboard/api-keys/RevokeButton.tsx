'use client'

import React, { useTransition } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { revokeKeyAction } from './actions'
import { useRouter } from 'next/navigation'

export default function RevokeButton({ keyId }: { keyId: string }) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const router = useRouter()

  const handleRevoke = () => {
    if (!confirm('Are you sure you want to revoke this key? Action cannot be undone.')) return
    startTransition(async () => {
      try {
        await revokeKeyAction(keyId)
        showToast('API Key revoked successfully', 'success')
        router.refresh()
      } catch (error) {
        showToast('Failed to revoke key', 'error')
      }
    })
  }

  return (
    <button 
      onClick={handleRevoke} 
      disabled={isPending}
      style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
      {isPending ? 'Revoking...' : 'Revoke'}
    </button>
  )
}

