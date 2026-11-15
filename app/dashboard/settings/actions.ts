'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateProfile(profileId: string, full_name: string, orgId?: string, email?: string) {
  const db = createAdminClient()
  if (profileId) {
    await db.from('profiles').update({ full_name }).eq('id', profileId)
  }
  if (orgId && email) {
    await db.from('organizations').update({ email }).eq('id', orgId)
  }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function toggleProvider(providerId: string, isActive: boolean) {
  const db = createAdminClient()
  await db.from('merchant_providers').update({ is_active: isActive }).eq('id', providerId)
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateDeveloperMode(organizationId: string, isTestMode: boolean) {
  const db = createAdminClient()
  const { data: org } = await db.from('organizations').select('metadata').eq('id', organizationId).single()
  const currentMeta = (org?.metadata as Record<string, any>) || {}
  
  await (db as any).from('organizations').update({
    metadata: {
      ...currentMeta,
      developer_mode: isTestMode,
    }
  }).eq('id', organizationId)

  revalidatePath('/dashboard/settings')
  return { success: true }
}
