// @ts-nocheck
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/api-key'

export async function getApplicationsAction() {
  const db = createAdminClient()
  const { data } = await db.from('applications').select('id, name').order('created_at', { ascending: false })
  return data || []
}

export async function generateNewKeyAction(applicationId: string, environment: string) {
  const db = createAdminClient()
  
  // Generate the cryptographic key
  const generated = generateApiKey(environment)

  const { data: apiKey, error } = await db
    .from('api_keys')
    .insert({
      application_id: applicationId,
      name: `Generated ${environment === 'live' ? 'Live' : 'Test'} Key`,
      key_prefix: generated.keyPrefix,
      secret_hash: generated.secretHash,
      environment: environment,
      permissions: ['payments:create', 'payments:read', 'orders:read'],
    })
    .select('*, applications(name)')
    .single()

  if (error) {
    console.error('Supabase Error:', error)
    throw new Error(`DB Error: ${error.message} - ${error.details || ''}`)
  }

  // Return the FULL secret so the user can copy it
  return {
    ...apiKey,
    full_secret: generated.fullSecret,
  }
}

export async function getExistingKeysAction() {
  const db = createAdminClient()
  
  const { data } = await db
    .from('api_keys')
    .select('*, applications(name)')
    .order('created_at', { ascending: false })
    
  return data || []
}

export async function revokeKeyAction(keyId: string) {
  const db = createAdminClient()
  const { error } = await db
    .from('api_keys')
    .update({ status: 'revoked' })
    .eq('id', keyId)

  if (error) {
    console.error('Supabase Error:', error)
    throw new Error('Failed to revoke API key')
  }

  return { success: true }
}
