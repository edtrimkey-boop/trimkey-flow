'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPaymentLinkAction } from './actions'
import { useToast } from '@/components/ui/ToastProvider'
import type { CheckoutInfo } from '@/types/api'

interface ApplicationOption {
  id: string
  name: string
}

interface MerchantOption {
  id: string
  name: string
  status: string
}

interface CreatePaymentModalProps {
  applications: ApplicationOption[]
  merchants: MerchantOption[]
}

export default function CreatePaymentModal({
  applications,
  merchants,
}: CreatePaymentModalProps) {
  const router = useRouter()
  const { showToast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [applicationId, setApplicationId] = useState(applications[0]?.id || '')
  const [merchantId, setMerchantId] = useState(merchants[0]?.id || '')
  const [amountInInr, setAmountInInr] = useState('1')
  const [purpose, setPurpose] = useState('₹1 Live Production Test')
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [customerName, setCustomerName] = useState('Test Customer')
  const [customerEmail, setCustomerEmail] = useState('customer@trimkey.in')
  const [customerPhone, setCustomerPhone] = useState('9999999999')

  // Success Result State
  const [checkoutResult, setCheckoutResult] = useState<CheckoutInfo | null>(null)
  const [copied, setCopied] = useState(false)

  // Handle Preset Clicks
  const handlePresetAmount = (amt: string) => {
    setAmountInInr(amt)
  }

  const handleOpenModal = () => {
    // Reset to initial clean state
    if (!applicationId && applications.length > 0) setApplicationId(applications[0].id)
    if (!merchantId && merchants.length > 0) setMerchantId(merchants[0].id)
    setError(null)
    setCheckoutResult(null)
    setCopied(false)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    if (checkoutResult) {
      router.refresh()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amt = parseFloat(amountInInr)
    if (isNaN(amt) || amt < 1) {
      setError('Amount must be at least ₹1.00')
      return
    }

    const appToUse = applicationId || applications[0]?.id
    const merchantToUse = merchantId || merchants[0]?.id

    if (!appToUse) {
      setError('No application found. Please create an application first.')
      return
    }

    if (!merchantToUse) {
      setError('No active merchant found. Please onboard a merchant first.')
      return
    }

    setLoading(true)
    try {
      const result = await createPaymentLinkAction({
        applicationId: appToUse,
        merchantId: merchantToUse,
        amountInInr: amt,
        purpose: purpose.trim() || '₹1 Live Production Test',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
      })

      // Normalize checkout URL if backend produced localhost link
      let finalUrl = result.checkout_url
      if (typeof window !== 'undefined' && finalUrl.includes('localhost:3000')) {
        finalUrl = `${window.location.origin}/checkout/${result.payment_number}`
      }

      setCheckoutResult({
        ...result,
        checkout_url: finalUrl,
      })
      showToast('Payment link created successfully!', 'success')
      router.refresh()
    } catch (err: any) {
      console.error('[CreatePaymentModal Error]:', err)
      const msg = err.message || 'Failed to create payment link. Please check gateway credentials.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!checkoutResult?.checkout_url) return
    navigator.clipboard.writeText(checkoutResult.checkout_url)
    setCopied(true)
    showToast('Payment checkout link copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePayNow = () => {
    if (!checkoutResult?.checkout_url) return
    window.open(checkoutResult.checkout_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="liquid-glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: 800,
          background: 'linear-gradient(135deg, rgba(0, 251, 166, 0.15) 0%, rgba(38, 195, 234, 0.2) 100%)',
          borderColor: 'rgba(0, 251, 166, 0.35)',
          color: '#00fba6',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
        }}
        title="Create a live or test payment checkout link"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Create Payment Link</span>
      </button>

      {isOpen && (
        <div
          className="glass-overlay active"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.82)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) handleClose()
          }}
        >
          <div
            className="glass-box"
            style={{
              width: '480px',
              maxWidth: '100%',
              background: 'rgba(11, 17, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 251, 166, 0.2) 0%, rgba(38, 195, 234, 0.2) 100%)',
                    border: '1px solid rgba(0, 251, 166, 0.3)',
                    padding: '8px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#00fba6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                    {checkoutResult ? 'Payment Link Ready' : 'Create Payment Link'}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {checkoutResult ? 'Live checkout URL generated' : 'Configure a 1-click live test or customer payment'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  margin: '16px 24px 0',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Body */}
            {checkoutResult ? (
              /* Success View */
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    background: 'rgba(0, 251, 166, 0.06)',
                    border: '1px solid rgba(0, 251, 166, 0.25)',
                    borderRadius: '14px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(0, 251, 166, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#00fba6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    Payment Session Created
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 900, color: '#fff', margin: '4px 0' }}>
                    ₹{(checkoutResult.amount / 100).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#00fba6', fontFamily: 'monospace' }}>
                    {checkoutResult.payment_number}
                  </div>
                </div>

                {/* Checkout Link Display */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                    Direct Checkout URL
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {checkoutResult.checkout_url}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={handlePayNow}
                    className="liquid-glass"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontWeight: 800,
                      fontSize: '14px',
                      background: 'linear-gradient(135deg, #00fba6 0%, #26c3ea 100%)',
                      color: '#05080f',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(0, 251, 166, 0.3)',
                    }}
                  >
                    <span>Open & Pay (₹{(checkoutResult.amount / 100).toFixed(2)})</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={handleCopy}
                      className="liquid-glass"
                      style={{
                        padding: '10px',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>

                    <button
                      onClick={() => {
                        setCheckoutResult(null)
                        setError(null)
                      }}
                      className="liquid-glass"
                      style={{
                        padding: '10px',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Create Another
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Creation Form */
              <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Application Selector */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                    Application
                  </label>
                  <select
                    className="tk-input"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer' }}
                    required
                  >
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Merchant Selector */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                    Merchant Account
                  </label>
                  <select
                    className="tk-input"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer' }}
                    required
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount in INR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Amount (INR)
                    </label>
                    <span style={{ fontSize: '10px', color: '#00fba6', fontWeight: 600 }}>
                      ₹{amountInInr || '0'} = {Math.round((parseFloat(amountInInr) || 0) * 100)} paise
                    </span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--brand)',
                        fontWeight: 800,
                        fontSize: '16px',
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="tk-input"
                      value={amountInInr}
                      onChange={(e) => setAmountInInr(e.target.value)}
                      placeholder="1.00"
                      style={{ width: '100%', paddingLeft: '32px', fontSize: '15px', fontWeight: 800 }}
                      required
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[
                      { label: '₹1 (Test)', val: '1' },
                      { label: '₹5', val: '5' },
                      { label: '₹10', val: '10' },
                      { label: '₹50', val: '50' },
                      { label: '₹100', val: '100' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => handlePresetAmount(p.val)}
                        style={{
                          background: amountInInr === p.val ? 'rgba(0, 251, 166, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: amountInInr === p.val ? '1px solid #00fba6' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: amountInInr === p.val ? '#00fba6' : 'var(--text-muted)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                    Purpose / Description
                  </label>
                  <input
                    type="text"
                    className="tk-input"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. ₹1 Live Production Test"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                {/* Optional Customer Details Toggle */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{showCustomerDetails ? '− Hide Customer Info' : '+ Add Customer Info (Optional)'}</span>
                  </button>

                  {showCustomerDetails && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      <input
                        type="text"
                        className="tk-input"
                        placeholder="Customer Name (e.g. John Doe)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', fontSize: '12px' }}
                      />
                      <input
                        type="email"
                        className="tk-input"
                        placeholder="Customer Email (e.g. customer@example.com)"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        style={{ width: '100%', fontSize: '12px' }}
                      />
                      <input
                        type="tel"
                        className="tk-input"
                        placeholder="Customer Phone (e.g. 9999999999)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={{ width: '100%', fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="liquid-glass"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontWeight: 800,
                      fontSize: '13px',
                      background: 'linear-gradient(135deg, rgba(0, 251, 166, 0.2) 0%, rgba(38, 195, 234, 0.25) 100%)',
                      borderColor: 'rgba(0, 251, 166, 0.4)',
                      color: '#00fba6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      borderRadius: '10px',
                    }}
                  >
                    {loading ? (
                      <>
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(0, 251, 166, 0.3)',
                            borderTopColor: '#00fba6',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        <span>Creating Razorpay Session...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Payment Link (₹{amountInInr || '1'})</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
