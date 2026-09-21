'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ConfirmContextType {
  confirm: (message: string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>()

  const confirm = useCallback((msg: string) => {
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
          <div className="glass-box" style={{ maxWidth: '450px', width: '100%', padding: '40px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div className="premium-sticky-header">
                <h2 style={{ color: 'var(--brand)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                  Confirm Action
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" className="close-minimal" onClick={handleCancel} style={{ position: 'relative', top: 0, right: 0 }}>&times;</button>
                </div>
            </div>
            <p style={{ marginBottom: '30px', lineHeight: 1.6, color: 'var(--text)', fontSize: '14px', fontWeight: 600 }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleCancel} className="btn-outline" style={{ flex: 1, borderColor: 'var(--text-muted)', color: 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '6px' }}>Cancel</button>
              <button onClick={handleConfirm} style={{ flex: 1, background: 'linear-gradient(135deg, var(--danger), #B91C1C)', color: 'white', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '6px', fontWeight: 800 }}>Confirm</button>
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
