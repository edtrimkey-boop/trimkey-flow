"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div id="toastContainer" className="toast-container" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-message toast-${toast.type}`} style={{
            background: toast.type === 'success' ? 'rgba(46, 204, 113, 0.15)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 251, 166, 0.15)',
            color: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--danger)' : 'var(--brand)',
            padding: '12px 20px',
            borderRadius: '8px',
            border: `1px solid ${toast.type === 'success' ? 'rgba(46,204,113,0.3)' : toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(0, 251, 166, 0.3)'}`,
            backdropFilter: 'blur(10px)',
            fontWeight: 800,
            fontSize: '13px',
            animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

