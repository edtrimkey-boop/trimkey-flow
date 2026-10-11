'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { ModalPortal } from '@/components/ui/ModalPortal'
import { updateApplicationAction, deleteApplicationAction } from './actions'

export function ManageAppButton({ app }: { app: any }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const [name, setName] = useState(app.name || '')
  const [environment, setEnvironment] = useState(app.environment || 'live')
  const [status, setStatus] = useState(app.status || 'active')
  const [webhookUrl, setWebhookUrl] = useState(app.webhook_url || '')

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateApplicationAction(app.id, {
          name,
          environment,
          status,
          webhook_url: webhookUrl.trim() || undefined,
        })
        showToast('Application updated successfully', 'success')
        setIsOpen(false)
        router.refresh()
      } catch (err: any) {
        showToast(err.message || 'Failed to update application', 'error')
      }
    })
  }

  const handleDelete = async () => {
    const ok = await confirm(`Are you sure you want to delete "${app.name}"? This action cannot be undone and will delete associated API keys and domains.`)
    if (!ok) return

    setIsDeleting(true)
    try {
      await deleteApplicationAction(app.id)
      showToast('Application deleted successfully', 'success')
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to delete application', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => {
          setName(app.name || '')
          setEnvironment(app.environment || 'live')
          setStatus(app.status || 'active')
          setWebhookUrl(app.webhook_url || '')
          setIsOpen(true)
        }}
        className="liquid-glass" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          padding: '6px 14px', 
          fontSize: '11px', 
          fontWeight: 800,
          cursor: 'pointer'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Manage
      </button>

      <ModalPortal 
        isOpen={isOpen} 
        onClose={() => !isPending && !isDeleting && setIsOpen(false)}
        maxWidth="480px"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 800 }}>Manage Application</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {app.id}</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Application Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="tk-input" 
              style={{ width: '100%' }}
              placeholder="e.g. Production Web App"
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                Environment
              </label>
              <select 
                className="tk-input" 
                style={{ width: '100%' }}
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                <option value="live">Live (Production)</option>
                <option value="test">Test (Sandbox)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                Status
              </label>
              <select 
                className="tk-input" 
                style={{ width: '100%' }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Webhook URL (Optional)
            </label>
            <input 
              type="url" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="tk-input" 
              style={{ width: '100%' }}
              placeholder="https://yourdomain.com/api/webhooks"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isPending}
              className="liquid-glass"
              style={{ 
                padding: '8px 14px', 
                fontSize: '12px', 
                fontWeight: 700, 
                color: 'var(--danger)', 
                borderColor: 'rgba(239, 68, 68, 0.3)',
                cursor: 'pointer'
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete App'}
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                disabled={isPending || isDeleting}
                className="liquid-glass"
                style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isPending || isDeleting}
                className="liquid-glass"
                style={{ 
                  padding: '8px 18px', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  color: 'var(--brand)', 
                  borderColor: 'var(--brand)',
                  cursor: 'pointer'
                }}
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </ModalPortal>
    </>
  )
}
