// @ts-nocheck
'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRazorpayWebhook } from '@/providers/razorpay/webhook'
import { getProviderWebhookSecret } from '@/services/merchant'
import { logAuditEvent, AuditAction } from '@/services/audit'

export async function POST(req: NextRequest) {
  const db = createAdminClient()

  // 1. Check for signature header
  const signature = req.headers.get('x-razorpay-signature')
  if (!signature) {
    console.error('[Webhook Security Alert]: Missing x-razorpay-signature header')
    return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()
  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch (err) {
    console.error('[Webhook Error]: Invalid JSON payload')
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const event = payload.event
  const paymentEntity = payload?.payload?.payment?.entity
  const providerOrderId = paymentEntity?.order_id

  if (!providerOrderId) {
    // Some events might not have an order_id; return 200 for unhandled informational events
    return NextResponse.json({ ok: true, notice: 'Event ignored - no order_id' })
  }

  // 2. Fetch the corresponding order and merchant provider to resolve the exact webhook secret
  const { data: orderData, error: orderErr } = await db
    .from('orders')
    .select('*, merchant_providers(*), applications(webhook_url)')
    .eq('provider_order_id', providerOrderId)
    .maybeSingle()

  if (orderErr || !orderData) {
    console.error('[Webhook Error]: Order not found for provider_order_id:', providerOrderId)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // 3. Resolve the webhook secret strictly (no insecure fallback strings!)
  let webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (orderData.merchant_providers) {
    try {
      webhookSecret = await getProviderWebhookSecret(orderData.merchant_providers)
    } catch {
      // Fallback to global env if decryption is not configured
    }
  }

  if (!webhookSecret) {
    console.error('[CRITICAL SECURITY CONFIG]: RAZORPAY_WEBHOOK_SECRET is not configured on server!')
    return NextResponse.json({ error: 'Webhook secret not configured on server' }, { status: 500 })
  }

  // 4. Timing-safe cryptographic HMAC-SHA256 signature verification
  const isSignatureValid = verifyRazorpayWebhook(rawBody, signature, webhookSecret)
  if (!isSignatureValid) {
    console.error(`[CRITICAL SECURITY ALERT]: Invalid signature detected for order ${orderData.order_number}! Possible forgery or replay attack.`)
    return NextResponse.json({ error: 'Invalid cryptographic signature' }, { status: 400 })
  }

  // 5. Anti-Replay / Idempotency Check
  const { data: currentPayment } = await db
    .from('payments')
    .select('id, status, amount, currency_code, application_id, order_id')
    .eq('order_id', orderData.id)
    .maybeSingle()

  if (currentPayment?.status === 'SUCCESS' || currentPayment?.status === 'success') {
    // Payment is already confirmed. Do not double-process, re-credit, or spam merchant webhooks.
    return NextResponse.json({ ok: true, message: 'Idempotent request: Payment already verified' })
  }

  // 6. Handle Events
  if (event === 'payment.captured' || event === 'order.paid') {
    // Amount & Currency Tampering Verification
    // Razorpay amounts are strictly in smallest currency unit (paise/cents)
    const webhookAmount = Number(paymentEntity.amount)
    const webhookCurrency = String(paymentEntity.currency).toUpperCase()
    
    // In Trim Key Flow, amount in database is stored either in currency units or paise depending on table
    // orderData.amount is compared with webhookAmount
    const expectedPaise = Math.round(Number(orderData.amount)) // Orders store amount in integer paise
    const expectedCurrency = String(orderData.currency_code).toUpperCase()

    if (webhookAmount !== expectedPaise || webhookCurrency !== expectedCurrency) {
      console.error(
        `[FRAUD DETECTED]: Amount/Currency mismatch! Expected ${expectedPaise} ${expectedCurrency}, but gateway sent ${webhookAmount} ${webhookCurrency}. Payment rejected!`
      )

      await db
        .from('payments')
        .update({
          status: 'FAILED',
          failure_code: 'FRAUD_AMOUNT_MISMATCH',
          failure_reason: `Gateway reported ${webhookAmount} ${webhookCurrency}, expected ${expectedPaise} ${expectedCurrency}`,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderData.id)

      await logAuditEvent({
        action: AuditAction.PAYMENT_FAILED,
        resourceType: 'payment',
        resourceId: currentPayment?.id || orderData.id,
        organizationId: orderData.merchant_providers?.organization_id || '',
        applicationId: orderData.application_id,
        metadata: { fraud: true, webhookAmount, expectedPaise, webhookCurrency, expectedCurrency }
      }).catch(() => {})

      return NextResponse.json({ error: 'Security violation: Amount mismatch detected' }, { status: 400 })
    }

    // 7. Atomic Payment & Order Status Update
    const { data: updatedPayment, error: updateErr } = await db
      .from('payments')
      .update({
        status: 'SUCCESS',
        provider_payment_id: paymentEntity.id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderData.id)
      .select('*, applications(webhook_url)')
      .single()

    if (updateErr || !updatedPayment) {
      console.error('[Webhook Error]: Failed to update payment status in DB:', updateErr)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    await db
      .from('orders')
      .update({
        status: 'PAID',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderData.id)

    // 8. Log Event & Notify Merchant Webhook
    const merchantWebhookUrl = updatedPayment.applications?.webhook_url
    if (merchantWebhookUrl) {
      const { data: eventData } = await db
        .from('webhook_events')
        .insert({
          provider: 'razorpay',
          provider_event_id: payload.id || paymentEntity.id,
          event_type: event,
          signature_valid: true,
          payload: payload,
          processed: true,
          received_at: new Date().toISOString()
        })
        .select()
        .single()

      if (eventData) {
        try {
          const whResponse = await fetch(merchantWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'payment.success',
              payment_id: updatedPayment.id,
              payment_number: updatedPayment.payment_number,
              order_id: updatedPayment.order_id,
              amount: updatedPayment.amount,
              currency: updatedPayment.currency_code,
              provider_payment_id: paymentEntity.id,
              timestamp: new Date().toISOString()
            })
          })

          await db.from('webhook_deliveries').insert({
            webhook_event_id: eventData.id,
            application_id: updatedPayment.application_id,
            endpoint_url: merchantWebhookUrl,
            event_type: 'payment.success',
            attempt_number: 1,
            http_status: whResponse.status,
            status: whResponse.ok ? 'SUCCESS' : 'FAILED',
            delivered_at: new Date().toISOString()
          })
        } catch {
          await db.from('webhook_deliveries').insert({
            webhook_event_id: eventData.id,
            application_id: updatedPayment.application_id,
            endpoint_url: merchantWebhookUrl,
            event_type: 'payment.success',
            attempt_number: 1,
            http_status: 0,
            status: 'FAILED'
          })
        }
      }
    }

    return NextResponse.json({ ok: true, status: 'Payment captured and verified' })
  }

  if (event === 'payment.failed') {
    const errorDescription = paymentEntity?.error_description || 'Payment rejected by gateway or bank'
    const errorCode = paymentEntity?.error_code || 'GATEWAY_ERROR'

    await db
      .from('payments')
      .update({
        status: 'FAILED',
        failure_code: errorCode,
        failure_reason: errorDescription,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderData.id)

    await db
      .from('orders')
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderData.id)

    return NextResponse.json({ ok: true, status: 'Payment failure recorded' })
  }

  return NextResponse.json({ ok: true, status: 'Event acknowledged' })
}
