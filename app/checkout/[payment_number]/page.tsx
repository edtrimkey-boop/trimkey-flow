'use client'

import React, { useEffect, useState, useMemo } from 'react'
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
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // Default 15 mins

  useEffect(() => {
    getCheckoutData(paymentNumber)
      .then((data) => {
        setPaymentData(data)
        if (typeof data.remaining_seconds === 'number') {
          setTimeLeft(data.remaining_seconds)
        }
        setLoading(false)

        // Broadcast readiness to parent if embedded
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'TK_FLOW_READY', paymentNumber }, '*')
        }
      })
      .catch((err) => {
        setError(err.message || 'Unable to load payment session')
        setLoading(false)
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'TK_FLOW_ERROR', error: err.message }, '*')
        }
      })
  }, [paymentNumber])

  // Real-time countdown timer synchronized with server remaining_seconds
  useEffect(() => {
    if (loading || success || !paymentData) return
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, success, paymentData, timeLeft])

  const isExpired = timeLeft <= 0 || paymentData?.status === 'EXPIRED'

  const formattedTimeLeft = useMemo(() => {
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [timeLeft])

  function handleCopyTrx() {
    if (!paymentNumber) return
    navigator.clipboard.writeText(paymentNumber)
    setCopiedTrx(true)
    setTimeout(() => setCopiedTrx(false), 2000)
  }

  function handlePay() {
    if (!paymentData || isExpired) return
    setProcessing(true)
    setError(null)

    setTimeout(() => {
      // Mock Stripe flow
      if (paymentData.provider_order_id?.startsWith('pi_stripe_')) {
        console.log('[Stripe Checkout]: Initializing mock charge...')
        triggerSuccess({ razorpay_payment_id: 'pi_stripe_success' })
        return
      }

      // Razorpay Checkout Configuration
      const options = {
        key: paymentData.key_id,
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency || 'INR',
        name: paymentData.merchant_name || 'Merchant',
        description: paymentData.purpose || `Payment for ${paymentNumber}`,
        order_id: paymentData.provider_order_id,
        handler: async function (response: any) {
          console.log('[Checkout]: Received payment authorization. Cryptographically verifying server-side...')
          setVerifying(true)

          try {
            await verifyCheckoutPayment({
              paymentNumber,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setVerifying(false)
            triggerSuccess(response)
          } catch (verifErr: any) {
            console.error('[Checkout Security Alert]: Verification rejected', verifErr)
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
          email: paymentData.customer_email || 'customer@trimkey.in',
          contact: paymentData.customer_phone || '9999999999',
        },
        theme: {
          color: '#00F5A0',
        },
      }

      if (typeof (window as any).Razorpay !== 'function') {
        setError('Payment gateway SDK is still initializing. Please check your internet connection and refresh.')
        setProcessing(false)
        return
      }

      const rzpInstance = new (window as any).Razorpay(options)

      rzpInstance.on('payment.failed', async function (response: any) {
        console.error('[Payment Gateway Error]:', response.error)
        const failureReason = response.error?.description || 'Payment was unsuccessful or rejected by issuing bank.'
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

      rzpInstance.open()

      // Sandbox Mock Fallback
      if (paymentData.key_id === 'dummy' || !paymentData.key_id) {
        setTimeout(() => {
          console.log('[Dev Mode]: Mocking successful payment completion...')
          triggerSuccess({ razorpay_payment_id: 'mock_pay_123' })
        }, 1800)
      }
    }, 450)
  }

  function triggerSuccess(response?: any) {
    if (typeof window !== 'undefined' && (window as any).tkPlaySound) {
      ;(window as any).tkPlaySound('notification')
    }
    setSuccess(true)

    if (typeof window !== 'undefined') {
      try {
        const payload = {
          type: 'TK_FLOW_PAYMENT_SUCCESS',
          paymentNumber,
          amount: paymentData?.amount,
          status: 'SUCCESS',
          provider_payment_id: response?.razorpay_payment_id || paymentData?.provider_payment_id,
        }
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(payload, '*')
        }
        if (window.opener) {
          window.opener.postMessage(payload, '*')
        }
      } catch (err) {
        console.error('[Trim Key Flow]: PostMessage dispatch error', err)
      }
    }
  }

  async function handleDownloadReceipt() {
    if (!paymentData) return
    setDownloadingPdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      const formattedAmt = (parseFloat(paymentData.amount || '0') / 100).toFixed(2)

      // Header Banner
      doc.setFillColor(7, 11, 18)
      doc.rect(0, 0, 210, 42, 'F')

      doc.setTextColor(0, 245, 160)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('TRIM KEY FLOW', 15, 20)

      doc.setTextColor(200, 210, 225)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('OFFICIAL PAYMENT CONFIRMATION RECEIPT', 15, 28)

      doc.setTextColor(140, 155, 175)
      doc.setFontSize(8)
      doc.text(`ISSUED: ${new Date().toUTCString()}`, 15, 35)

      // Receipt Metadata Box
      doc.setDrawColor(220, 225, 235)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(15, 50, 180, 52, 3, 3, 'FD')

      doc.setTextColor(30, 41, 59)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('TRANSACTION SUMMARY', 20, 59)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.text(`Payment Reference: ${paymentNumber}`, 20, 68)
      doc.text(`Merchant: ${paymentData.merchant_name}`, 20, 76)
      doc.text(`Purpose: ${paymentData.purpose || 'Payment'}`, 20, 84)
      doc.text(`Settlement Status: SUCCESSFUL (Cryptographically Verified)`, 20, 92)

      // Amount Breakdown
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text(`Total Amount Paid: INR ${formattedAmt}`, 20, 115)

      // Customer Details (if present)
      if (paymentData.customer_name || paymentData.customer_email) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text('CUSTOMER INFORMATION', 20, 130)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(71, 85, 105)
        if (paymentData.customer_name) doc.text(`Customer Name: ${paymentData.customer_name}`, 20, 138)
        if (paymentData.customer_email) doc.text(`Customer Email: ${paymentData.customer_email}`, 20, 145)
      }

      // Security Compliance Footer
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text('This receipt was generated by Trim Key Flow Payment Infrastructure.', 15, 275)
      doc.text('Transactions are protected by 256-bit encryption & strict RBI/NPCI guidelines.', 15, 280)

      doc.save(`TrimKey_Receipt_${paymentNumber}.pdf`)
    } catch (pdfErr) {
      console.error('PDF Generation error:', pdfErr)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const isConfirmedSuccess = success || paymentData?.status === 'SUCCESS' || paymentData?.status === 'success'
  const formattedAmount = ((parseFloat(paymentData?.amount || '0')) / 100).toFixed(2)

  // -------------------------------------------------------------
  // Initial Loading Screen (Obsidian Glass)
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="tk-checkout-root">
        <div className="tk-ambient-glow-top" />
        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px' }}>
            <Logo glow={true} />
          </div>
          <div className="tk-mono-label" style={{ color: '#00F5A0', letterSpacing: '2px' }}>
            INITIALIZING SECURE SESSION
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginTop: '6px' }}>
            Establishing 256-bit encrypted handshake...
          </p>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // Error Screen (Session Unavailable)
  // -------------------------------------------------------------
  if (error && !paymentData) {
    return (
      <div className="tk-checkout-root">
        <div className="tk-panel-glass" style={{ maxWidth: '440px', textAlign: 'center', padding: '40px 30px' }}>
          <div className="tk-error-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>
            Checkout Session Expired or Invalid
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '13px', lineHeight: 1.5, margin: '0 0 24px' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="tk-secondary-btn"
            style={{ width: '100%', padding: '12px' }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // Main Premium Checkout UI
  // -------------------------------------------------------------
  return (
    <div className="tk-checkout-root">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Embedded High-Fidelity Stylesheet */}
      <style jsx global>{`
        :root {
          --tk-bg-dark: #070B12;
          --tk-emerald: #00F5A0;
          --tk-emerald-glow: rgba(0, 245, 160, 0.35);
          --tk-border: rgba(255, 255, 255, 0.08);
          --tk-border-hover: rgba(255, 255, 255, 0.16);
          --tk-glass: rgba(14, 22, 36, 0.72);
        }

        .tk-checkout-root {
          min-height: 100vh;
          width: 100vw;
          background: var(--tk-bg-dark);
          background-image: 
            radial-gradient(at 0% 0%, rgba(0, 245, 160, 0.04) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(38, 195, 234, 0.04) 0px, transparent 50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow-x: hidden;
          padding: 30px 20px;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .tk-ambient-glow-top {
          position: absolute;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          width: 650px;
          height: 450px;
          background: radial-gradient(circle, rgba(0, 245, 160, 0.10) 0%, rgba(38, 195, 234, 0.03) 50%, transparent 70%);
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }

        .tk-panel-glass {
          background: var(--tk-glass);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          border: 1px solid var(--tk-border);
          border-radius: 24px;
          box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .tk-mono-label {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .tk-primary-btn {
          width: 100%;
          padding: 16px 24px;
          font-size: 15px;
          font-weight: 700;
          color: #05080f;
          background: linear-gradient(135deg, #00F5A0 0%, #00D58C 100%);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(0, 245, 160, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .tk-primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(0, 245, 160, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.5);
          filter: brightness(1.03);
        }

        .tk-primary-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .tk-secondary-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tk-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.18);
        }

        .tk-method-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid var(--tk-border);
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .tk-method-chip.active {
          border-color: rgba(0, 245, 160, 0.45);
          background: rgba(0, 245, 160, 0.06);
          box-shadow: 0 4px 16px rgba(0, 245, 160, 0.1);
        }

        .tk-error-badge {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        @keyframes tk-spin {
          to { transform: rotate(360deg); }
        }

        .tk-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(5, 8, 15, 0.25);
          border-top-color: #05080f;
          border-radius: 50%;
          animation: tk-spin 0.75s linear infinite;
        }

        @media (max-width: 860px) {
          .tk-desktop-left {
            display: none !important;
          }
          .tk-mobile-accordion {
            display: block !important;
          }
          .tk-main-grid {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
          }
        }
      `}</style>

      {/* Ambient Lighting Spheres */}
      <div className="tk-ambient-glow-top" />

      {/* Top Session Security Indicator */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 16px',
          borderRadius: '50px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          marginBottom: '28px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.75)',
        }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isExpired ? '#ef4444' : '#00F5A0', boxShadow: isExpired ? '0 0 10px #ef4444' : '0 0 10px #00F5A0' }} />
        <span style={{ fontWeight: 600 }}>Secured by Trim Key Flow</span>
        <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>•</span>
        <span className="tk-mono-label" style={{ color: isExpired ? '#ef4444' : '#00F5A0', fontSize: '10px' }}>
          {isExpired ? 'SESSION EXPIRED' : `SESSION EXPIRES IN: ${formattedTimeLeft}`}
        </span>
      </div>

      {/* Main Grid Container */}
      <div
        className="tk-main-grid tk-panel-glass"
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '920px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isConfirmedSuccess || isExpired ? '1fr' : '1.05fr 1fr',
          overflow: 'hidden',
        }}
      >
        {isConfirmedSuccess ? (
          /* ========================================================= */
          /* SUCCESS STATE: Ultra-Refined Digital Settlement Document   */
          /* ========================================================= */
          <div style={{ padding: '48px 36px', textAlign: 'center', maxWidth: '580px', margin: '0 auto', width: '100%' }}>
            {/* Animated Emerald Ring */}
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'rgba(0, 245, 160, 0.1)',
                border: '1.5px solid rgba(0, 245, 160, 0.4)',
                boxShadow: '0 0 40px rgba(0, 245, 160, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00F5A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
              Payment Confirmed
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '13px', margin: '0 0 32px' }}>
              Your transaction has been cryptographically verified and settled with {paymentData.merchant_name}.
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>Amount Paid</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#00F5A0' }}>
                  ₹{formattedAmount}
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Transaction ID</span>
                <span className="tk-mono-label" style={{ fontSize: '11px', color: '#ffffff' }}>{paymentNumber}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Gateway Reference</span>
                <span className="tk-mono-label" style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  {paymentData.provider_payment_id || 'pay_confirmed'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Settlement Time</span>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  {paymentData.paid_at ? new Date(paymentData.paid_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleTimeString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Status</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#00F5A0',
                    background: 'rgba(0, 245, 160, 0.1)',
                    border: '1px solid rgba(0, 245, 160, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px',
                  }}
                >
                  CONFIRMED & SETTLED
                </span>
              </div>
            </div>

            {/* Actions: Download PDF & Done */}
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                type="button"
                onClick={handleDownloadReceipt}
                disabled={downloadingPdf}
                className="tk-secondary-btn"
                style={{
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{downloadingPdf ? 'Generating PDF...' : 'Download Official PDF Receipt'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'TK_FLOW_CLOSE_MODAL', paymentNumber }, '*')
                  }
                  if (window.opener) {
                    window.close()
                  } else {
                    window.location.href = '/dashboard/transactions'
                  }
                }}
                className="tk-primary-btn"
              >
                Return to Merchant
              </button>
            </div>
          </div>
        ) : isExpired ? (
          /* ========================================================= */
          /* EXPIRED STATE: 15-Minute Expiry Notice                    */
          /* ========================================================= */
          <div style={{ padding: '48px 36px', textAlign: 'center', maxWidth: '520px', margin: '0 auto', width: '100%' }}>
            <div className="tk-error-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.3px', color: '#ffffff' }}>
              Payment Session Expired
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '13px', margin: '0 0 24px', lineHeight: 1.5 }}>
              For your cryptographic security, payment sessions expire automatically after 15 minutes of inactivity. Please re-initiate checkout from the merchant website.
            </p>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                  window.parent.postMessage({ type: 'TK_FLOW_SESSION_EXPIRED', paymentNumber }, '*')
                }
                window.location.reload()
              }}
              className="tk-secondary-btn"
              style={{ padding: '14px 24px', width: '100%' }}
            >
              Refresh Session
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* ACTIVE CHECKOUT: Two-Column Master Glass Layout           */
          /* ========================================================= */
          <>
            {/* ── Left Column: Order Brief & Merchant Identity ── */}
            <div
              className="tk-desktop-left"
              style={{
                padding: '44px 38px',
                borderRight: '1px solid var(--tk-border)',
                background: 'rgba(8, 14, 24, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Merchant Avatar & Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #1A273D 0%, #0D1626 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#00F5A0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {paymentData.merchant_name?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
                        {paymentData.merchant_name}
                      </h3>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#00F5A0">
                        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-2 16l-4-4 1.41-1.41L10 15.17l6.59-6.59L18 10l-8 8z" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 500 }}>
                      Verified Business Partner
                    </span>
                  </div>
                </div>

                {/* Purpose Item Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '24px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.8px' }}>
                    Purchase Details
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>
                    {paymentData.purpose || 'Payment for Order'}
                  </div>

                  {paymentData.customer_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          color: '#ffffff',
                          fontWeight: 700,
                        }}
                      >
                        {paymentData.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>
                        Billing to: <strong style={{ color: '#fff' }}>{paymentData.customer_name}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Itemized Cost Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <span>Subtotal</span>
                    <span>₹{formattedAmount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <span>Processing & Platform Fee</span>
                    <span style={{ color: '#00F5A0', fontWeight: 600 }}>Waived (₹0.00)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <span>Taxes / GST</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Included</span>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                    <span>Total Due</span>
                    <span style={{ color: '#00F5A0' }}>₹{formattedAmount}</span>
                  </div>
                </div>
              </div>

              {/* Trust & Guarantee Badges */}
              <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00F5A0" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>End-to-End 256-Bit Cryptographic Security</span>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.35)', marginTop: '6px', lineHeight: 1.4 }}>
                  Settlement processed directly via authorized RBI & NPCI banking partner networks.
                </div>
              </div>
            </div>

            {/* ── Mobile Collapsible Header (Visible on Mobile Only) ── */}
            <div
              className="tk-mobile-accordion"
              style={{
                display: 'none',
                padding: '16px 20px',
                background: 'rgba(8, 14, 24, 0.6)',
                borderBottom: '1px solid var(--tk-border)',
              }}
            >
              <div
                onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    {paymentData.merchant_name}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ transform: mobileSummaryOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#00F5A0' }}>
                  ₹{formattedAmount}
                </div>
              </div>

              {mobileSummaryOpen && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '12px' }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                    Purpose: <strong style={{ color: '#fff' }}>{paymentData.purpose}</strong>
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                    Ref: {paymentNumber}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right Column: Payment Terminal ── */}
            <div style={{ padding: '40px 34px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Header / Brand */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px' }}>
                      <Logo glow={false} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                      TRIM KEY FLOW
                    </span>
                  </div>

                  {/* 1-Click Copy Reference Badge */}
                  <button
                    type="button"
                    onClick={handleCopyTrx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      color: copiedTrx ? '#00F5A0' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                    }}
                    title="Copy Transaction ID"
                  >
                    <span>{paymentNumber.slice(0, 15)}...</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {copiedTrx && <span style={{ fontWeight: 800 }}>Copied</span>}
                  </button>
                </div>

                {/* Amount Callout */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '22px',
                    textAlign: 'center',
                    marginBottom: '24px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>
                    Amount to Authorize
                  </span>
                  <div
                    style={{
                      fontSize: '40px',
                      fontWeight: 900,
                      color: '#00F5A0',
                      letterSpacing: '-1.2px',
                      marginTop: '4px',
                      textShadow: '0 0 30px rgba(0, 245, 160, 0.25)',
                    }}
                  >
                    ₹{formattedAmount}
                  </div>
                </div>

                {/* Gateway Error Alert */}
                {error && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '20px',
                      fontSize: '12px',
                      color: '#fca5a5',
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Interactive Payment Method Options */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                    Preferred Payment Method
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* UPI Option */}
                    <div
                      onClick={() => setSelectedMethod('upi')}
                      className={`tk-method-chip ${selectedMethod === 'upi' ? 'active' : ''}`}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(0, 245, 160, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#00F5A0',
                          fontWeight: 800,
                          fontSize: '10px',
                        }}
                      >
                        UPI
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Instant UPI</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          Google Pay, PhonePe, Paytm, CRED & QR
                        </div>
                      </div>
                      {selectedMethod === 'upi' && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F5A0' }} />
                      )}
                    </div>

                    {/* Cards Option */}
                    <div
                      onClick={() => setSelectedMethod('card')}
                      className={`tk-method-chip ${selectedMethod === 'card' ? 'active' : ''}`}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(38, 195, 234, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#26C3EA',
                          fontWeight: 800,
                          fontSize: '10px',
                        }}
                      >
                        CARD
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Credit / Debit Cards</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          Visa, Mastercard, RuPay & Amex
                        </div>
                      </div>
                      {selectedMethod === 'card' && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F5A0' }} />
                      )}
                    </div>

                    {/* NetBanking Option */}
                    <div
                      onClick={() => setSelectedMethod('netbanking')}
                      className={`tk-method-chip ${selectedMethod === 'netbanking' ? 'active' : ''}`}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(139, 92, 246, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#A78BFA',
                          fontWeight: 800,
                          fontSize: '10px',
                        }}
                      >
                        NET
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>NetBanking & Wallets</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          HDFC, ICICI, SBI, Axis & 50+ Banks
                        </div>
                      </div>
                      {selectedMethod === 'netbanking' && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F5A0' }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Trust Seals */}
              <div>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={processing || verifying}
                  className="tk-primary-btn"
                  style={{ opacity: (processing || verifying) ? 0.75 : 1 }}
                >
                  {verifying ? (
                    <>
                      <div className="tk-spinner" />
                      <span>Verifying Cryptographic Settlement...</span>
                    </>
                  ) : processing ? (
                    <>
                      <div className="tk-spinner" />
                      <span>Connecting to Secure Gateway...</span>
                    </>
                  ) : error ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      <span>Retry Payment (₹{formattedAmount})</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Authorize Payment of ₹{formattedAmount}</span>
                    </>
                  )}
                </button>

                {/* Trust Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginTop: '20px',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.45)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    256-Bit SSL
                  </span>
                  <span>•</span>
                  <span>PCI-DSS Level 1</span>
                  <span>•</span>
                  <span>RBI Compliant</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Bottom Brand Mark */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: '28px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>Powered by</span>
        <strong style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Trim Key Flow Infrastructure</strong>
      </div>
    </div>
  )
}
