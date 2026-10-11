'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { playSound } from '@/lib/audioEngine'

interface ConfirmContextType {
  confirm: (message: string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>()

  const confirm = useCallback((msg: string) => {
    playSound('warning')
    
    setMessage(msg)
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    setIsOpen(false)
    if (resolvePromise) resolvePromise(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    if (resolvePromise) resolvePromise(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="glass-overlay active" style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div 
            className="glass-box" 
            style={{ 
              maxWidth: '460px', 
              width: '92%', 
              padding: '32px', 
              textAlign: 'left', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              position: 'relative',
              backgroundColor: 'rgba(10, 15, 25, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              borderRadius: '20px'
            }}
          >
            <div className="premium-sticky-header" style={{ marginBottom: '16px' }}>
                <h2 style={{ color: 'var(--brand)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: 800 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Confirm Action
                </h2>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button type="button" className="close-minimal" onClick={handleCancel} style={{ position: 'relative', top: 0, right: 0, cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px' }}>&times;</button>
                </div>
            </div>
            <p style={{ marginBottom: '25px', lineHeight: 1.6, color: 'var(--text)', fontSize: '13.5px', fontWeight: 600 }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={handleCancel} 
                className="liquid-glass" 
                style={{ flex: 1, padding: '10px 16px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirm} 
                className="liquid-glass"
                style={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, var(--danger), #B91C1C)', 
                  color: 'white', 
                  border: '1px solid rgba(239, 68, 68, 0.6)', 
                  cursor: 'pointer', 
                  padding: '10px 16px', 
                  fontSize: '12.5px',
                  fontWeight: 800,
                  textAlign: 'center'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider')
  return context
}

