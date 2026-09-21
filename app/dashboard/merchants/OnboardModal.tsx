'use client'

import React, { useState } from 'react'
import { onboardMerchantAction } from './actions'
import { useToast } from '@/components/ui/ToastProvider'

export function OnboardModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await onboardMerchantAction(formData)
      setIsOpen(false)
      showToast('Merchant successfully onboarded!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to onboard merchant', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        className="liquid-glass" 
        onClick={() => setIsOpen(true)}
        style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
      >
        <span style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'middle' }}>+</span>
        Onboard Merchant
      </button>

      {isOpen && (
        <div className="glass-overlay active" style={{ zIndex: 9999 }}>
          <div className="glass-box" style={{ width: '100%', maxWidth: '550px' }}>
            <div className="premium-sticky-header">
              <h2 style={{ color: 'var(--brand)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Register Merchant
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" className="close-minimal" onClick={() => setIsOpen(false)} style={{ position: 'relative', top: 0, right: 0 }}>&times;</button>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>Configure access and secrets for a new merchant.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="label-text">Merchant Name <span className="req">*</span></label>
                <input required name="name" type="text" className="form-input" placeholder="e.g. Acme Shoes" />
              </div>

              <div className="grid-2" style={{ marginBottom: '15px' }}>
                <div className="form-group">
                  <label className="label-text">Primary Gateway <span className="req">*</span></label>
                  <select required name="provider" className="form-input" style={{ appearance: 'auto' }}>
                    <option value="razorpay">Razorpay</option>
                    <option value="stripe">Stripe</option>
                    <option value="cashfree">Cashfree</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label-text">Webhook Secret (Optional)</label>
                  <input name="webhook_secret" type="password" className="form-input" placeholder="For receiving webhooks" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label className="label-text" style={{ color: 'var(--brand)' }}>Gateway Credentials</label>
                
                <div style={{ marginTop: '10px' }}>
                  <label className="label-text">Key ID / Publishable Key <span className="req">*</span></label>
                  <input required name="key_id" type="text" className="form-input" style={{ marginBottom: '10px' }} />
                </div>
                
                <div>
                  <label className="label-text">Key Secret <span className="req">*</span></label>
                  <input required name="key_secret" type="password" className="form-input" />
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit" 
                style={{ width: '100%', background: 'linear-gradient(135deg, var(--brand), #00c985)', color: '#000', marginTop: '15px', padding: '12px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Onboarding...' : 'Save & Encrypt Secrets'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
