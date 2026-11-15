import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = performance.now()
  let dbOk = false
  let dbError: string | null = null

  try {
    const db = createAdminClient()
    const { data, error } = await db.from('organizations').select('id').limit(1)
    if (error) {
      dbError = error.message
    } else {
      dbOk = true
    }
  } catch (err: any) {
    dbError = err?.message || 'Database connection error'
  }

  const durationMs = Math.round(performance.now() - start)

  if (!dbOk) {
    return NextResponse.json(
      {
        status: 'degraded',
        database: 'unreachable',
        error: dbError,
        latencyMs: durationMs,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    status: 'healthy',
    database: 'connected',
    latencyMs: durationMs,
    timestamp: new Date().toISOString(),
  })
}
