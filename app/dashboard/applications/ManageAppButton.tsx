'use client'

import React, { useState } from 'react'

export function ManageAppButton({ app }: { app: any }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flat-pill" 
        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', padding: '4px 12px' }}
      >
        Manage
      </button>

      {isOpen && (
        <div className="glass-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-box" style={{ width: '400px', maxWidth: '90%', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Manage {app.name}</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Application Name</label>
                <input type="text" className="tk-input" defaultValue={app.name} disabled />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Environment</label>
                <input type="text" className="tk-input" defaultValue={app.environment} disabled />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Webhook URL</label>
                <input type="text" className="tk-input" defaultValue={app.webhook_url || ''} disabled placeholder="Configure in Webhooks tab" />
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  This application is currently read-only in the dashboard. Use API or settings to update configurations.
                </p>
                <button onClick={() => setIsOpen(false)} className="liquid-glass" style={{ padding: '10px', fontWeight: 800, width: '100%', marginTop: '10px' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
