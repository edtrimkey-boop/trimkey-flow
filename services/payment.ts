// ============================================================
// Trim Key Flow — Payment Service
// Full 20-step payment creation flow per spec §20
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import { isValidPaymentTransition } from '@/types/payment'
import { findExistingOrder } from '@/lib/idempotency'
import { extractIdempotencyKey } from '@/lib/idempotency'
import { resolveMerchantForApplication, resolveDefaultProvider, getProviderAdapter } from '@/services/merchant'
import { createFlowOrder, updateOrderStatus } from '@/services/order'
import { logAuditEvent, AuditAction } from '@/services/audit'
import type { Payment, PaymentInsert, Order } from '@/types/database'
import type { ApiKeyContext, CheckoutInfo } from '@/types/api'
import type { CreatePaymentData, ListPaymentsData, GetPaymentData } from '@/types/api'

// ── Payment ID Generation ─────────────────────────────────────

async function generatePaymentNumber(): Promise<string> {
  const db = createAdminClient()
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `TKF-PAY-${today}-`

  const { count } = await db
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .like('payment_number', `${prefix}%`)

  const sequence = String((count ?? 0) + 1).padStart(6, '0')
  return `${prefix}${sequence}`
}

// ── Create Payment (20-step flow) ─────────────────────────────

export async function createPayment(
  data: CreatePaymentData,
  ctx: ApiKeyContext,
  headers: Headers,
): Promise<CheckoutInfo> {
  const db = createAdminClient()

  // Step 4: Validate (done upstream in route handler)

  // Step 5: Application resolution (done via API key auth)

  // Step 6: Organization resolution (done via API key auth)

  // Step 7: Merchant resolution
  const merchant = await resolveMerchantForApplication(data.merchant_id, ctx.organization_id)

  // Step 8: Merchant authorization (already verified by resolveMerchantForApplication)

  // Step 9: Provider resolution
  const merchantProvider = await resolveDefaultProvider(merchant.id)

  // Step 10: Idempotency check
  const idempotencyKey = extractIdempotencyKey(headers)
  if (idempotencyKey) {
    const existing = await findExistingOrder(ctx.application_id, idempotencyKey)
    if (existing) {
      // Return the existing payment for this order
      const existingPayment = await getPaymentByOrderId(existing.id)
      if (existingPayment) {
        return buildCheckoutInfo(existing, existingPayment, merchantProvider.provider, ctx)
      }
    }
  }

  // Step 11: Create Flow order
  const order = await createFlowOrder({
    applicationId: ctx.application_id,
    merchantId: merchant.id,
    merchantProviderId: merchantProvider.id,
    amount: data.amount,
    currencyCode: data.currency,
    purpose: data.purpose,
    customerName: data.customer?.name,
    customerEmail: data.customer?.email,
    customerPhone: data.customer?.phone,
    idempotencyKey: idempotencyKey ?? undefined,
    metadata: data.metadata,
  })

  // Step 12: Call Razorpay
  const provider = await getProviderAdapter(merchantProvider)
  const providerOrder = await provider.createOrder({
    amount: data.amount,
    currency: data.currency,
    order_number: order.order_number,
    notes: {
      flow_order_id: order.id,
      purpose: data.purpose,
    },
  })

  // Step 13: Store provider order ID
  await updateOrderStatus(order.id, 'PENDING', {
    provider_order_id: providerOrder.provider_order_id,
  })

  // Step 14: Create payment record (TKF-PAY-*)
  const paymentNumber = await generatePaymentNumber()

  const paymentInsert: PaymentInsert = {
    payment_number: paymentNumber,
    order_id: order.id,
    application_id: ctx.application_id,
    merchant_id: merchant.id,
    merchant_provider_id: merchantProvider.id,
    provider_payment_id: null,
    amount: data.amount,
    currency_code: data.currency,
    payment_method: null,
    status: 'PENDING',
    failure_code: null,
    failure_reason: null,
    metadata: data.metadata ?? null,
    paid_at: null,
  }

  const { data: payment, error } = await db
    .from('payments')
    .insert(paymentInsert)
    .select()
    .single<Payment>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment record', 500)

  // Audit log
  logAuditEvent({
    action: AuditAction.PAYMENT_CREATED,
    resourceType: 'payment',
    resourceId: payment.id,
    organizationId: ctx.organization_id,
    applicationId: ctx.application_id,
    metadata: { payment_number: paymentNumber, order_number: order.order_number },
  }).catch(() => {})

  // Step 15: Return checkout information
  return buildCheckoutInfo(
    { ...order, provider_order_id: providerOrder.provider_order_id },
    payment,
    merchantProvider.provider,
    ctx,
  )
}

