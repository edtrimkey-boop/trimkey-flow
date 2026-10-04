'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addDomainAction(applicationId: string, domain: string) {
  const db = createAdminClient()
  
  const { error } = await db.from('application_domains').insert({
    application_id: applicationId,
    domain,
    is_verified: true
  } as any)
  
  if (error) {
    console.error(error)
    throw new Error('Failed to add domain: ' + error.message)
  }

  revalidatePath('/dashboard/domains')
}
