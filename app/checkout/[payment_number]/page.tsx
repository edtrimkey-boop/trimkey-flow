'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Logo } from '@/components/ui/logo'

export default function CheckoutPage() {
  const params = useParams()
  const paymentNumber = params.payment_number as string

  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    import('../actions').then(m => m.getCheckoutData(paymentNumber))
      .then(data => {
        setPaymentData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [paymentNumber])

  function handlePay() {
    if (!paymentData) return
    setProcessing(true)
    
    // Simulate payment process delay
    setTimeout(() => {
        if (paymentData.provider_order_id?.startsWith('pi_stripe_')) {
          console.log('Stripe Secure Checkout Initialized!\n\nOrder ID: ' + paymentData.provider_order_id + '\n\nIn a production environment, this would open Stripe Elements.')
          triggerSuccess()
          return
        }
    
        // Otherwise, assume it's a Razorpay order
        const options = {
          key: paymentData.key_id,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          name: paymentData.merchant_name,
          description: `Payment for Order ${paymentNumber}`,
          order_id: paymentData.provider_order_id,
          handler: function (response: any) {
            console.log(`Payment Successful! Razorpay Payment ID: ${response.razorpay_payment_id}`)
            triggerSuccess()
          },
          prefill: {
            name: 'Demo Customer',
            email: 'demo@example.com',
            contact: '9999999999'
          },
          theme: {
            color: '#00fba6'
          }
        }
    
        const rzp1 = new (window as any).Razorpay(options)
        rzp1.open()
        
        // Mock success if Razorpay isn't fully set up with a real key
        if (paymentData.key_id === 'dummy') {
            setTimeout(() => {
                console.log("Mocking Razorpay success for dummy key...");
                triggerSuccess();
            }, 2000);
        }
    }, 800)
  }
  
  function triggerSuccess() {
      // Play audio and show tick
      if (typeof window !== 'undefined' && (window as any).tkPlaySound) {
          (window as any).tkPlaySound('notification')
      }
      setSuccess(true)
      
      // Simulate redirect back to merchant
      setTimeout(() => {
          // In real life, redirect to merchant success url
          // window.location.href = paymentData.success_url
      }, 3000)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a1911' }}>
         <div className="animate-pulse" style={{ width: '80px', height: '80px', marginBottom: '20px' }}>
            <Logo glow={true} />
         </div>
         <div style={{ color: 'var(--brand)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px' }}>Initializing Secure Session</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1911', padding: '20px' }}>
         <div className="panel" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px' }}>
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" style={{ margin: '0 auto 20px' }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
             <h3 style={{ color: 'white', marginBottom: '10px' }}>Payment Failed</h3>
             <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{error}</div>
         </div>
      </div>
    )
  }


  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1911', padding: '20px' }}>
       {/* Inject Razorpay Script */}
       <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>

       <div className="panel" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px 30px', position: 'relative', overflow: 'hidden' }}>
          
          {success ? (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <svg className="anim-check" width="80" height="80" viewBox="0 0 52 52" style={{ marginBottom: '20px' }}>
                    <circle className="anim-circle" cx="26" cy="26" r="25" fill="none" stroke="var(--brand)" strokeWidth="3" />
                    <path className="anim-check-path" fill="none" stroke="var(--brand)" strokeWidth="3" d="M14 27l7 7 16-16" />
                  </svg>
                  <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900, marginBottom: '10px' }}>Payment Successful</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Redirecting you back to merchant...</p>
              </div>
          ) : (
              <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                      <div style={{ width: '60px', height: '60px' }}><Logo glow={true} /></div>
                  </div>
                  
                  <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '5px' }}>{paymentData.merchant_name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, marginBottom: '30px' }}>Secure Checkout Session</p>
                  
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0, 251, 166, 0.1)', marginBottom: '30px' }}>
                     <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</p>
                     <h1 style={{ fontSize: '38px', color: 'var(--brand)', fontWeight: 900, margin: '10px 0', letterSpacing: '-1px' }}>
                       {paymentData.currency === 'INR' ? '?' : '$'}{(parseFloat(paymentData.amount) / 100).toFixed(2)}
                     </h1>
                     <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>TRX: {paymentNumber}</p>
                  </div>
        
                  <button onClick={handlePay} disabled={processing} className="liquid-glass" style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: 800, opacity: processing ? 0.7 : 1 }}>
                     {processing ? 'Processing Securely...' : 'Pay with Trim Key'}
                  </button>
        
                  <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                     256-BIT SSL ENCRYPTION
                  </div>
              </>
         )}
       </div>
    </div>
  )
}

