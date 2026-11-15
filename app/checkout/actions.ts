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
      id,
      amount, 
      currency_code,
      merchant_id,
      order_id,
      status,
      paid_at,
      provider_payment_id,
      created_at
    `)
    .eq('payment_number', paymentNumber)
    .single()

  if (error || !payment) throw new Error('Payment not found')

  const { data: order } = await db
    .from('orders')
    .select('id, provider_order_id, purpose, customer_name, created_at')
    .eq('id', payment.order_id)
    .single()
  const { data: merchant } = await db.from('merchants').select('name').eq('id', payment.merchant_id).single()

  // ⏱️ 15-Minute Expiry Engine (Matches Razorpay / Bank Expiration standard)
  const createdAtMs = payment.created_at ? new Date(payment.created_at).getTime() : Date.now()
  const expiryWindowMs = 15 * 60 * 1000 // 15 mins
  const expiresAtMs = createdAtMs + expiryWindowMs
  const nowMs = Date.now()
  let currentStatus = payment.status

  if (nowMs > expiresAtMs && currentStatus !== 'SUCCESS' && currentStatus !== 'success') {
    currentStatus = 'EXPIRED'
    await db.from('payments').update({
      status: 'EXPIRED',
      failure_code: 'SESSION_EXPIRED',
      failure_reason: 'Payment link expired after 15 minutes of inactivity',
      updated_at: new Date().toISOString()
    }).eq('id', payment.id)

    if (payment.order_id) {
      await db.from('orders').update({
        status: 'EXPIRED',
        updated_at: new Date().toISOString()
      }).eq('id', payment.order_id)
    }
  }

  let keyId = process.env.RAZORPAY_KEY_ID || 'dummy'
  let keySecret = process.env.RAZORPAY_KEY_SECRET || ''
  const { data: providerRec } = await db
    .from('merchant_providers')
    .select('credentials_encrypted')
    .eq('merchant_id', payment.merchant_id)
    .eq('is_active', true)
    .maybeSingle()

  if (providerRec?.credentials_encrypted) {
    try {
      const decrypted = await decrypt(providerRec.credentials_encrypted as EncryptedCredentials)
      const parsed = JSON.parse(decrypted)
      if (parsed.key_id) keyId = parsed.key_id
      if (parsed.key_secret) keySecret = parsed.key_secret
    } catch {
      // fallback to process.env.RAZORPAY_KEY_ID
    }
  }

  // ⚡ Active Reconciliation: If client reloaded, session restored, or connection dropped,
  // check directly with gateway to see if the order was already captured.
  let reconciledPaymentId = payment.provider_payment_id
  let reconciledPaidAt = payment.paid_at

  if (currentStatus !== 'SUCCESS' && currentStatus !== 'success' && currentStatus !== 'EXPIRED' && order?.provider_order_id && keyId && keySecret) {
    try {
      const Razorpay = (await import('razorpay')).default || (await import('razorpay'))
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
      const paymentsList = await rzp.orders.fetchPayments(order.provider_order_id)
      const capturedPayment = paymentsList?.items?.find((p: any) => p.status === 'captured')
      if (capturedPayment) {
        console.log(`[Auto-Reconciliation]: Order ${order.provider_order_id} was paid via gateway payment ${capturedPayment.id}! Updating status.`)
        currentStatus = 'SUCCESS'
        reconciledPaymentId = capturedPayment.id
        reconciledPaidAt = new Date().toISOString()

        await db.from('payments').update({
          status: 'SUCCESS',
          provider_payment_id: capturedPayment.id,
          paid_at: reconciledPaidAt,
          updated_at: new Date().toISOString(),
        }).eq('id', payment.id)

        if (payment.order_id) {
          await db.from('orders').update({
            status: 'PAID',
            updated_at: new Date().toISOString(),
          }).eq('id', payment.order_id)
        }

        // Webhook dispatch to application endpoint
        const { data: fullPayment } = await db
          .from('payments')
          .select('*, applications(webhook_url), orders(metadata)')
          .eq('id', payment.id)
          .maybeSingle()

        const appWebhookUrl = fullPayment?.applications?.webhook_url || fullPayment?.orders?.metadata?.webhook_url || 'https://backend-ed.trimkey.in/api/gateway'
        if (appWebhookUrl) {
          fetch(appWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Trim-Key-Flow-Event': 'payment.success',
            },
            body: JSON.stringify({
              event: 'payment.success',
              id: payment.id,
              payment_number: payment.payment_number,
              amount: payment.amount,
              currency: payment.currency_code,
              provider_payment_id: capturedPayment.id,
              provider_order_id: order.provider_order_id,
              gateway_payment_id: capturedPayment.id,
              gateway_order_id: order.provider_order_id,
              metadata: {
                ...(fullPayment?.orders?.metadata || {}),
                provider_payment_id: capturedPayment.id,
                provider_order_id: order.provider_order_id
              },
              timestamp: new Date().toISOString(),
            }),
            signal: AbortSignal.timeout(5000),
          }).catch(err => console.warn('[Auto-Reconciliation Webhook Notice]:', err?.message))
        }
      }
    } catch (checkErr: any) {
      // Non-blocking check
    }
  }

  return {
    amount: payment.amount,
    currency: payment.currency_code,
    merchant_name: merchant?.name || 'Merchant',
    provider_order_id: order?.provider_order_id,
    purpose: order?.purpose || 'Order Checkout',
    customer_name: order?.customer_name,
    status: currentStatus,
    paid_at: reconciledPaidAt,
    provider_payment_id: reconciledPaymentId,
    key_id: keyId,
    expires_at: new Date(expiresAtMs).toISOString(),
    remaining_seconds: Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000))
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

  // ⏱️ Verify order is not expired (15-minute validity window)
  const createdAtMs = payment.created_at ? new Date(payment.created_at).getTime() : Date.now()
  if (Date.now() > createdAtMs + 15 * 60 * 1000) {
    await db.from('payments').update({
      status: 'EXPIRED',
      failure_code: 'SESSION_EXPIRED',
      failure_reason: 'Payment link expired after 15 minutes of inactivity',
      updated_at: new Date().toISOString()
    }).eq('id', payment.id)

    if (payment.order_id) {
      await db.from('orders').update({
        status: 'EXPIRED',
        updated_at: new Date().toISOString()
      }).eq('id', payment.order_id)
    }
    throw new Error('This payment link has expired (15-minute timeout). Please initiate a fresh transaction.')
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

  // 6. Non-blocking Webhook dispatch to application endpoint
  const appWebhookUrl = payment.applications?.webhook_url || payment.orders?.metadata?.webhook_url || 'https://backend-ed.trimkey.in/api/gateway';
  if (appWebhookUrl) {
    fetch(appWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trim-Key-Flow-Event': 'payment.success',
      },
      body: JSON.stringify({
        event: 'payment.success',
        id: payment.id,
        payment_number: payment.payment_number,
        amount: payment.amount,
        currency: payment.currency_code,
        provider_payment_id: razorpay_payment_id,
        provider_order_id: razorpay_order_id,
        gateway_payment_id: razorpay_payment_id,
        gateway_order_id: razorpay_order_id,
        metadata: {
          ...(payment.orders?.metadata || {}),
          provider_payment_id: razorpay_payment_id,
          provider_order_id: razorpay_order_id
        },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5000),
    }).catch((err) => console.error('[Webhook Dispatch Notice]:', err?.message))
  }

  return {
    verified: true,
    payment_number: payment.payment_number,
    provider_payment_id: razorpay_payment_id,
    provider_order_id: razorpay_order_id,
    status: 'SUCCESS',
  }
}

export interface RecordFailureInput {
  paymentNumber: string
  code?: string
  reason?: string
  paymentId?: string
}

export async function recordPaymentFailureAction(input: RecordFailureInput) {
  const db = createAdminClient()
  const { paymentNumber, code, reason, paymentId } = input

  const { data: payment } = await db
    .from('payments')
    .select('id, status')
    .eq('payment_number', paymentNumber)
    .maybeSingle()

  if (!payment) return { success: false }

  // If already confirmed success, do not overwrite
  if (payment.status === 'SUCCESS' || payment.status === 'success') {
    return { success: true }
  }

  await db
    .from('payments')
    .update({
      status: 'FAILED',
      failure_code: code || 'GATEWAY_ERROR',
      failure_reason: reason || 'Payment was not completed by the user or was rejected by the gateway.',
      provider_payment_id: paymentId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  return { success: true }
}
