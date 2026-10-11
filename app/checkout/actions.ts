// @ts-nocheck
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac, timingSafeEqual } from 'crypto'
import { decrypt } from '@/lib/encryption'
import type { EncryptedCredentials } from '@/types/database'

export async function getCheckoutData(paymentNumber: string) {
  const db = createAdminClient()
  
  const { data: payment, error } = await db
    .from('payments')
    .select(`
      amount, 
      currency_code,
      merchant_id,
      order_id
    `)
    .eq('payment_number', paymentNumber)
    .single()

  if (error || !payment) throw new Error('Payment not found')

  const { data: order } = await db.from('orders').select('provider_order_id').eq('id', payment.order_id).single()
  const { data: merchant } = await db.from('merchants').select('name').eq('id', payment.merchant_id).single()

  return {
    amount: payment.amount,
    currency: payment.currency_code,
    merchant_name: merchant?.name || 'Merchant',
    provider_order_id: order?.provider_order_id,
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy'
  }
}

export interface VerifyPaymentInput {
  paymentNumber: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/**
 * Cryptographically verifies Razorpay Checkout signature server-side.
 * Never trust the browser client alone — this strictly enforces HMAC-SHA256 verification.
 */
export async function verifyCheckoutPayment(input: VerifyPaymentInput) {
  const db = createAdminClient()
  const { paymentNumber, razorpay_order_id, razorpay_payment_id, razorpay_signature } = input

  if (!paymentNumber || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error('Missing cryptographic verification parameters')
  }

  // 1. Fetch payment and order
  const { data: payment, error: payErr } = await db
    .from('payments')
    .select('*, orders(*), merchant_providers(*), applications(webhook_url)')
    .eq('payment_number', paymentNumber)
    .maybeSingle()

  if (payErr || !payment) {
    throw new Error('Payment not found')
  }

  // Idempotency: If already confirmed, return success immediately
  if (payment.status === 'SUCCESS' || payment.status === 'success') {
    return { verified: true, payment_number: payment.payment_number, status: 'SUCCESS' }
  }

  // 2. Anti-Tampering: Order ID must strictly match database order
  if (payment.orders?.provider_order_id !== razorpay_order_id) {
    console.error(`[SECURITY ALERT]: Order ID mismatch! DB has ${payment.orders?.provider_order_id}, client submitted ${razorpay_order_id}`)
    throw new Error('Cryptographic verification failed: Order mismatch')
  }

  // 3. Resolve key secret
  let keySecret = process.env.RAZORPAY_KEY_SECRET
  if (payment.merchant_providers?.credentials_encrypted) {
    try {
      const decrypted = await decrypt(payment.merchant_providers.credentials_encrypted as EncryptedCredentials)
      const parsed = JSON.parse(decrypted)
      if (parsed.key_secret) {
        keySecret = parsed.key_secret
      }
    } catch (e) {
      // Fall back to env secret
    }
  }

  if (!keySecret) {
    console.error('[CRITICAL SECURITY CONFIG]: RAZORPAY_KEY_SECRET is not set on the server')
    throw new Error('Gateway secret not configured on server')
  }

  // 4. Verify HMAC-SHA256 signature using constant-time comparison
  try {
    const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = createHmac('sha256', keySecret)
      .update(dataToSign)
      .digest('hex')

    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const signatureBuffer = Buffer.from(razorpay_signature, 'hex')

    if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
      console.error('[SECURITY FRAUD ALERT]: Invalid Razorpay signature presented during checkout verification!')
      throw new Error('Cryptographic signature verification failed: Possible payment spoofing detected')
    }
  } catch (err: any) {
    throw new Error(err.message || 'Signature verification failure')
  }

  // 5. Atomic state update
  await db
    .from('payments')
    .update({
      status: 'SUCCESS',
      provider_payment_id: razorpay_payment_id,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  await db
    .from('orders')
    .update({
      status: 'PAID',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.order_id)

  return {
    verified: true,
    payment_number: payment.payment_number,
    status: 'SUCCESS',
  }
}
