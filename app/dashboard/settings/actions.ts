'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateProfile(profileId: string, full_name: string) {
  const db = createAdminClient()
  await db.from('profiles').update({ full_name }).eq('id', profileId)
  // Optionally update organization email as well, since user wants it displayed there
  revalidatePath('/dashboard/settings')
}

export async function toggleProvider(providerId: string, isActive: boolean) {
  const db = createAdminClient()
  await db.from('merchant_providers').update({ is_active: isActive }).eq('id', providerId)
  revalidatePath('/dashboard/settings')
}
