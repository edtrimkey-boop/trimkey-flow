// ============================================================
// Trim Key Flow — Order Service
// Manages Flow orders (TKF-ORD-YYYYMMDD-NNNNNN)
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import { isValidOrderTransition } from '@/types/payment'
import type { Order, OrderInsert } from '@/types/database'
import type { ApiKeyContext } from '@/types/api'

// ── Flow Order ID Generation ───────────────────────────────────

/**
 * Generate the next Flow order number: TKF-ORD-YYYYMMDD-NNNNNN
 * Uses a daily sequence derived from DB count.
 */
export async function generateOrderNumber(): Promise<string> {
  const db = createAdminClient()
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  const prefix = `TKF-ORD-${today}-`

  const { count, error } = await db
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .like('order_number', `${prefix}%`)

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to generate order number', 500)

  const sequence = String((count ?? 0) + 1).padStart(6, '0')
  return `${prefix}${sequence}`
}

// ── CRUD ──────────────────────────────────────────────────────

export interface CreateFlowOrderInput {
  applicationId: string
  merchantId: string
  merchantProviderId: string
  amount: number
  currencyCode: string
  purpose: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export async function createFlowOrder(input: CreateFlowOrderInput): Promise<Order> {
  const db = createAdminClient()
  const orderNumber = await generateOrderNumber()

  const insert: OrderInsert = {
    order_number: orderNumber,
    application_id: input.applicationId,
    merchant_id: input.merchantId,
    merchant_provider_id: input.merchantProviderId,
    amount: input.amount,
    currency_code: input.currencyCode,
    purpose: input.purpose,
    status: 'CREATED',
    provider_order_id: null,
    customer_name: input.customerName ?? null,
    customer_email: input.customerEmail ?? null,
    customer_phone: input.customerPhone ?? null,
    idempotency_key: input.idempotencyKey ?? null,
    metadata: input.metadata ?? null,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  }

  const { data, error } = await db.from('orders').insert(insert).select().single<Order>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, `Failed to create order: ${error.message}`, 500)

  return data
}

export async function getOrder(orderId: string, ctx: ApiKeyContext): Promise<Order> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('application_id', ctx.application_id)
    .maybeSingle<Order>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch order', 500)
  if (!data) throw new FlowError(ErrorCode.ORDER_NOT_FOUND, 'Order not found', 404)

  return data
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const db = createAdminClient()

  const { data } = await db
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle<Order>()

  return data
}

export async function findOrderByProviderOrderId(providerOrderId: string): Promise<Order | null> {
  const db = createAdminClient()

  const { data } = await db
    .from('orders')
    .select('*')
    .eq('provider_order_id', providerOrderId)
    .maybeSingle<Order>()

  return data
}

export async function listOrders(
  ctx: ApiKeyContext,
  filters: { merchantId?: string; status?: string; limit?: number; offset?: number } = {},
): Promise<Order[]> {
  const db = createAdminClient()
  const { merchantId, status, limit = 20, offset = 0 } = filters

  let query = db
    .from('orders')
    .select('*')
    .eq('application_id', ctx.application_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (merchantId) query = query.eq('merchant_id', merchantId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch orders', 500)

  return (data as Order[]) ?? []
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  updates: Partial<Pick<Order, 'provider_order_id' | 'metadata'>> = {},
): Promise<Order> {
  const db = createAdminClient()

  // Fetch current status
  const { data: current } = await db
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!current) throw new FlowError(ErrorCode.ORDER_NOT_FOUND, 'Order not found', 404)

  if (!isValidOrderTransition(current.status, newStatus)) {
    throw new FlowError(
      ErrorCode.INVALID_PAYMENT_STATE,
      `Cannot transition order from ${current.status} to ${newStatus}`,
      400,
    )
  }

  const { data, error } = await db
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString(), ...updates })
    .eq('id', orderId)
    .select()
    .single<Order>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to update order', 500)

  return data
}
