'use client'

import React from 'react'
import { ModalPortal } from './ModalPortal'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  title: string | React.ReactNode
  children: React.ReactNode
  maxWidth?: string
}

export function PremiumModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
}: PremiumModalProps) {
  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth}>
      <div className="premium-sticky-header" style={{ marginBottom: '18px' }}>
        <h2 style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px', fontWeight: 800 }}>
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="close-minimal"
          aria-label="Close"
          style={{ position: 'relative', top: 0, right: 0 }}
        >
          &times;
        </button>
      </div>

      <div>{children}</div>
    </ModalPortal>
  )
}
