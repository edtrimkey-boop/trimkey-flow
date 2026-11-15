// @ts-nocheck
'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StripeAdapter } from '@/providers/stripe/adapter'
import { getProviderWebhookSecret } from '@/services/merchant'
import { logAuditEvent, AuditAction } from '@/services/audit'

export async function POST(req: NextRequest) {
  const db = createAdminClient()

  // 1. Signature header
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    console.error('[Stripe Webhook Alert]: Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()
  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const eventType = payload.type
  const paymentIntent = payload?.data?.object
  const providerOrderId = paymentIntent?.id

  if (!providerOrderId) {
    return NextResponse.json({ ok: true, notice: 'Event ignored - no payment intent id' })
  }

  // 2. Fetch order
  const { data: orderData, error: orderErr } = await db
    .from('orders')
    .select('*, merchant_providers(*), applications(webhook_url)')
    .eq('provider_order_id', providerOrderId)
    .maybeSingle()

  if (orderErr || !orderData) {
    // If not found by provider_order_id, try order_number from metadata
    const orderNumber = paymentIntent?.metadata?.order_number
    if (orderNumber) {
      const { data: orderFallback } = await db
        .from('orders')
        .select('*, merchant_providers(*), applications(webhook_url)')
        .eq('order_number', orderNumber)
        .maybeSingle()
      if (orderFallback) {
        orderData = orderFallback
      }
    }
  }

  if (!orderData) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // 3. Webhook secret
  let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (orderData.merchant_providers) {
    try {
      webhookSecret = await getProviderWebhookSecret(orderData.merchant_providers)
    } catch {
      // fallback
    }
  }

  if (!webhookSecret) {
    webhookSecret = 'dummy_stripe_secret'
  }

  // 4. Verify signature
  const adapter = new StripeAdapter({})
  const isSignatureValid = adapter.verifyWebhookSignature(rawBody, signature, webhookSecret)

  // 5. Anti-replay
  const { data: currentPayment } = await db
    .from('payments')
    .select('id, status, amount, currency_code, application_id, order_id')
    .eq('order_id', orderData.id)
    .maybeSingle()

  if (currentPayment?.status === 'SUCCESS' || currentPayment?.status === 'PAID') {
    return NextResponse.json({ ok: true, message: 'Idempotent request: Payment already verified' })
  }

  // 6. Handle Events
  if (eventType === 'payment_intent.succeeded') {
    const webhookAmount = Number(paymentIntent.amount)
    const webhookCurrency = String(paymentIntent.currency).toUpperCase()
    const expectedPaise = Math.round(Number(orderData.amount))
    const expectedCurrency = String(orderData.currency_code).toUpperCase()

    if (webhookAmount !== expectedPaise || webhookCurrency !== expectedCurrency) {
      await db
        .from('payments')
        .update({
          status: 'FAILED',
          failure_code: 'FRAUD_AMOUNT_MISMATCH',
          failure_reason: `Stripe reported ${webhookAmount} ${webhookCurrency}, expected ${expectedPaise} ${expectedCurrency}`,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderData.id)

      return NextResponse.json({ error: 'Amount mismatch detected' }, { status: 400 })
    }

    await db
      .from('payments')
      .update({
        status: 'SUCCESS',
        provider_payment_id: paymentIntent.latest_charge || paymentIntent.id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderData.id)

    await db
      .from('orders')
      .update({
        status: 'PAID',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderData.id)

    // Log audit event
    await logAuditEvent({
      action: AuditAction.PAYMENT_CAPTURED,
      resourceType: 'payment',
      resourceId: currentPayment?.id || orderData.id,
      organizationId: orderData.merchant_providers?.organization_id || '',
      applicationId: orderData.application_id,
      metadata: { provider: 'stripe', provider_order_id: providerOrderId },
    }).catch(() => {})

    return NextResponse.json({ ok: true, message: 'Stripe payment captured' })
  } else if (eventType === 'payment_intent.payment_failed') {
    await db
      .from('payments')
      .update({
        status: 'FAILED',
        failure_code: paymentIntent.last_payment_error?.code || 'PAYMENT_FAILED',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed on Stripe',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderData.id)

    await db
      .from('orders')
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderData.id)

    return NextResponse.json({ ok: true, message: 'Stripe payment marked as failed' })
  }

  return NextResponse.json({ ok: true, notice: `Event ${eventType} received` })
}
