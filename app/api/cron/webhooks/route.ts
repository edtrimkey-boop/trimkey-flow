import { NextRequest, NextResponse } from 'next/server'
import { retryPendingWebhooks } from '@/services/webhook'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function handleCron(req: NextRequest) {
  try {
    // Optional Vercel Cron or custom CRON_SECRET auth check
    const cronSecret = process.env.CRON_SECRET
    const authHeader = req.headers.get('authorization')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 })
    }

    // 1. Retry pending webhooks
    const result = await retryPendingWebhooks()

    // 1.5. Automated BYOG Reconciliation: Verify pending orders with gateway before expiring
    try {
      const db = createAdminClient()
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
      const { data: pendingOrders } = await db
        .from('orders')
        .select('id, provider_order_id, merchant_provider_id, merchant_providers(*), applications(webhook_url), metadata')
        .in('status', ['PENDING', 'CREATED', 'pending', 'created'])
        .not('provider_order_id', 'is', null)
        .lt('created_at', oneMinuteAgo)
        .limit(10)

      if (pendingOrders && pendingOrders.length > 0) {
        const { decrypt } = await import('@/lib/encryption')
        const Razorpay = (await import('razorpay')).default || (await import('razorpay'))

        for (const ord of pendingOrders) {
          if (ord.merchant_providers?.provider === 'razorpay' && ord.merchant_providers?.credentials_encrypted) {
            try {
              const creds = JSON.parse(await decrypt(ord.merchant_providers.credentials_encrypted as any))
              if (creds.key_id && creds.key_secret) {
                const rzp = new Razorpay({ key_id: creds.key_id, key_secret: creds.key_secret })
                const paymentsList = await rzp.orders.fetchPayments(ord.provider_order_id)
                const captured = paymentsList?.items?.find((p: any) => p.status === 'captured')
                if (captured) {
                  console.log(`[Cron Reconcile]: Order ${ord.provider_order_id} was captured on Razorpay! Marking SUCCESS.`)
                  const nowStr = new Date().toISOString()
                  await db.from('orders').update({ status: 'PAID', updated_at: nowStr }).eq('id', ord.id)
                  
                  const { data: updatedPayment } = await db.from('payments').update({
                    status: 'SUCCESS',
                    provider_payment_id: captured.id,
                    paid_at: nowStr,
                    updated_at: nowStr,
                  }).eq('order_id', ord.id).select().maybeSingle()

                  const appWebhookUrl = ord.applications?.webhook_url || ord.metadata?.webhook_url || 'https://backend-ed.trimkey.in/api/gateway'
                  if (appWebhookUrl && updatedPayment) {
                    fetch(appWebhookUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Trim-Key-Flow-Event': 'payment.success',
                      },
                      body: JSON.stringify({
                        event: 'payment.success',
                        id: updatedPayment.id,
                        payment_number: updatedPayment.payment_number,
                        amount: updatedPayment.amount,
                        currency: updatedPayment.currency_code,
                        provider_payment_id: captured.id,
                        provider_order_id: ord.provider_order_id,
                        gateway_payment_id: captured.id,
                        gateway_order_id: ord.provider_order_id,
                        metadata: {
                          ...(ord.metadata || {}),
                          provider_payment_id: captured.id,
                          provider_order_id: ord.provider_order_id
                        },
                        timestamp: nowStr,
                      }),
                      signal: AbortSignal.timeout(5000),
                    }).catch(err => console.warn('[Cron Reconcile Webhook Notice]:', err?.message))
                  }
                }
              }
            } catch (reconErr: any) {
              console.warn('[Cron Order Reconcile Warning]:', reconErr?.message)
            }
          }
        }
      }
    } catch (autoErr: any) {
      console.warn('[Cron Reconcile Pending Orders Error]:', autoErr?.message)
    }

    // 2. Batch auto-expire pending orders older than 15 minutes
    try {
      const db = createAdminClient()
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      await db
        .from('payments')
        .update({
          status: 'EXPIRED',
          failure_code: 'SESSION_EXPIRED',
          failure_reason: 'Automated batch expiry: payment session exceeded 15-minute validity window',
          updated_at: new Date().toISOString(),
        })
        .in('status', ['PENDING', 'CREATED', 'pending', 'created'])
        .lt('created_at', fifteenMinutesAgo)

      await db
        .from('orders')
        .update({
          status: 'EXPIRED',
          updated_at: new Date().toISOString(),
        })
        .in('status', ['PENDING', 'CREATED', 'pending', 'created'])
        .lt('created_at', fifteenMinutesAgo)
    } catch (expErr: any) {
      console.warn('[Cron Expire Orders Warning]:', expErr?.message)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    console.error('[Cron Webhooks Error]:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return handleCron(req)
}

export async function POST(req: NextRequest) {
  return handleCron(req)
}
