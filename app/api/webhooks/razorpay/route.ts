'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// this should be set in env
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'hello12345'

export async function POST(req: NextRequest) {
  const db = createAdminClient()

  const signature = req.headers.get('x-razorpay-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const bodyText = await req.text()

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(bodyText)
    .digest('hex')

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(bodyText)

  if (payload.event === 'payment.captured') {
    const paymentEntity = payload.payload.payment.entity
    const providerOrderId = paymentEntity.order_id

    // 1. Find Order first
    const { data: orderData } = await db
      .from('orders')
      .select('id')
      .eq('provider_order_id', providerOrderId)
      .single()

    if (!orderData) {
      console.error('Order not found for provider_order_id:', providerOrderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. Update payment status in database
    const { data: _payment, error } = await db
      .from('payments')
      .update({ status: 'success', updated_at: new Date().toISOString(), provider_payment_id: paymentEntity.id })
      .eq('order_id', orderData.id)
      .select('*, applications(webhook_url)')
      .single()

    const payment = _payment as any

    if (error || !payment) {
      console.error('Failed to update payment', error)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // 3. Fire webhook to merchant
    const merchantWebhookUrl = payment.applications?.webhook_url
    if (merchantWebhookUrl) {
      // Log event in webhook_events
      const { data: eventData } = await db
        .from('webhook_events')
        .insert({
          provider: 'razorpay',
          provider_event_id: payload.id || 'unknown',
          event_type: payload.event,
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
            body: JSON.stringify({ payment_id: payment.id, order_id: payment.order_id, status: 'success', amount: payment.amount })
          })

          // Log delivery
          await db.from('webhook_deliveries').insert({
            webhook_event_id: eventData.id,
            application_id: payment.application_id,
            endpoint_url: merchantWebhookUrl,
            event_type: 'payment.success',
            attempt_number: 1,
            http_status: whResponse.status,
            status: whResponse.ok ? 'SUCCESS' : 'FAILED',
            delivered_at: new Date().toISOString()
          })
        } catch (e) {
          // Log failed delivery
          await db.from('webhook_deliveries').insert({
            webhook_event_id: eventData.id,
            application_id: payment.application_id,
            endpoint_url: merchantWebhookUrl,
            event_type: 'payment.success',
            attempt_number: 1,
            http_status: 0,
            status: 'FAILED'
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}


