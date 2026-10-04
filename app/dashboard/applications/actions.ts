'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addApplicationAction(orgId: string, name: string, environment: string) {
  const db = createAdminClient()
  
  const { error } = await db.from('applications').insert({
    organization_id: orgId,
    name,
    environment,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    status: 'active'
  } as any)
  
  if (error) {
    console.error(error)
    throw new Error('Failed to create application: ' + error.message)
  }

  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/api-keys')
  revalidatePath('/dashboard/webhooks')
  revalidatePath('/dashboard/domains')
}
