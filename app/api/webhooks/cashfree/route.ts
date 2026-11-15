// @ts-nocheck
'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CashfreeAdapter } from '@/providers/cashfree/adapter'
import { getProviderWebhookSecret } from '@/services/merchant'
import { logAuditEvent, AuditAction } from '@/services/audit'

export async function POST(req: NextRequest) {
  const db = createAdminClient()

  const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-cashfree-signature')
  const rawBody = await req.text()

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const eventType = payload.type || payload.event
  const orderDetails = payload.data?.order || payload.order
  const paymentDetails = payload.data?.payment || payload.payment
  const orderId = orderDetails?.order_id

  if (!orderId) {
    return NextResponse.json({ ok: true, notice: 'Event ignored - no order_id' })
  }

  // Fetch order
  const { data: orderData, error: orderErr } = await db
    .from('orders')
    .select('*, merchant_providers(*), applications(webhook_url)')
    .or(`provider_order_id.eq.${orderId},order_number.eq.${orderId}`)
    .maybeSingle()

  if (orderErr || !orderData) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Webhook secret
  let webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET
  if (orderData.merchant_providers) {
    try {
      webhookSecret = await getProviderWebhookSecret(orderData.merchant_providers)
    } catch {
      // fallback
    }
  }

  if (signature && webhookSecret) {
    const adapter = new CashfreeAdapter({})
    const isValid = adapter.verifyWebhookSignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      console.warn('[Cashfree Webhook]: Signature mismatch for order', orderId)
    }
  }

  // Anti-replay
  const { data: currentPayment } = await db
    .from('payments')
    .select('id, status, amount, currency_code, application_id, order_id')
    .eq('order_id', orderData.id)
    .maybeSingle()

  if (currentPayment?.status === 'SUCCESS' || currentPayment?.status === 'PAID') {
    return NextResponse.json({ ok: true, message: 'Idempotent request: Payment already verified' })
  }

  const isSuccessEvent = 
    eventType === 'PAYMENT_SUCCESS_WEBHOOK' || 
    paymentDetails?.payment_status === 'SUCCESS' || 
    orderDetails?.order_status === 'PAID'

  if (isSuccessEvent) {
    const cfPaymentId = paymentDetails?.cf_payment_id || `cf_pay_${Date.now()}`

    await db
      .from('payments')
      .update({
        status: 'SUCCESS',
        provider_payment_id: String(cfPaymentId),
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

    await logAuditEvent({
      action: AuditAction.PAYMENT_CAPTURED,
      resourceType: 'payment',
      resourceId: currentPayment?.id || orderData.id,
      organizationId: orderData.merchant_providers?.organization_id || '',
      applicationId: orderData.application_id,
      metadata: { provider: 'cashfree', order_id: orderId },
    }).catch(() => {})

    return NextResponse.json({ ok: true, message: 'Cashfree payment captured' })
  } else if (eventType === 'PAYMENT_FAILED_WEBHOOK' || paymentDetails?.payment_status === 'FAILED') {
    await db
      .from('payments')
      .update({
        status: 'FAILED',
        failure_code: paymentDetails?.payment_completion_status || 'PAYMENT_FAILED',
        failure_reason: paymentDetails?.payment_message || 'Cashfree payment failed',
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

    return NextResponse.json({ ok: true, message: 'Cashfree payment marked as failed' })
  }

  return NextResponse.json({ ok: true, notice: `Cashfree event ${eventType} acknowledged` })
}
