'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { playSound } from '@/lib/audioEngine'

export type ToastType = 'success' | 'error' | 'info'

interface SystemMessageContextType {
  showToast: (message: string, type?: ToastType) => void
}

const SystemMessageContext = createContext<SystemMessageContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<ToastType>('success')

  const showToast = useCallback((msg: string, msgType: ToastType = 'success') => {
    setMessage(msg)
    setType(msgType)
    setIsOpen(true)

    if (msgType === 'success') playSound('success');
    else if (msgType === 'error') playSound('error');
    else playSound('notification');

    setTimeout(() => {
      setIsOpen(false);
    }, 5000);
  }, [])

  const closeMessage = () => setIsOpen(false)

  const icon = type === 'success' 
    ? <svg className="anim-icon" viewBox="0 0 52 52" style={{ stroke: 'var(--success)', fill: 'none' }}><circle className="anim-circle" cx="26" cy="26" r="25" /><path className="anim-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" /></svg>
    : type === 'error'
    ? <svg className="anim-icon" viewBox="0 0 52 52" style={{ stroke: 'var(--danger)', fill: 'none' }}><circle className="anim-circle" cx="26" cy="26" r="25" /><path className="anim-cross1" d="M16 16 36 36" /><path className="anim-cross2" d="M36 16 16 36" /></svg>
    : <svg className="anim-icon" viewBox="0 0 52 52" style={{ stroke: 'var(--brand)', fill: 'none' }}><circle className="anim-circle" cx="26" cy="26" r="25" /><path className="anim-check" d="M26 16v12" /><circle className="anim-cross1" cx="26" cy="36" r="1" fill="currentColor" strokeWidth="0" /></svg>
    

  const titleColor = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--brand)'
  const titleText = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'System Notice'

  return (
    <SystemMessageContext.Provider value={{ showToast }}>
      {children}
      {isOpen && (
        <div id="customAlert" className="glass-overlay active" style={{ zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-box" style={{ maxWidth: '450px', width: '100%', padding: '40px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div className="premium-sticky-header">
              <h2 style={{ color: titleColor }}>
                  {titleText}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" className="close-minimal" onClick={closeMessage} style={{ position: 'relative', top: 0, right: 0 }}>&times;</button>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <div style={{ marginBottom: '15px' }}>{icon}</div>
              <p style={{ marginBottom: '25px', lineHeight: 1.6, color: 'var(--text)', fontSize: '14px', fontWeight: 600 }}>
                {message}
              </p>
            </div>
            <button 
              onClick={closeMessage} 
              style={{ width: '100%', background: 'linear-gradient(135deg, var(--brand), #00c985)', color: '#000', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </SystemMessageContext.Provider>
  )
}

export function useToast() {
  const context = useContext(SystemMessageContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}



