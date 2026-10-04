'use client'

import React, { useState, useTransition } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { addApplicationAction } from './actions'

export function NewAppButton({ orgId }: { orgId: string }) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const [name, setName] = useState('')
  const [environment, setEnvironment] = useState('test')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        await addApplicationAction(orgId, name, environment)
        showToast('Application created successfully', 'success')
        setIsOpen(false)
        setName('')
      } catch (err: any) {
        showToast(err.message || 'Failed to create application', 'error')
      }
    })
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="liquid-glass" 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 800 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg> 
        New Application
      </button>

      {isOpen && (
        <div className="glass-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-box" style={{ width: '400px', maxWidth: '90%', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Create Application</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Application Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="tk-input" 
                  style={{ width: '100%' }}
                  placeholder="e.g. My Main Website"
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Environment</label>
                <select 
                  className="tk-input" 
                  style={{ width: '100%' }}
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                >
                  <option value="test">Sandbox (Testing)</option>
                  <option value="live">Production (Live)</option>
                </select>
              </div>
              <button disabled={isPending} type="submit" className="liquid-glass" style={{ padding: '10px', fontWeight: 800, marginTop: '10px' }}>
                {isPending ? 'Creating...' : 'Create Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
