'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addRoutingRule(providerId: string, merchantId: string, conditionType: string) {
  const db = createAdminClient()
  
  // Calculate priority
  const { data: rules } = await db.from('routing_rules').select('priority').order('priority', { ascending: false }).limit(1)
  const nextPriority = rules && rules.length > 0 ? (rules as any[])[0].priority + 1 : 1

  let condition_min_amount = null
  let condition_currency = null
  
  if (conditionType === 'volume') {
    condition_min_amount = 100000 // $1000 in cents
  } else if (conditionType === 'international') {
    condition_currency = 'USD'
  }

  const { error } = await db.from('routing_rules').insert({
    merchant_id: merchantId,
    target_provider_id: providerId,
    name: conditionType === 'always' ? 'Default Fallback' : conditionType === 'volume' ? 'High Volume Routing' : 'International Routing',
    priority: nextPriority,
    condition_currency,
    condition_min_amount,
    is_active: true
  } as any)
  
  if (error) {
    console.error(error)
    throw new Error('Failed to insert rule: ' + error.message)
  }

  revalidatePath('/dashboard/router')
}
