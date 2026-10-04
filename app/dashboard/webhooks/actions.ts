'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveWebhookAction(applicationId: string, url: string) {
  const db = createAdminClient()
  
  const { error } = await db.from('applications').update({
    webhook_url: url
  }).eq('id', applicationId)
  
  if (error) {
    console.error(error)
    throw new Error('Failed to update webhook: ' + error.message)
  }

  revalidatePath('/dashboard/webhooks')
  revalidatePath('/dashboard/applications')
}
