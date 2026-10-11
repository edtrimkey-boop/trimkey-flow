// @ts-nocheck
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createPayment } from '@/services/payment'
import type { ApiKeyContext, CheckoutInfo } from '@/types/api'
import { revalidatePath } from 'next/cache'

export interface CreatePaymentLinkInput {
  applicationId: string
  merchantId: string
  amountInInr: number
  currency?: string
  purpose?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

export async function createPaymentLinkAction(input: CreatePaymentLinkInput): Promise<CheckoutInfo> {
  const db = createAdminClient()

  if (!input.applicationId) {
    throw new Error('Please select an application')
  }

  if (!input.merchantId) {
    throw new Error('Please select a merchant')
  }

  const inr = Number(input.amountInInr)
  if (isNaN(inr) || inr < 1) {
    throw new Error('Amount must be at least ₹1.00')
  }

  // Convert Rupees to paise
  const amountInPaise = Math.round(inr * 100)

  // 1. Fetch merchant to resolve organization_id
  const { data: merchant, error: mErr } = await db
    .from('merchants')
    .select('id, name, organization_id, status')
    .eq('id', input.merchantId)
    .single()

  if (mErr || !merchant) {
    throw new Error('Selected merchant not found or inactive')
  }

  // 2. Fetch application to verify it exists
  const { data: app, error: aErr } = await db
    .from('applications')
    .select('id, name')
    .eq('id', input.applicationId)
    .single()

  if (aErr || !app) {
    throw new Error('Selected application not found')
  }

  // 3. Construct ApiKeyContext
  const ctx: ApiKeyContext = {
    api_key_id: 'dashboard-ui',
    application_id: app.id,
    organization_id: merchant.organization_id,
    environment: 'live',
    permissions: ['payments:create', 'payments:read', 'orders:read'],
  }

  // 4. Create payment through the core payment service
  const checkout = await createPayment(
    {
      amount: amountInPaise,
      currency: input.currency || 'INR',
      merchant_id: merchant.id,
      purpose: input.purpose || 'Live Payment Test',
      customer: {
        name: input.customerName || 'Trim Key Test User',
        email: input.customerEmail || 'test@trimkey.in',
        phone: input.customerPhone || '9999999999',
      },
    },
    ctx,
    new Headers(),
  )

  revalidatePath('/dashboard/transactions')

  return checkout
}
