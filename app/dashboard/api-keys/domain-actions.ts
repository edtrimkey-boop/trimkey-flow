'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const dummyAppId = '22222222-2222-2222-2222-222222222222'

export async function addDomainAction(domain: string) {
  const db = createAdminClient()

  // Clean the domain (e.g., if user pastes with trailing slash)
  const cleanDomain = domain.trim().replace(/\/$/, '')

  const { data, error } = await db
    .from('application_domains')
    .insert({
      application_id: dummyAppId,
      domain: cleanDomain
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('This domain is already authorized.')
    }
    throw new Error('Failed to add domain: ' + error.message)
  }

  return data
}

export async function getDomainsAction() {
  const db = createAdminClient()
  
  const { data, error } = await db
    .from('application_domains')
    .select('*')
    .eq('application_id', dummyAppId)
    .order('domain', { ascending: true })

  if (error) {
    throw new Error('Failed to load domains: ' + error.message)
  }

  return data || []
}

export async function deleteDomainAction(domain: string) {
  const db = createAdminClient()

  const { error } = await db
    .from('application_domains')
    .delete()
    .eq('application_id', dummyAppId)
    .eq('domain', domain)

  if (error) {
    throw new Error('Failed to remove domain: ' + error.message)
  }

  return { success: true }
}
