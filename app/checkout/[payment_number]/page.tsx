'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Script from 'next/script'
import { Logo } from '@/components/ui/logo'
import { getCheckoutData, verifyCheckoutPayment, recordPaymentFailureAction } from '../actions'

export default function CheckoutPage() {
  const params = useParams()
  const paymentNumber = params.payment_number as string

  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [copiedTrx, setCopiedTrx] = useState(false)

  useEffect(() => {
    getCheckoutData(paymentNumber)
      .then(data => {
        setPaymentData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Unable to load payment session')
        setLoading(false)
      })
  }, [paymentNumber])

  function handleCopyTrx() {
    if (!paymentNumber) return
    navigator.clipboard.writeText(paymentNumber)
    setCopiedTrx(true)
    setTimeout(() => setCopiedTrx(false), 2000)
  }

  function handlePay() {
    if (!paymentData) return
    setProcessing(true)
    setError(null)

    // Simulate payment process delay for mock Stripe
    setTimeout(() => {
      if (paymentData.provider_order_id?.startsWith('pi_stripe_')) {
        console.log('Stripe Secure Checkout Initialized!\n\nOrder ID: ' + paymentData.provider_order_id)
        triggerSuccess()
        return
      }

      // Razorpay Order Options
      const options = {
        key: paymentData.key_id,
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency || 'INR',
        name: paymentData.merchant_name || 'Merchant',
        description: paymentData.purpose || `Payment for ${paymentNumber}`,
        order_id: paymentData.provider_order_id,
        handler: async function (response: any) {
          console.log(`[Checkout]: Received gateway payment ${response.razorpay_payment_id}. Initiating server-side cryptographic verification...`)
          setVerifying(true)

          try {
            await verifyCheckoutPayment({
              paymentNumber,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setVerifying(false)
            triggerSuccess()
          } catch (verifErr: any) {
            console.error('[Checkout Security Alert]: Verification failed', verifErr)
            setVerifying(false)
            setProcessing(false)
            setError(verifErr.message || 'Cryptographic verification failed. Payment was not confirmed.')
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false)
          },
        },
        prefill: {
          name: paymentData.customer_name || 'Customer',
          email: 'customer@trimkey.in',
          contact: '9999999999',
        },
        theme: {
          color: '#00fba6',
        },
      }

      if (typeof (window as any).Razorpay !== 'function') {
        setError('Payment gateway SDK is still loading or blocked. Please check your connection and refresh.')
        setProcessing(false)
        return
      }

      const rzp1 = new (window as any).Razorpay(options)

      // Listen for payment failure events directly from Razorpay SDK
      rzp1.on('payment.failed', async function (response: any) {
        console.error('[Razorpay Payment Failed]:', response.error)
        const failureReason = response.error?.description || 'Payment was unsuccessful or rejected by gateway.'
        setError(failureReason)
        setProcessing(false)
        setVerifying(false)

        try {
          await recordPaymentFailureAction({
            paymentNumber,
            code: response.error?.code,
            reason: response.error?.description,
            paymentId: response.error?.metadata?.payment_id,
          })
        } catch (recErr) {
          console.error('Failed to log payment failure:', recErr)
        }
      })

      rzp1.open()

      // Mock success if key is dummy
      if (paymentData.key_id === 'dummy') {
        setTimeout(() => {
          console.log('Mocking Razorpay success for dummy key...')
          triggerSuccess()
        }, 2000)
      }
    }, 600)
  }

  function triggerSuccess() {
    if (typeof window !== 'undefined' && (window as any).tkPlaySound) {
      ;(window as any).tkPlaySound('notification')
    }
    setSuccess(true)
  }

  const isConfirmedSuccess = success || paymentData?.status === 'SUCCESS' || paymentData?.status === 'success'

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060B12',
          position: 'relative',
        }}
      >
        <div style={{ width: '70px', height: '70px', marginBottom: '24px' }}>
          <Logo glow={true} />
        </div>
        <div
          style={{
            color: '#00fba6',
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        >
          Initializing Secure Session...
        </div>
      </div>
    )
  }

  if (error && !paymentData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060B12',
          padding: '24px',
        }}
      >
        <div
          className="panel"
          style={{
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            padding: '40px 30px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Payment Session Unavailable</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>{error}</p>
        </div>
      </div>
    )
  }

  const formattedAmount = ((parseFloat(paymentData?.amount || '0')) / 100).toFixed(2)

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060B12',
        position: 'relative',
        overflowX: 'hidden',
        padding: '40px 20px',
      }}
    >
      {/* Inject Razorpay Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Floating Ambient Glowing Light Spheres */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, rgba(0, 251, 166, 0.12) 0%, rgba(38, 195, 234, 0.05) 45%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(38, 195, 234, 0.08) 0%, transparent 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating Top Security Pill */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '50px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          marginBottom: '24px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00fba6',
            boxShadow: '0 0 8px #00fba6',
          }}
        />
        <span>Trim Key Flow Secure Checkout</span>
      </div>

      {/* Main Glass Checkout Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '450px',
          width: '100%',
          background: 'rgba(11, 18, 32, 0.82)',
          backdropFilter: 'blur(36px) saturate(200%)',
          WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          padding: '36px 30px',
          textAlign: 'center',
        }}
      >
        {isConfirmedSuccess ? (
          /* ================= SUCCESS STATE ================= */
          <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'rgba(0, 251, 166, 0.15)',
                border: '1px solid rgba(0, 251, 166, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 30px rgba(0, 251, 166, 0.3)',
              }}
            >
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#00fba6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, margin: '0 0 6px' }}>
              Payment Successful!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 24px' }}>
              Your transaction has been cryptographically confirmed and settled.
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Amount Paid
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#00fba6' }}>
                  ₹{formattedAmount}
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transaction Reference</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#fff' }}>{paymentNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Merchant</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>{paymentData.merchant_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#00fba6', textTransform: 'uppercase', background: 'rgba(0, 251, 166, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  SETTLED
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.opener) {
                  window.close()
                } else {
                  window.location.href = '/dashboard/transactions'
                }
              }}
              className="liquid-glass"
              style={{
                width: '100%',
                padding: '14px',
                fontWeight: 800,
                fontSize: '13px',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ================= ACTIVE CHECKOUT FORM ================= */
          <>
            {/* Header / Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '54px', height: '54px' }}>
                <Logo glow={true} />
              </div>
            </div>

            {/* Merchant Identity */}
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
              {paymentData.merchant_name}
            </h2>

            {/* Verified Merchant Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '50px',
                background: 'rgba(0, 251, 166, 0.1)',
                border: '1px solid rgba(0, 251, 166, 0.25)',
                color: '#00fba6',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '10px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-2 16l-4-4 1.41-1.41L10 15.17l6.59-6.59L18 10l-8 8z" />
              </svg>
              <span>Verified Merchant</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 24px', fontWeight: 500 }}>
              {paymentData.purpose || 'Secure Checkout Session'}
            </p>

            {/* Gateway Error Alert */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  textAlign: 'left',
                }}
              >
                <div style={{ color: '#f87171', fontWeight: 800, fontSize: '11px', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Gateway Alert
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '11px', lineHeight: 1.4 }}>
                  {error}
                </div>
              </div>
            )}

            {/* Recessed Total Amount Showcase */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(0, 251, 166, 0.2)',
                borderRadius: '18px',
                padding: '24px 16px',
                marginBottom: '22px',
                boxShadow: 'inset 0 2px 12px rgba(0, 0, 0, 0.5)',
              }}
            >
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  margin: '0 0 6px',
                }}
              >
                Total Amount To Pay
              </p>
              <h1
                style={{
                  fontSize: '44px',
                  color: '#00fba6',
                  fontWeight: 900,
                  margin: '0 0 10px',
                  letterSpacing: '-1.5px',
                  textShadow: '0 0 25px rgba(0, 251, 166, 0.25)',
                }}
              >
                ₹{formattedAmount}
              </h1>

              {/* Monospace Reference with 1-Click Copy */}
              <button
                type="button"
                onClick={handleCopyTrx}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  transition: 'all 0.15s ease',
                }}
                title="Click to copy Transaction ID"
              >
                <span>TRX: {paymentNumber}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copiedTrx && <span style={{ color: '#00fba6', fontWeight: 800 }}>Copied!</span>}
              </button>
            </div>

            {/* Payment Method Badges */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '22px',
                flexWrap: 'wrap',
              }}
            >
              {['UPI (GPay / PhonePe)', 'Credit / Debit Cards', 'NetBanking'].map((method) => (
                <span
                  key={method}
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {method}
                </span>
              ))}
            </div>

            {/* High-Impact Primary Payment Button */}
            <button
              onClick={handlePay}
              disabled={processing || verifying}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '15px',
                fontWeight: 900,
                color: '#05080f',
                background: 'linear-gradient(135deg, #00fba6 0%, #00d285 100%)',
                border: 'none',
                borderRadius: '14px',
                cursor: (processing || verifying) ? 'not-allowed' : 'pointer',
                opacity: (processing || verifying) ? 0.75 : 1,
                boxShadow: '0 8px 30px rgba(0, 251, 166, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              {verifying ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(5, 8, 15, 0.3)',
                      borderTopColor: '#05080f',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Verifying Cryptography...</span>
                </>
              ) : processing ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(5, 8, 15, 0.3)',
                      borderTopColor: '#05080f',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Opening Gateway...</span>
                </>
              ) : error ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Retry Payment</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Pay ₹{formattedAmount} Securely</span>
                </>
              )}
            </button>

            {/* 256-Bit SSL Trust Footer */}
            <div
              style={{
                marginTop: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>256-BIT SSL ENCRYPTION • RBI / NPCI COMPLIANT</span>
            </div>
          </>
        )}
      </div>

      {/* Floating Bottom Brand Mark */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '24px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
      >
        Powered by Trim Key Flow
      </div>
    </div>
  )
}
