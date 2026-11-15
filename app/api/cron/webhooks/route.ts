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
