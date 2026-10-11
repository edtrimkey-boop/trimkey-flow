'use client'

import React, { useState, useTransition } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { ModalPortal } from '@/components/ui/ModalPortal'
import { saveWebhookAction } from './actions'

export function WebhookConfig({ applications }: { applications: any[] }) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [appId, setAppId] = useState(applications[0]?.id || '')
  const [isPending, startTransition] = useTransition()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!appId) return showToast('Please select an application', 'error')

    startTransition(async () => {
      try {
        await saveWebhookAction(appId, url)
        showToast('Webhook URL saved successfully', 'success')
        setIsOpen(false)
      } catch (err: any) {
        showToast(err.message || 'Failed to save webhook', 'error')
      }
    })
  }

  // Pre-fill URL if app changes
  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setAppId(id)
    const app = applications.find(a => a.id === id)
    setUrl(app?.webhook_url || '')
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="liquid-glass" 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 800 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg> 
        Configure Webhook
      </button>

      <ModalPortal isOpen={isOpen} onClose={() => !isPending && setIsOpen(false)} maxWidth="420px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 800 }}>Configure Webhook</h3>
          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>Application</label>
            <select 
              className="tk-input" 
              style={{ width: '100%' }}
              value={appId}
              onChange={handleAppChange}
              required
            >
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>Endpoint URL</label>
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="tk-input" 
              style={{ width: '100%' }} 
              placeholder="https://api.yoursite.com/webhook"
              required 
            />
          </div>
          <button disabled={isPending} type="submit" className="liquid-glass" style={{ padding: '12px', fontWeight: 800, marginTop: '10px', cursor: isPending ? 'not-allowed' : 'pointer' }}>
            {isPending ? 'Saving...' : 'Save Webhook'}
          </button>
        </form>
      </ModalPortal>
    </>
  )
}
