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

export async function deleteDomainAction(domainId: string) {
  const db = createAdminClient()

  const { error } = await (db as any).from('application_domains').delete().eq('id', domainId)

  if (error) {
    console.error(error)
    throw new Error('Failed to delete domain: ' + error.message)
  }

  revalidatePath('/dashboard/domains')
}

export async function toggleDomainVerificationAction(domainId: string, currentStatus: boolean) {
  const db = createAdminClient()

  const { error } = await (db as any).from('application_domains').update({
    is_verified: !currentStatus,
    verified_at: !currentStatus ? new Date().toISOString() : null
  }).eq('id', domainId)

  if (error) {
    console.error(error)
    throw new Error('Failed to update verification status: ' + error.message)
  }

  revalidatePath('/dashboard/domains')
}
