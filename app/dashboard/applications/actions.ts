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

export async function updateApplicationAction(
  appId: string,
  data: {
    name: string
    environment: string
    status: string
    webhook_url?: string
  }
) {
  const db = createAdminClient()

  const { error } = await db
    .from('applications')
    .update({
      name: data.name,
      environment: data.environment,
      status: data.status,
      webhook_url: data.webhook_url || null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', appId)

  if (error) {
    console.error('Update App Error:', error)
    throw new Error('Failed to update application: ' + error.message)
  }

  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/api-keys')
  revalidatePath('/dashboard/webhooks')
  revalidatePath('/dashboard/domains')
  return { success: true }
}

export async function deleteApplicationAction(appId: string) {
  const db = createAdminClient()

  const { error } = await db
    .from('applications')
    .delete()
    .eq('id', appId)

  if (error) {
    console.error('Delete App Error:', error)
    throw new Error('Failed to delete application: ' + error.message)
  }

  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/api-keys')
  revalidatePath('/dashboard/webhooks')
  revalidatePath('/dashboard/domains')
  return { success: true }
}
