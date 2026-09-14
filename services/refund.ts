// ============================================================
// Trim Key Flow — Refund Service
// Supports partial refunds, multiple refunds per payment
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import { isValidRefundTransition } from '@/types/payment'
import { getProviderAdapter, resolveDefaultProvider } from '@/services/merchant'
import { logAuditEvent, AuditAction } from '@/services/audit'
import type { Refund, RefundInsert, Payment } from '@/types/database'
import type { ApiKeyContext } from '@/types/api'
import type { CreateRefundData, GetRefundData } from '@/types/api'

// ── Refund ID Generation ──────────────────────────────────────

async function generateRefundNumber(): Promise<string> {
  const db = createAdminClient()
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `TKF-REF-${today}-`

  const { count } = await db
    .from('refunds')
    .select('*', { count: 'exact', head: true })
    .like('refund_number', `${prefix}%`)

  const sequence = String((count ?? 0) + 1).padStart(6, '0')
  return `${prefix}${sequence}`
}

// ── Calculate refundable amount ───────────────────────────────

async function getRefundableAmount(paymentId: string): Promise<number> {
  const db = createAdminClient()

  const { data: payment } = await db
    .from('payments')
    .select('amount')
    .eq('id', paymentId)
    .single<Pick<Payment, 'amount'>>()

  if (!payment) return 0

  const { data: refunds } = await db
    .from('refunds')
    .select('amount')
    .eq('payment_id', paymentId)
    .in('status', ['PENDING', 'PROCESSING', 'SUCCESS'])

  const refunded = (refunds ?? []).reduce(
    (sum: number, r: { amount: number }) => sum + Number(r.amount),
    0,
  )

  return Number(payment.amount) - refunded
}

// ── Create Refund ─────────────────────────────────────────────

export async function createRefund(
  data: CreateRefundData,
  ctx: ApiKeyContext,
): Promise<Refund> {
  const db = createAdminClient()

  // 1. Find the payment
  const isNumber = data.payment_id.startsWith('TKF-PAY-')
  const { data: payment, error: fetchErr } = isNumber
    ? await db.from('payments').select('*').eq('payment_number', data.payment_id).eq('application_id', ctx.application_id).maybeSingle<Payment>()
    : await db.from('payments').select('*').eq('id', data.payment_id).eq('application_id', ctx.application_id).maybeSingle<Payment>()

  if (fetchErr || !payment) {
    throw new FlowError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404)
  }

  // 2. Verify payment is refundable
  if (!['SUCCESS', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
    throw new FlowError(
      ErrorCode.PAYMENT_NOT_REFUNDABLE,
      `Payment in status '${payment.status}' cannot be refunded`,
      400,
    )
  }

  // 3. Verify amount
  if (!payment.provider_payment_id) {
    throw new FlowError(ErrorCode.PAYMENT_NOT_REFUNDABLE, 'Payment has no provider payment ID', 400)
  }

  const refundable = await getRefundableAmount(payment.id)
  if (data.amount > refundable) {
    throw new FlowError(
      ErrorCode.OVER_REFUND,
      `Refund amount (${data.amount}) exceeds refundable amount (${refundable})`,
      400,
    )
  }

  // 4. Generate refund number
  const refundNumber = await generateRefundNumber()

  // 5. Create Flow refund record
  const refundInsert: RefundInsert = {
    refund_number: refundNumber,
    payment_id: payment.id,
    amount: data.amount,
    currency_code: payment.currency_code,
    provider_refund_id: null,
    status: 'PENDING',
    reason: data.reason ?? null,
    metadata: null,
    completed_at: null,
  }

  const { data: refund, error } = await db
    .from('refunds')
    .insert(refundInsert)
    .select()
    .single<Refund>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to create refund record', 500)

  // 6. Call provider
  const merchantProvider = await resolveDefaultProvider(payment.merchant_id)
  const provider = await getProviderAdapter(merchantProvider)

  try {
    const providerRefund = await provider.createRefund({
      provider_payment_id: payment.provider_payment_id,
      amount: data.amount,
      refund_number: refundNumber,
      reason: data.reason,
    })

    // 7. Update refund with provider ID
    const { data: updated } = await db
      .from('refunds')
      .update({
        provider_refund_id: providerRefund.provider_refund_id,
        status: 'PROCESSING',
        updated_at: new Date().toISOString(),
      })
      .eq('id', refund.id)
      .select()
      .single<Refund>()

    // 8. Update payment status
    const newPaymentStatus = refundable - data.amount <= 0 ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
    await db
      .from('payments')
      .update({ status: newPaymentStatus, updated_at: new Date().toISOString() })
      .eq('id', payment.id)

    // Audit
    logAuditEvent({
      action: AuditAction.REFUND_CREATED,
      resourceType: 'refund',
      resourceId: refund.id,
      organizationId: ctx.organization_id,
      applicationId: ctx.application_id,
      metadata: { refund_number: refundNumber, amount: data.amount },
    }).catch(() => {})

    return updated ?? refund
  } catch (err) {
    // Mark refund as failed
    await db
      .from('refunds')
      .update({ status: 'FAILED', updated_at: new Date().toISOString() })
      .eq('id', refund.id)

    throw err
  }
}

// ── Get Refund ────────────────────────────────────────────────

export async function getRefund(data: GetRefundData, ctx: ApiKeyContext): Promise<Refund> {
  const db = createAdminClient()

  const isNumber = data.refund_id.startsWith('TKF-REF-')

  // Join to payments to scope by application
  const { data: refund, error } = isNumber
    ? await db.from('refunds').select('*, payments!inner(application_id)').eq('refund_number', data.refund_id).eq('payments.application_id', ctx.application_id).maybeSingle()
    : await db.from('refunds').select('*, payments!inner(application_id)').eq('id', data.refund_id).eq('payments.application_id', ctx.application_id).maybeSingle()

  if (error || !refund) throw new FlowError(ErrorCode.REFUND_NOT_FOUND, 'Refund not found', 404)

  return refund as Refund
}

// ── Update Refund Status (called by webhook) ──────────────────

export async function updateRefundStatus(
  refundId: string,
  newStatus: string,
  updates: Partial<Pick<Refund, 'completed_at'>> = {},
): Promise<Refund> {
  const db = createAdminClient()

  const { data: current } = await db
    .from('refunds')
    .select('status')
    .eq('id', refundId)
    .single()

  if (!current) throw new FlowError(ErrorCode.REFUND_NOT_FOUND, 'Refund not found', 404)

  if (!isValidRefundTransition(current.status, newStatus)) {
    throw new FlowError(
      ErrorCode.INVALID_PAYMENT_STATE,
      `Cannot transition refund from ${current.status} to ${newStatus}`,
      400,
    )
  }

  const { data, error } = await db
    .from('refunds')
    .update({ status: newStatus, updated_at: new Date().toISOString(), ...updates })
    .eq('id', refundId)
    .select()
    .single<Refund>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to update refund', 500)

  return data
}
