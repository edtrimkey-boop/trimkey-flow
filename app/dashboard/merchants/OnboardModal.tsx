'use client'

import React, { useState } from 'react'
import { onboardMerchantAction } from './actions'

export function OnboardModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await onboardMerchantAction(formData)
      setIsOpen(false)
    } catch (err: any) {
      alert(err.message)
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="panel" style={{ width: '400px', backgroundColor: '#111827', border: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'white' }}>Onboard Merchant</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>x</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '5px' }}>Merchant Name</label>
                <input required name="name" type="text" placeholder="e.g. Acme Shoes" style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid #374151', color: 'white', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '5px' }}>Primary Gateway</label>
                <select required name="provider" style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid #374151', color: 'white', borderRadius: '6px' }}>
                  <option value="razorpay">Razorpay</option>
                  <option value="stripe">Stripe</option>
                  <option value="cashfree">Cashfree</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '5px' }}>Key ID / Publishable Key</label>
                <input required name="key_id" type="text" style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid #374151', color: 'white', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '5px' }}>Key Secret</label>
                <input required name="key_secret" type="password" style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid #374151', color: 'white', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '5px' }}>Webhook Secret (Optional)</label>
                <input name="webhook_secret" type="password" placeholder="For receiving provider webhooks" style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid #374151', color: 'white', borderRadius: '6px' }} />
              </div>

              <button 
                disabled={loading}
                type="submit" 
                style={{ width: '100%', padding: '12px', marginTop: '10px', background: 'linear-gradient(135deg, var(--brand), #1A9CBF)', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}
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
