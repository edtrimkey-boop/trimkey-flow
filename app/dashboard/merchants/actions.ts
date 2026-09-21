// @ts-nocheck
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

// We hardcode the organization ID for this single-org demo setup
const DEFAULT_ORG_ID = '11111111-1111-1111-1111-111111111111'

export async function onboardMerchantAction(formData: FormData) {
  const name = formData.get('name') as string
  const provider = formData.get('provider') as string
  const keyId = formData.get('key_id') as string
  const keySecret = formData.get('key_secret') as string
  const webhookSecret = formData.get('webhook_secret') as string

  if (!name || !provider || !keyId) {
    throw new Error('Name, Provider, and Key ID are required')
  }

  const db = createAdminClient()

  // 1. Insert the new Merchant
  const { data: merchant, error: merchantError } = await db
    .from('merchants')
    .insert({
      organization_id: DEFAULT_ORG_ID,
      name,
      display_name: name,
      status: 'active'
    })
    .select()
    .single()

  if (merchantError || !merchant) {
    throw new Error('Failed to create merchant: ' + merchantError?.message)
  }

  // 2. Encrypt the credentials
  const credentials = JSON.stringify({
    key_id: keyId,
    key_secret: keySecret
  })
  const credentialsEncrypted = await encrypt(credentials)
  
  // Encrypt webhook secret if provided
  let webhookSecretEncrypted = null
  if (webhookSecret) {
    webhookSecretEncrypted = await encrypt(webhookSecret)
  }

  // 3. Insert the Merchant Provider mapped to the new Merchant
  const { error: providerError } = await db
    .from('merchant_providers')
    .insert({
      merchant_id: merchant.id,
      provider: provider,
      credentials_encrypted: credentialsEncrypted as any,
      webhook_secret_encrypted: webhookSecretEncrypted,
      is_active: true,
      is_default: true
    })

  if (providerError) {
    throw new Error('Failed to save provider credentials: ' + providerError.message)
  }

  // Revalidate the merchants page so the list refreshes
  revalidatePath('/dashboard/merchants')

  return { success: true }
}

export async function updateMerchantStatusAction(merchantId: string, status: 'active' | 'suspended' | 'inactive') {
  const db = createAdminClient()

  const { error } = await db
    .from('merchants')
    .update({ status })
    .eq('id', merchantId)

  if (error) {
    throw new Error(`Failed to ${status} merchant: ` + error.message)
  }

  // If suspended or revoked, we should also deactivate their providers to be safe
  if (status !== 'active') {
    await db
      .from('merchant_providers')
      .update({ is_active: false })
      .eq('merchant_id', merchantId)
  } else {
    // If active, optionally re-activate them (or they can manage them manually)
    await db
      .from('merchant_providers')
      .update({ is_active: true })
      .eq('merchant_id', merchantId)
  }

  revalidatePath('/dashboard/merchants')
  return { success: true }
}

