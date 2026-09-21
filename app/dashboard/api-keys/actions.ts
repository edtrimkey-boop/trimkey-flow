// @ts-nocheck
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/api-key'

export async function generateNewKeyAction() {
  const db = createAdminClient()
  
  // We will attach it to the dummy application we created in seed.sql
  const dummyAppId = '22222222-2222-2222-2222-222222222222'
  
  // Generate the cryptographic key
  const generated = generateApiKey('live')

  const { data: apiKey, error } = await db
    .from('api_keys')
    .insert({
      application_id: dummyAppId,
      name: 'Generated Live Key',
      key_prefix: generated.keyPrefix,
      secret_hash: generated.secretHash,
      environment: 'live',
      permissions: ['payments:create', 'payments:read', 'orders:read'],
    })
    .select()
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
  const dummyAppId = '22222222-2222-2222-2222-222222222222'
  
  const { data } = await db
    .from('api_keys')
    .select('*')
    .eq('application_id', dummyAppId)
    .order('created_at', { ascending: false })
    
  return data || []
}

