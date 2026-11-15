import { NextRequest, NextResponse } from 'next/server'
import { retryPendingWebhooks } from '@/services/webhook'

export const dynamic = 'force-dynamic'

async function handleCron(req: NextRequest) {
  try {
    // Optional Vercel Cron or custom CRON_SECRET auth check
    const cronSecret = process.env.CRON_SECRET
    const authHeader = req.headers.get('authorization')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 })
    }

    const result = await retryPendingWebhooks()

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
