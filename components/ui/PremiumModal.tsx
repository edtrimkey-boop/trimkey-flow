'use client'

import React, { useEffect } from 'react'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  title: string | React.ReactNode
  children: React.ReactNode
  maxWidth?: string
}

export function PremiumModal({ isOpen, onClose, title, children, maxWidth = '450px' }: PremiumModalProps) {
  // Handle escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="glass-overlay active z-[9999]" 
      onClick={onClose} // Clicking outside closes the modal
    >
      <div 
        className="glass-box relative max-h-[90vh] overflow-y-auto"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()} // Prevent clicking inside from closing
      >
        <div className="premium-sticky-header">
          <h2 className="text-brand flex items-center gap-2 m-0 text-base font-extrabold">
            {title}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="close-minimal"
            aria-label="Close"
          >
            ✖
          </button>
        </div>
        
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  )
}
