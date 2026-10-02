'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

export function WebhookConfig() {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('https://your-app.com/webhooks')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('Webhook URL saved successfully', 'success')
    setIsOpen(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn-outline" 
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg> 
        Configure Webhook
      </button>

      {isOpen && (
        <div className="glass-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="panel" style={{ width: '400px', maxWidth: '90%', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Configure Webhook</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Endpoint URL</label>
                <input 
                  type="url" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="tk-input" 
                  style={{ width: '100%' }} 
                  required 
                />
              </div>
              <button type="submit" className="liquid-glass" style={{ padding: '10px', fontWeight: 800, marginTop: '10px' }}>
                Save Webhook
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

