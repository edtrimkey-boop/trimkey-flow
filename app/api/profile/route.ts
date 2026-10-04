import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const db = createAdminClient()
  const { data: org } = await db.from('organizations').select('name').limit(1).single()
  const { data: profile } = await db.from('profiles').select('full_name').limit(1).single()
  
  return NextResponse.json({
    organization_name: org?.name || 'Trim Key Corp',
    user_name: profile?.full_name || 'Admin User',
    user_email: 'edtrimkey@gmail.com'
  })
}
