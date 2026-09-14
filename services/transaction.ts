// ============================================================
// Trim Key Flow — Transaction Service
// Facade over payments + orders for the transaction.* API actions
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import type { Payment, Order } from '@/types/database'
import type { ApiKeyContext } from '@/types/api'

export interface Transaction {
  id: string
  transaction_number: string    // Uses payment_number (TKF-PAY-*)
  order_id: string
  order_number: string
  application_id: string
  merchant_id: string
  provider: string
  provider_payment_id: string | null
  provider_order_id: string | null
  amount: number
  currency_code: string
  payment_method: string | null
  status: string
  purpose: string
  customer_name: string | null
  customer_email: string | null
  created_at: string
  paid_at: string | null
}

function toTransaction(payment: Payment, order: Order, provider: string): Transaction {
  return {
    id: payment.id,
    transaction_number: payment.payment_number,
    order_id: order.id,
    order_number: order.order_number,
    application_id: payment.application_id,
    merchant_id: payment.merchant_id,
    provider,
    provider_payment_id: payment.provider_payment_id,
    provider_order_id: order.provider_order_id,
    amount: payment.amount,
    currency_code: payment.currency_code,
    payment_method: payment.payment_method,
    status: payment.status,
    purpose: order.purpose,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    created_at: payment.created_at,
    paid_at: payment.paid_at,
  }
}

export async function getTransaction(
  transactionId: string,
  ctx: ApiKeyContext,
): Promise<Transaction> {
  const db = createAdminClient()

  const isNumber = transactionId.startsWith('TKF-PAY-')

  const { data: payment, error } = isNumber
    ? await db.from('payments').select('*, orders(*), merchant_providers(provider)').eq('payment_number', transactionId).eq('application_id', ctx.application_id).maybeSingle()
    : await db.from('payments').select('*, orders(*), merchant_providers(provider)').eq('id', transactionId).eq('application_id', ctx.application_id).maybeSingle()

  if (error || !payment) throw new FlowError(ErrorCode.RESOURCE_NOT_FOUND, 'Transaction not found', 404)

  const p = payment as Payment & { orders: Order; merchant_providers: { provider: string } }
  return toTransaction(p, p.orders, p.merchant_providers?.provider ?? 'unknown')
}

export async function listTransactions(
  ctx: ApiKeyContext,
  filters: {
    merchantId?: string
    applicationId?: string
    status?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  } = {},
): Promise<Transaction[]> {
  const db = createAdminClient()
  const { merchantId, status, from, to, limit = 20, offset = 0 } = filters

  let query = db
    .from('payments')
    .select('*, orders(*), merchant_providers(provider)')
    .eq('application_id', ctx.application_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (merchantId) query = query.eq('merchant_id', merchantId)
  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch transactions', 500)

  return ((data ?? []) as Array<Payment & { orders: Order; merchant_providers: { provider: string } }>).map(
    (p) => toTransaction(p, p.orders, p.merchant_providers?.provider ?? 'unknown'),
  )
}
