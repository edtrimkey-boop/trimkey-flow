'use client'

import React, { useState, useTransition } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { ModalPortal } from '@/components/ui/ModalPortal'
import { addDomainAction } from './actions'

export function AddDomainButton({ applications }: { applications: any[] }) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [domain, setDomain] = useState('')
  const [appId, setAppId] = useState(applications[0]?.id || '')
  const [isPending, startTransition] = useTransition()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!appId) return showToast('Please select an application', 'error')
    
    startTransition(async () => {
      try {
        await addDomainAction(appId, domain)
        showToast('Domain added successfully', 'success')
        setIsOpen(false)
        setDomain('')
      } catch (err: any) {
        showToast(err.message || 'Failed to add domain', 'error')
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
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8"/>
          <path d="M8 12h8"/>
        </svg> 
        Add Domain
      </button>

      <ModalPortal isOpen={isOpen} onClose={() => !isPending && setIsOpen(false)} maxWidth="420px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 800 }}>Add New Domain</h3>
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
              onChange={(e) => setAppId(e.target.value)}
              required
            >
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>Domain (e.g. example.com)</label>
            <input 
              type="text" 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="tk-input" 
              style={{ width: '100%' }} 
              placeholder="example.com"
              required 
            />
          </div>
          <button disabled={isPending} type="submit" className="liquid-glass" style={{ padding: '12px', fontWeight: 800, marginTop: '10px', cursor: isPending ? 'not-allowed' : 'pointer' }}>
            {isPending ? 'Adding...' : 'Add Domain'}
          </button>
        </form>
      </ModalPortal>
    </>
  )
}
