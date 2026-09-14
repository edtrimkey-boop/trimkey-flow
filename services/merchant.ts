// ============================================================
// Trim Key Flow — Merchant Service
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import { decrypt } from '@/lib/encryption'
import type { Merchant, MerchantProvider, EncryptedCredentials } from '@/types/database'
import type { ApiKeyContext } from '@/types/api'
import type { RazorpayCredentials } from '@/types/payment'
import { RazorpayAdapter } from '@/providers/razorpay/adapter'
import type { PaymentProvider } from '@/providers/types'

// ── Merchant Queries ──────────────────────────────────────────

export async function getMerchant(
  merchantId: string,
  ctx: ApiKeyContext,
): Promise<Merchant> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .eq('organization_id', ctx.organization_id)
    .maybeSingle<Merchant>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch merchant', 500)
  if (!data) throw new FlowError(ErrorCode.MERCHANT_NOT_FOUND, 'Merchant not found', 404)

  return data
}

export async function listMerchants(
  ctx: ApiKeyContext,
  limit = 20,
  offset = 0,
): Promise<Merchant[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('merchants')
    .select('*')
    .eq('organization_id', ctx.organization_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch merchants', 500)

  return (data as Merchant[]) ?? []
}

/**
 * Resolve a merchant for a payment request.
 * Verifies the merchant belongs to the caller's organization.
 */
export async function resolveMerchantForApplication(
  merchantId: string,
  organizationId: string,
): Promise<Merchant> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .maybeSingle<Merchant>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve merchant', 500)
  if (!data) {
    throw new FlowError(
      ErrorCode.MERCHANT_NOT_FOUND,
      'Merchant not found or not authorized for this organization',
      404,
    )
  }

  return data
}

// ── Provider Resolution ────────────────────────────────────────

/**
 * Get the default active provider for a merchant.
 */
export async function resolveDefaultProvider(merchantId: string): Promise<MerchantProvider> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('merchant_providers')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .eq('is_default', true)
    .maybeSingle<MerchantProvider>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve provider', 500)
  if (!data) {
    throw new FlowError(
      ErrorCode.PROVIDER_NOT_CONFIGURED,
      'No active payment provider configured for this merchant',
      400,
    )
  }

  return data
}

/**
 * Decrypt merchant provider credentials and return the appropriate PaymentProvider adapter.
 */
export async function getProviderAdapter(merchantProvider: MerchantProvider): Promise<PaymentProvider> {
  if (!merchantProvider.credentials_encrypted) {
    throw new FlowError(ErrorCode.PROVIDER_NOT_CONFIGURED, 'Provider credentials not configured', 400)
  }

  const provider = merchantProvider.provider

  if (provider === 'razorpay') {
    const credentials = await decrypt(merchantProvider.credentials_encrypted as EncryptedCredentials)
    const creds = JSON.parse(credentials) as RazorpayCredentials
    return new RazorpayAdapter(creds)
  }

  throw new FlowError(ErrorCode.PROVIDER_NOT_CONFIGURED, `Provider ${provider} is not supported`, 400)
}

/**
 * Decrypt the webhook secret for a merchant provider.
 */
export async function getProviderWebhookSecret(merchantProvider: MerchantProvider): Promise<string> {
  if (!merchantProvider.webhook_secret_encrypted) {
    // Fall back to global Razorpay webhook secret
    const { getServerEnv } = await import('@/config/env')
    return getServerEnv().RAZORPAY_WEBHOOK_SECRET
  }

  return decrypt({
    // webhook_secret_encrypted is stored as a simple encrypted string
    // We use a wrapper format: "iv:ciphertext:tag" split by ':'
    ...(JSON.parse(merchantProvider.webhook_secret_encrypted) as EncryptedCredentials),
  })
}