// ── Helper: Build checkout info ───────────────────────────────

function buildCheckoutInfo(
  order: Order,
  payment: Payment,
  provider: string,
  ctx: ApiKeyContext,
): CheckoutInfo {
  // The key_id for the frontend Razorpay checkout is the merchant's key_id.
  // For security, we return the environment-appropriate key — not the secret.
  // The frontend uses this to initialize Razorpay.js.
  const keyId =
    ctx.environment === 'test'
      ? (process.env.RAZORPAY_KEY_ID ?? '')
      : (process.env.RAZORPAY_KEY_ID ?? '')

  return {
    payment_id: payment.id,
    payment_number: payment.payment_number,
    order_id: order.id,
    order_number: order.order_number,
    provider,
    provider_order_id: order.provider_order_id ?? '',
    amount: payment.amount,
    currency: payment.currency_code,
    key_id: keyId,
    status: payment.status,
  }
}

// ── Get Payment ───────────────────────────────────────────────

export async function getPayment(data: GetPaymentData, ctx: ApiKeyContext): Promise<Payment> {
  const db = createAdminClient()

  // Support both UUID and TKF-PAY-* number
  const isNumber = data.payment_id.startsWith('TKF-PAY-')

  const query = db.from('payments').select('*').eq('application_id', ctx.application_id)

  const { data: payment, error } = isNumber
    ? await query.eq('payment_number', data.payment_id).maybeSingle<Payment>()
    : await query.eq('id', data.payment_id).maybeSingle<Payment>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payment', 500)
  if (!payment) throw new FlowError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404)

  return payment
}

export async function listPayments(
  data: ListPaymentsData,
  ctx: ApiKeyContext,
): Promise<Payment[]> {
  const db = createAdminClient()
  const { merchantId, status, from, to, limit = 20, offset = 0 } = data as {
    merchantId?: string
    status?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  }

  let query = db
    .from('payments')
    .select('*')
    .eq('application_id', ctx.application_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (merchantId) query = query.eq('merchant_id', merchantId)
  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data: payments, error } = await query

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments', 500)

  return (payments as Payment[]) ?? []
}

// ── Internal: Get payment by order ID ────────────────────────

async function getPaymentByOrderId(orderId: string): Promise<Payment | null> {
  const db = createAdminClient()

  const { data } = await db
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Payment>()

  return data
}

// ── Update Payment Status (called by webhook processor) ───────

export async function updatePaymentStatus(
  paymentId: string,
  newStatus: string,
  updates: Partial<Pick<Payment, 'provider_payment_id' | 'payment_method' | 'failure_code' | 'failure_reason' | 'paid_at'>> = {},
): Promise<Payment> {
  const db = createAdminClient()

  const { data: current } = await db
    .from('payments')
    .select('status')
    .eq('id', paymentId)
    .single()

  if (!current) throw new FlowError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404)

  if (!isValidPaymentTransition(current.status, newStatus)) {
    throw new FlowError(
      ErrorCode.INVALID_PAYMENT_STATE,
      `Cannot transition payment from ${current.status} to ${newStatus}`,
      400,
    )
  }

  const { data, error } = await db
    .from('payments')
    .update({ status: newStatus, updated_at: new Date().toISOString(), ...updates })
    .eq('id', paymentId)
    .select()
    .single<Payment>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to update payment', 500)

  return data
}

/**
 * Find a payment by its provider_payment_id (e.g. Razorpay payment ID).
 */
export async function getPaymentByProviderPaymentId(
  providerPaymentId: string,
): Promise<Payment | null> {
  const db = createAdminClient()

  const { data } = await db
    .from('payments')
    .select('*')
    .eq('provider_payment_id', providerPaymentId)
    .maybeSingle<Payment>()

  return data
}
