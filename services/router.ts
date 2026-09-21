// @ts-nocheck
// ============================================================
// Trim Key Flow - Smart Router Migration Script
// Drop this directly into services/router.ts
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import type { MerchantProvider } from '@/types/database'

export async function resolveSmartProvider(
  merchantId: string, 
  currency: string, 
  amountInPaise: number
): Promise<MerchantProvider> {
  const db = createAdminClient()

  // 1. Fetch all active routing rules for this merchant ordered by priority (lowest number first)
  const { data: rules } = await db
    .from('routing_rules')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .order('priority', { ascending: true })

  // 2. Fetch all active providers for this merchant
  const { data: providers } = await db
    .from('merchant_providers')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)

  if (!providers || providers.length === 0) {
    throw new FlowError(ErrorCode.PROVIDER_NOT_CONFIGURED, 'No active payment providers configured', 400)
  }

  // 3. Evaluate Rules in order
  if (rules && rules.length > 0) {
    for (const rule of rules) {
      
      // Check Currency Condition
      if (rule.condition_currency && rule.condition_currency !== currency) continue;
      
      // Check Amount Conditions
      if (rule.condition_min_amount && amountInPaise < rule.condition_min_amount) continue;
      if (rule.condition_max_amount && amountInPaise > rule.condition_max_amount) continue;

      // Rule matched! Find the corresponding provider
      const matchedProvider = providers.find(p => p.id === rule.target_provider_id)
      
      // Here is where we would add Health Checks! (e.g. if matchedProvider is down, continue to next rule)
      if (matchedProvider) {
        console.log(`[Smart Router] Rule "${rule.name}" matched! Routing to ${matchedProvider.provider}`)
        return matchedProvider
      }
    }
  }

  // 4. Fallback if no rules match: Return the default provider
  const fallback = providers.find(p => p.is_default) || providers[0]
  console.log(`[Smart Router] No rules matched. Using fallback: ${fallback.provider}`)
  return fallback
}

