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
    
    // If it's a Stripe order, show a mock Stripe checkout alert
    if (paymentData.provider_order_id?.startsWith('pi_stripe_')) {
      alert('🔒 Stripe Secure Checkout Initialized!\n\nOrder ID: ' + paymentData.provider_order_id + '\n\nIn a production environment, this would open Stripe Elements.')
      return
    }

    // Otherwise, assume it's a Razorpay order
    const options = {
      key: paymentData.key_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: paymentData.merchant_name,
      description: `Payment for Order ${paymentNumber}`,
      order_id: paymentData.provider_order_id,
      handler: function (response: any) {
        alert(`Payment Successful! Razorpay Payment ID: ${response.razorpay_payment_id}`)
        // Here you would redirect back to the merchant's success URL
      },
      prefill: {
        name: 'John Doe',
        email: 'john@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#26C3EA'
      }
    }

    const rzp1 = new (window as any).Razorpay(options)
    rzp1.open()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B111E' }}>
         <div style={{ color: 'var(--brand)', fontWeight: 800 }}>Loading Secure Checkout...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B111E' }}>
         <div style={{ color: 'var(--danger)', fontWeight: 800 }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B111E', padding: '20px' }}>
       {/* Inject Razorpay Script */}
       <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>

       <div className="panel" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px' }}><Logo glow={true} /></div>
          </div>
          
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '5px' }}>{paymentData.merchant_name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, marginBottom: '30px' }}>Secure Payment powered by Trim Key Flow</p>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
             <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Amount to Pay</p>
             <h1 style={{ fontSize: '36px', color: 'var(--brand)', fontWeight: 900, margin: '10px 0' }}>
               ₹{(paymentData.amount / 100).toFixed(2)}
             </h1>
             <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>Ref: {paymentNumber}</p>
          </div>

          <button onClick={handlePay} style={{ width: '100%', padding: '16px', fontSize: '14px', background: 'linear-gradient(135deg, var(--brand), #1A9CBF)', color: 'black', boxShadow: '0 10px 25px rgba(38,195,234,0.4)' }}>
             Proceed to Secure Payment
          </button>

          <div style={{ marginTop: '20px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
             <span style={{ marginRight: '6px' }}>🔒</span> 256-bit SSL Encryption
          </div>
       </div>
    </div>
  )
}
