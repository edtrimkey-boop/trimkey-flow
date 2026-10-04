'use client'

import React, { useState } from 'react'

export function GenerateKeyModal({
  applications,
  isGenerating,
  onGenerate
}: {
  applications: any[]
  isGenerating: boolean
  onGenerate: (appId: string, env: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [appId, setAppId] = useState('')
  const [env, setEnv] = useState('test')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetAppId = appId || applications[0]?.id
    if (!targetAppId) return
    onGenerate(targetAppId, env)
    setIsOpen(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        disabled={isGenerating}
        className="liquid-glass" 
        style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 800, opacity: isGenerating ? 0.5 : 1 }}
      >
        <span style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'middle' }}>+</span>
        {isGenerating ? 'Generating...' : 'Generate New Key'}
      </button>

      {isOpen && (
        <div className="glass-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-box" style={{ width: '420px', maxWidth: '90%', padding: 0, overflow: 'hidden' }}>
            
            {/* Sticky Glass Header */}
            <div style={{ 
              background: 'rgba(11, 17, 30, 0.8)', 
              backdropFilter: 'blur(10px)', 
              borderBottom: '1px solid rgba(255,255,255,0.05)', 
              padding: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(38,195,234,0.15)', padding: '8px', borderRadius: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'white' }}>Generate API Key</h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Create a new secret key</div>
                </div>
              </div>
              
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', padding: '5px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  SELECT APPLICATION
                </label>
                <select 
                  className="tk-input" 
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={appId || (applications[0]?.id || '')}
                  onChange={(e) => setAppId(e.target.value)}
                  required
                >
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>{app.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                  ENVIRONMENT
                </label>
                <select 
                  className="tk-input" 
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={env}
                  onChange={(e) => setEnv(e.target.value)}
                >
                  <option value="test">Sandbox (Testing)</option>
                  <option value="live">Production (Live)</option>
                </select>
              </div>

              <div style={{ marginTop: '10px' }}>
                <button disabled={isGenerating} type="submit" className="liquid-glass" style={{ width: '100%', padding: '12px', fontWeight: 800, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {isGenerating ? (
                    'Generating Key...'
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                      Generate Key
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
