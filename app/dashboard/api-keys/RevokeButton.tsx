'use client'

import React, { useTransition } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { revokeKeyAction } from './actions'
import { useRouter } from 'next/navigation'

export default function RevokeButton({ keyId }: { keyId: string }) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const router = useRouter()

  const handleRevoke = async () => {
    const ok = await confirm('Are you sure you want to revoke this API key? This action cannot be undone.')
    if (!ok) return
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

