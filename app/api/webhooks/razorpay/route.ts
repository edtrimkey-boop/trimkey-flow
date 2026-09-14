// ============================================================
// Trim Key Flow — Razorpay Webhook Handler
// POST /api/webhooks/razorpay
//
// NOT part of the public API — provider-specific endpoint.
// Processes: payment.captured, payment.failed, refund.processed
//
// CRITICAL: Raw body MUST be read BEFORE JSON.parse
//           Signature verification uses the raw body.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerEnv } from '@/config/env'
import { verifyRazorpayWebhook } from '@/providers/razorpay/webhook'
import { findOrderByProviderOrderId, updateOrderStatus } from '@/services/order'
import { updatePaymentStatus, getPaymentByProviderPaymentId } from '@/services/payment'
import { updateRefundStatus } from '@/services/refund'
import { deliverWebhook } from '@/services/webhook'
import { logAuditEvent, AuditAction } from '@/services/audit'
import type { WebhookEventInsert, Application, Payment, Order, Refund } from '@/types/database'
import type { WebhookPayload } from '@/services/webhook'

export async function POST(request: NextRequest) {
  const env = getServerEnv()

  // ── Step 1: Read raw body BEFORE any JSON parse ───────────
  const rawBody = await request.text()

  // ── Step 2: Get signature ─────────────────────────────────
  const signature = request.headers.get('x-razorpay-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // ── Step 3: Verify signature ──────────────────────────────
  const signatureValid = verifyRazorpayWebhook(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)

  // Parse JSON only after signature check attempt
  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const providerEventId = (event.id as string) ?? null
  const eventType = (event.event as string) ?? 'unknown'

  if (!providerEventId) {
    return NextResponse.json({ error: 'Missing event ID' }, { status: 400 })
  }

  const db = createAdminClient()

  // ── Step 4: Duplicate check ───────────────────────────────
  const { data: existing } = await db
    .from('webhook_events')
    .select('id, processed')
    .eq('provider', 'razorpay')
    .eq('provider_event_id', providerEventId)
    .maybeSingle<{ id: string; processed: boolean }>()

  if (existing?.processed) {
    // Already processed — idempotent 200
    return NextResponse.json({ received: true, duplicate: true })
  }

  // ── Step 5: Store webhook event ───────────────────────────
  const webhookInsert: WebhookEventInsert = {
    provider: 'razorpay',
    provider_event_id: providerEventId,
    event_type: eventType,
    signature_valid: signatureValid,
    payload: event,
    processed: false,
    processing_error: null,
    received_at: new Date().toISOString(),
    processed_at: null,
  }

  const { data: webhookEvent, error: insertError } = await db
    .from('webhook_events')
    .upsert(webhookInsert, { onConflict: 'provider,provider_event_id' })
    .select()
    .single()

  if (insertError || !webhookEvent) {
    console.error('[Webhook] Failed to store event:', insertError?.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // Reject invalid signatures AFTER storing the event (for audit trail)
  if (!signatureValid) {
    logAuditEvent({
      action: AuditAction.WEBHOOK_RECEIVED,
      resourceType: 'webhook_event',
      resourceId: webhookEvent.id,
      metadata: { event_type: eventType, signature_valid: false },
    }).catch(() => {})

    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // ── Step 6: Process event ─────────────────────────────────
  try {
    await processRazorpayEvent(event, webhookEvent.id)

    // Mark as processed
    await db
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', webhookEvent.id)

    logAuditEvent({
      action: AuditAction.WEBHOOK_PROCESSED,
      resourceType: 'webhook_event',
      resourceId: webhookEvent.id,
      metadata: { event_type: eventType },
    }).catch(() => {})
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'

    await db
      .from('webhook_events')
      .update({ processing_error: errMsg })
      .eq('id', webhookEvent.id)

    logAuditEvent({
      action: AuditAction.WEBHOOK_FAILED,
      resourceType: 'webhook_event',
      resourceId: webhookEvent.id,
      metadata: { event_type: eventType, error: errMsg },
    }).catch(() => {})

    console.error('[Webhook] Processing failed:', errMsg)
    // Return 200 so Razorpay doesn't retry
    return NextResponse.json({ received: true, error: 'Processing error' })
  }

  return NextResponse.json({ received: true })
}

// ── Event Processor ───────────────────────────────────────────

async function processRazorpayEvent(
  event: Record<string, unknown>,
  webhookEventId: string,
): Promise<void> {
  const eventType = event.event as string
  const payload = (event.payload as Record<string, unknown>) ?? {}

  switch (eventType) {
    case 'payment.captured':
      await handlePaymentCaptured(payload, webhookEventId)
      break

    case 'payment.failed':
      await handlePaymentFailed(payload)
      break

    case 'refund.processed':
    case 'refund.created':
      await handleRefundProcessed(payload)
      break

    default:
      // Unknown event — logged, not failed
      console.log(`[Webhook] Unhandled event type: ${eventType}`)
  }
}

// ── payment.captured ──────────────────────────────────────────

async function handlePaymentCaptured(
  payload: Record<string, unknown>,
  webhookEventId: string,
): Promise<void> {
  const paymentData = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown>
  if (!paymentData) throw new Error('Missing payment entity in webhook payload')

  const providerPaymentId = paymentData.id as string
  const providerOrderId = paymentData.order_id as string
  const capturedAmount = paymentData.amount as number       // in paise
  const currency = paymentData.currency as string
  const method = paymentData.method as string | null

  // Find the Flow order
  const order = await findOrderByProviderOrderId(providerOrderId)
  if (!order) throw new Error(`No Flow order found for provider_order_id: ${providerOrderId}`)

  // ── CRITICAL: Amount verification ────────────────────────
  if (capturedAmount !== order.amount) {
    logAuditEvent({
      action: AuditAction.PAYMENT_AMOUNT_MISMATCH,
      resourceType: 'order',
      resourceId: order.id,
      metadata: {
        expected: order.amount,
        received: capturedAmount,
        provider_payment_id: providerPaymentId,
      },
    }).catch(() => {})

    throw new Error(
      `Amount mismatch: expected ${order.amount}, got ${capturedAmount}. Payment NOT marked as SUCCESS.`,
    )
  }

  if (currency !== order.currency_code) {
    throw new Error(`Currency mismatch: expected ${order.currency_code}, got ${currency}`)
  }

  // Find the payment record
  const db = createAdminClient()
  const { data: payment } = await db
    .from('payments')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle<Payment>()

  if (!payment) throw new Error(`No payment record found for order: ${order.id}`)

  // Update payment → SUCCESS
  await updatePaymentStatus(payment.id, 'SUCCESS', {
    provider_payment_id: providerPaymentId,
    payment_method: method ?? null,
    paid_at: new Date().toISOString(),
  })

  // Update order → SUCCESS
  await updateOrderStatus(order.id, 'SUCCESS')

  logAuditEvent({
    action: AuditAction.PAYMENT_SUCCEEDED,
    resourceType: 'payment',
    resourceId: payment.id,
    organizationId: undefined,
    applicationId: payment.application_id,
    metadata: { provider_payment_id: providerPaymentId, amount: capturedAmount },
  }).catch(() => {})

  // Deliver application webhook
  await dispatchApplicationWebhook(payment, order, webhookEventId, 'payment.succeeded')
}

// ── payment.failed ────────────────────────────────────────────

async function handlePaymentFailed(payload: Record<string, unknown>): Promise<void> {
  const paymentData = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown>
  if (!paymentData) return

  const providerPaymentId = paymentData.id as string
  const providerOrderId = paymentData.order_id as string
  const errorCode = (paymentData.error_code as string) ?? null
  const errorDesc = (paymentData.error_description as string) ?? null

  const order = await findOrderByProviderOrderId(providerOrderId)
  if (!order) return

  const db = createAdminClient()
  const { data: payment } = await db
    .from('payments')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle<Payment>()

  if (!payment) return

  await updatePaymentStatus(payment.id, 'FAILED', {
    provider_payment_id: providerPaymentId,
    failure_code: errorCode,
    failure_reason: errorDesc,
  })

  await updateOrderStatus(order.id, 'FAILED')

  logAuditEvent({
    action: AuditAction.PAYMENT_FAILED,
    resourceType: 'payment',
    resourceId: payment.id,
    applicationId: payment.application_id,
    metadata: { failure_code: errorCode, failure_reason: errorDesc },
  }).catch(() => {})
}

// ── refund.processed ─────────────────────────────────────────

async function handleRefundProcessed(payload: Record<string, unknown>): Promise<void> {
  const refundData = (payload.refund as Record<string, unknown>)?.entity as Record<string, unknown>
  if (!refundData) return

  const providerRefundId = refundData.id as string

  const db = createAdminClient()
  const { data: refund } = await db
    .from('refunds')
    .select('*')
    .eq('provider_refund_id', providerRefundId)
    .maybeSingle<Refund>()

  if (!refund) return

  await updateRefundStatus(refund.id, 'SUCCESS', {
    completed_at: new Date().toISOString(),
  })

  logAuditEvent({
    action: AuditAction.REFUND_SUCCEEDED,
    resourceType: 'refund',
    resourceId: refund.id,
    metadata: { provider_refund_id: providerRefundId },
  }).catch(() => {})
}

// ── Application Webhook Dispatch ──────────────────────────────

async function dispatchApplicationWebhook(
  payment: Payment,
  order: Order,
  webhookEventId: string,
  eventType: string,
): Promise<void> {
  const db = createAdminClient()

  const { data: app } = await db
    .from('applications')
    .select('id, webhook_url')
    .eq('id', payment.application_id as string)
    .maybeSingle<Pick<Application, 'id' | 'webhook_url'>>()

  if (!app?.webhook_url) return

  const webhookPayload: WebhookPayload = {
    event: eventType,
    id: `evt_${webhookEventId}`,
    payment: {
      id: payment.id as string,
      payment_number: payment.payment_number as string,
      order_id: order.id as string,
      order_number: order.order_number as string,
      amount: payment.amount as number,
      currency: payment.currency_code as string,
      status: payment.status as string,
      provider: 'razorpay',
      provider_payment_id: payment.provider_payment_id as string | null,
      paid_at: payment.paid_at as string | null,
    },
    timestamp: new Date().toISOString(),
  }

  // Fire and forget — don't block webhook response
  deliverWebhook(
    webhookEventId,
    app.id,
    app.webhook_url,
    eventType,
    webhookPayload,
  ).catch((err) => console.error('[Webhook] Delivery error:', err))
}
