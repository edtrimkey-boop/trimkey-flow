'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

export function AddDomainButton() {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [domain, setDomain] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('Domain added successfully', 'success')
    setIsOpen(false)
    setDomain('')
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn-outline" 
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8"/>
          <path d="M8 12h8"/>
        </svg> 
        Add Domain
      </button>

      {isOpen && (
        <div className="glass-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="panel" style={{ width: '400px', maxWidth: '90%', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Add New Domain</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Domain (e.g. example.com)</label>
                <input 
                  type="text" 
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="tk-input" 
                  style={{ width: '100%' }} 
                  required 
                />
              </div>
              <button type="submit" className="liquid-glass" style={{ padding: '10px', fontWeight: 800, marginTop: '10px' }}>
                Add Domain
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

